from __future__ import annotations
from io import BytesIO
from zipfile import ZipFile
from typing import Optional
import requests
import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

app = FastAPI(title="WattWise AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

UCI_URL = "https://archive.ics.uci.edu/static/public/235/individual+household+electric+power+consumption.zip"
FEATURES = ["dayofweek","day","month","quarter","dayofyear","is_weekend",
            "lag_1","lag_2","lag_7","lag_14","rolling_7","rolling_14"]
state = {"daily": None, "raw": None, "model": None, "metrics": None, "test": None, "pred": None, "source": None}

def normalize(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()
    df.columns = [str(c).strip() for c in df.columns]
    lower = {c.lower(): c for c in df.columns}
    if "date" in lower and "time" in lower:
        dt = pd.to_datetime(df[lower["date"]].astype(str) + " " + df[lower["time"]].astype(str),
                            dayfirst=True, errors="coerce")
    elif "datetime" in lower:
        dt = pd.to_datetime(df[lower["datetime"]], errors="coerce")
    elif "date" in lower:
        dt = pd.to_datetime(df[lower["date"]], errors="coerce")
    else:
        raise ValueError("CSV needs Date + Time or datetime/date column.")
    target = lower.get("global_active_power") or lower.get("consumption_kwh") or lower.get("kwh") or lower.get("usage")
    if target is None:
        raise ValueError("Could not find Global_active_power or consumption_kwh/kwh/usage column.")
    values = pd.to_numeric(df[target], errors="coerce")
    temp = pd.DataFrame({"datetime": dt, "value": values}).dropna().set_index("datetime").sort_index()
    if target.lower() == "global_active_power":
        daily = temp["value"].resample("D").sum(min_count=1) / 60.0
    else:
        daily = temp["value"].resample("D").sum(min_count=1)
    daily = daily.replace([np.inf, -np.inf], np.nan).dropna()
    daily = daily[daily >= 0]
    if len(daily) < 35:
        raise ValueError("At least 35 days of valid data are required.")
    return daily.rename("consumption_kwh").to_frame()

def demo_data():
    rng = np.random.default_rng(42)
    dates = pd.date_range("2023-01-01", periods=420, freq="D")
    weekly = np.where(dates.dayofweek >= 5, 1.12, 0.96)
    seasonal = 1 + 0.18 * np.sin(2*np.pi*dates.dayofyear/365.25)
    trend = np.linspace(0, .12, len(dates))
    noise = rng.normal(0, .12, len(dates))
    values = np.maximum(8.5 * weekly * seasonal * (1+trend) + noise, 1)
    return pd.DataFrame({"consumption_kwh": values}, index=dates)

def features(series):
    f = pd.DataFrame({"y": series})
    ix = f.index
    f["dayofweek"] = ix.dayofweek
    f["day"] = ix.day
    f["month"] = ix.month
    f["quarter"] = ix.quarter
    f["dayofyear"] = ix.dayofyear
    f["is_weekend"] = (ix.dayofweek >= 5).astype(int)
    f["lag_1"] = f.y.shift(1)
    f["lag_2"] = f.y.shift(2)
    f["lag_7"] = f.y.shift(7)
    f["lag_14"] = f.y.shift(14)
    f["rolling_7"] = f.y.shift(1).rolling(7).mean()
    f["rolling_14"] = f.y.shift(1).rolling(14).mean()
    return f.dropna()

def train():
    daily = state["daily"]
    f = features(daily["consumption_kwh"])
    split = int(len(f) * .8)
    tr, te = f.iloc[:split], f.iloc[split:]
    if len(te) < 5: raise ValueError("Not enough test samples.")
    model = RandomForestRegressor(n_estimators=220, max_depth=12, min_samples_leaf=2,
                                  random_state=42, n_jobs=-1)
    baseline = Ridge(alpha=1.0)
    model.fit(tr[FEATURES], tr.y)
    baseline.fit(tr[FEATURES], tr.y)
    pred = np.maximum(model.predict(te[FEATURES]), 0)
    state["model"] = model
    state["test"] = te
    state["pred"] = pred
    state["metrics"] = {
        "mae": float(mean_absolute_error(te.y, pred)),
        "rmse": float(np.sqrt(mean_squared_error(te.y, pred))),
        "r2": float(r2_score(te.y, pred)),
        "baseline_mae": float(mean_absolute_error(te.y, np.maximum(baseline.predict(te[FEATURES]), 0)))
    }

def ready():
    if state["daily"] is None or state["model"] is None:
        raise HTTPException(400, "Load a dataset first.")

def load_frame(raw, source):
    try:
        daily = normalize(raw)
        state.update(daily=daily, raw=raw, source=source)
        train()
    except Exception as e:
        state.update(daily=None, raw=None, model=None, metrics=None, test=None, pred=None)
        raise HTTPException(400, str(e))

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "WattWise AI"}

@app.post("/api/load-demo")
def load_demo():
    state.update(daily=demo_data(), raw=None, source="Synthetic demo data")
    train()
    return {"message": "Demo dataset loaded", "source": state["source"], "records": len(state["daily"])}

@app.post("/api/load-uci")
def load_uci():
    try:
        response = requests.get(UCI_URL, timeout=60)
        response.raise_for_status()
        zf = ZipFile(BytesIO(response.content))
        names = [n for n in zf.namelist() if n.lower().endswith(".txt")]
        if not names: raise ValueError("UCI archive did not contain a text dataset.")
        with zf.open(names[0]) as fp:
            raw = pd.read_csv(fp, sep=";", na_values=["?"], low_memory=False)
        load_frame(raw, "UCI Individual Household Electric Power Consumption")
        return {"message": "UCI dataset loaded", "source": state["source"], "records": len(state["daily"])}
    except HTTPException: raise
    except Exception as e: raise HTTPException(400, f"Could not download UCI dataset: {e}")

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    data = await file.read()
    try:
        if file.filename.lower().endswith(".zip"):
            zf = ZipFile(BytesIO(data))
            names = [n for n in zf.namelist() if n.lower().endswith(".txt")]
            if not names: raise ValueError("ZIP must contain a .txt dataset.")
            with zf.open(names[0]) as fp:
                raw = pd.read_csv(fp, sep=";", na_values=["?"], low_memory=False)
        else:
            sep = ";" if file.filename.lower().endswith(".txt") else ","
            raw = pd.read_csv(BytesIO(data), sep=sep, na_values=["?"])
        load_frame(raw, f"Uploaded: {file.filename}")
        return {"message": "File loaded", "source": state["source"], "records": len(state["daily"])}
    except HTTPException: raise
    except Exception as e: raise HTTPException(400, str(e))

@app.get("/api/overview")
def overview():
    ready()
    d = state["daily"]["consumption_kwh"]
    monthly = d.resample("MS").sum()
    weekday = d.groupby(d.index.day_name()).mean()
    order = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    return {
        "source": state["source"], "records": len(d),
        "start_date": d.index.min().strftime("%Y-%m-%d"),
        "end_date": d.index.max().strftime("%Y-%m-%d"),
        "total_kwh": round(float(d.sum()), 2), "avg_kwh": round(float(d.mean()), 2),
        "latest_kwh": round(float(d.iloc[-1]), 2),
        "monthly": [{"month": x.strftime("%b %Y"), "kwh": round(float(y),2)} for x,y in monthly.items()],
        "daily": [{"date": x.strftime("%Y-%m-%d"), "kwh": round(float(y),3)} for x,y in d.tail(90).items()],
        "weekday": [{"day": day, "kwh": round(float(weekday[day]),3)} for day in order if day in weekday.index],
        "metrics": state["metrics"]
    }

def make_row(history, date):
    vals = list(history)
    return pd.DataFrame([{
        "dayofweek": date.dayofweek, "day": date.day, "month": date.month,
        "quarter": date.quarter, "dayofyear": date.dayofyear,
        "is_weekend": int(date.dayofweek >= 5),
        "lag_1": vals[-1], "lag_2": vals[-2], "lag_7": vals[-7], "lag_14": vals[-14],
        "rolling_7": float(np.mean(vals[-7:])), "rolling_14": float(np.mean(vals[-14:]))
    }])[FEATURES]

@app.get("/api/forecast")
def forecast(days: int = 7):
    ready()
    if days < 1 or days > 30: raise HTTPException(400, "days must be between 1 and 30.")
    daily = state["daily"]["consumption_kwh"]
    history = list(daily.astype(float).values)
    last = daily.index[-1]
    result = []
    for i in range(1, days+1):
        dt = last + pd.Timedelta(days=i)
        value = max(float(state["model"].predict(make_row(history, dt))[0]), 0)
        result.append({"date": dt.strftime("%Y-%m-%d"), "kwh": round(value,3)})
        history.append(value)
    return {"days": days, "total_kwh": round(sum(x["kwh"] for x in result),2), "forecast": result}

@app.get("/api/anomalies")
def anomalies(contamination: float = 0.05):
    ready()
    if not 0.01 <= contamination <= 0.15: raise HTTPException(400, "contamination must be 0.01–0.15")
    d = state["daily"]["consumption_kwh"]
    detector = IsolationForest(contamination=contamination, random_state=42)
    labels = detector.fit_predict(d.to_frame())
    out = [{"date": dt.strftime("%Y-%m-%d"), "kwh": round(float(v),3)}
           for (dt,v), label in zip(d.items(), labels) if label == -1]
    return {"count": len(out), "anomalies": out[-60:]}

class BillRequest(BaseModel):
    days: int = Field(default=30, ge=1, le=30)
    tariff: float = Field(default=7.0, ge=0)
    fixed_charge: float = Field(default=100, ge=0)
    saving_percent: float = Field(default=10, ge=0, le=80)
    emission_factor: float = Field(default=0.7, ge=0)

@app.post("/api/bill")
def bill(req: BillRequest):
    fc = forecast(req.days)
    units = fc["total_kwh"]
    energy = units * req.tariff
    return {
        "units": units, "energy_charge": round(energy,2),
        "fixed_charge": req.fixed_charge, "estimated_bill": round(energy+req.fixed_charge,2),
        "saving_units": round(units*req.saving_percent/100,2),
        "saving_rupees": round(energy*req.saving_percent/100,2),
        "co2_kg": round(units*req.emission_factor,2)
    }

@app.get("/api/evaluation")
def evaluation():
    ready()
    te, pred = state["test"], state["pred"]
    rows = []
    for dt, actual, estimate in zip(te.index[-90:], te.y.values[-90:], pred[-90:]):
        rows.append({"date": dt.strftime("%Y-%m-%d"), "actual": round(float(actual),3),
                     "predicted": round(float(estimate),3)})
    return {"metrics": state["metrics"], "comparison": rows}
