# WattWise AI — Premium Electricity Consumption Dashboard

A full-stack AIML minor project. This edition replaces Streamlit with:
- React + Vite premium responsive dashboard
- FastAPI Python backend
- Scikit-learn Random Forest forecasting
- Recharts visualizations
- Isolation Forest anomaly detection
- Bill estimation, savings calculator and carbon estimate

## Features
1. Electricity consumption overview and KPIs
2. Historical daily and monthly charts
3. 1–30 day recursive electricity forecast
4. Usage insights by weekday
5. Unusual consumption detection (Isolation Forest)
6. Bill estimator with configurable tariff and fixed charge
7. What-if savings and estimated CO2 footprint
8. Model evaluation: MAE, RMSE, R² and Ridge baseline
9. Upload own CSV/TXT/ZIP or load UCI data
10. Export forecast CSV

## Requirements
- Python 3.10+
- Node.js 18+
- Internet for UCI dataset download and frontend dependencies

## Run backend (terminal 1)
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\\Scripts\\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs

## Run frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## Dataset
UCI Individual Household Electric Power Consumption:
https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption

Click **Load UCI data** in the dashboard to download and process the public dataset.
You can also use **Explore demo dashboard** for synthetic demo data.

For custom CSV, include:
- `datetime` and `consumption_kwh`, or
- `Date`, `Time`, and `Global_active_power`.

For UCI data, `Global_active_power` is average kW for one-minute intervals.
Daily kWh is calculated as sum of readings divided by 60.

## Deployment
### Frontend: Vercel
1. Push the project to GitHub.
2. Import the `frontend` folder as the Vercel project root.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable `VITE_API_URL` with your deployed backend URL.

### Backend: Render / Railway
1. Create a Python web service using the `backend` folder as root.
2. Build/install command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set `VITE_API_URL` in Vercel to the backend public URL.
5. Update CORS allowed origin in `backend/main.py` to include your deployed frontend domain.

## Academic limitations
- The UCI dataset represents one household, not all Indian households.
- Forecasts are estimates based on historical patterns and can be inaccurate when household behavior or conditions change.
- Bill estimate is illustrative and does not model every state utility slab, tax or duty.
- Anomaly detection flags statistical outliers; it does not prove meter failure or electricity theft.
- The CO₂ factor is user-editable and should be replaced with a current official regional factor for research claims.
- Synthetic demo data must not be represented as real household readings.

## Suggested project title
**WattWise AI: A Machine Learning-Based Electricity Consumption Forecasting and Energy Intelligence Platform**
