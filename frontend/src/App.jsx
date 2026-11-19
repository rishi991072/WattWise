import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, Zap, LayoutDashboard, TrendingUp, ChartNoAxesCombined, ShieldAlert,
  ReceiptIndianRupee, Settings, Leaf, Upload, RefreshCw, Download, Menu,
  ChevronRight, CalendarDays, Sparkles, CircleHelp, Database, CheckCircle2,
  AlertTriangle, Lightbulb, Gauge, FileSpreadsheet
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n || 0);
const number = n => new Intl.NumberFormat('en-IN',{maximumFractionDigits:1}).format(n || 0);

async function request(path, options={}) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json().catch(()=>({detail:'Unexpected server response'}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

const nav = [
  ['Overview',LayoutDashboard],['Forecast',TrendingUp],['Usage insights',ChartNoAxesCombined],
  ['Anomaly detection',ShieldAlert],['Bill & savings',ReceiptIndianRupee],['Model performance',Activity]
];

function Metric({icon:Icon,label,value,sub,accent='blue'}) {
  return <div className="metric-card">
    <div className={`metric-icon ${accent}`}><Icon size={19}/></div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    <div className="metric-sub">{sub}</div>
  </div>;
}

function ChartTip({active,payload,label}) {
  if(!active || !payload?.length) return null;
  return <div className="chart-tip"><b>{label}</b>{payload.map((p,i)=><div key={i}><span style={{color:p.color}}>●</span> {p.name}: <b>{number(p.value)} kWh</b></div>)}</div>;
}

export default function App(){
  const [page,setPage]=useState('Overview');
  const [overview,setOverview]=useState(null);
  const [forecast,setForecast]=useState(null);
  const [anomalies,setAnomalies]=useState(null);
  const [evaluation,setEvaluation]=useState(null);
  const [bill,setBill]=useState(null);
  const [days,setDays]=useState(7);
  const [tariff,setTariff]=useState(7);
  const [fixed,setFixed]=useState(100);
  const [saving,setSaving]=useState(10);
  const [factor,setFactor]=useState(.7);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [source,setSource]=useState('');
  const [mobileOpen,setMobileOpen]=useState(false);

  const refresh = async () => {
    setBusy(true); setError('');
    try {
      const ov=await request('/api/overview');
      setOverview(ov); setSource(ov.source);
      const [fc,an,ev]=await Promise.all([
        request(`/api/forecast?days=${days}`),request('/api/anomalies'),request('/api/evaluation')
      ]);
      setForecast(fc);setAnomalies(an);setEvaluation(ev);
      const b=await request('/api/bill',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({days:30,tariff,fixed_charge:fixed,saving_percent:saving,emission_factor:factor})});
      setBill(b);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  };

  useEffect(()=>{ refresh(); },[]);
  useEffect(()=>{ if(overview) refresh(); },[days]);

  const load = async (kind,file) => {
    setBusy(true);setError('');setNotice('');
    try {
      let result;
      if(kind==='upload'){
        const fd=new FormData();fd.append('file',file);
        result=await request('/api/upload',{method:'POST',body:fd});
      } else result=await request(`/api/load-${kind}`,{method:'POST'});
      setNotice(`${result.message} · ${result.records.toLocaleString()} daily records`);
      await refresh();
    } catch(e){setError(e.message);}
    finally{setBusy(false);}
  };

  const calcBill = async () => {
    try{
      const b=await request('/api/bill',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({days:30,tariff:Number(tariff),fixed_charge:Number(fixed),saving_percent:Number(saving),emission_factor:Number(factor)})});
      setBill(b);
    }catch(e){setError(e.message);}
  };

  const exportForecast = () => {
    if(!forecast)return;
    const csv=['date,predicted_kwh',...forecast.forecast.map(x=>`${x.date},${x.kwh}`)].join('\\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    const a=document.createElement('a');a.href=url;a.download='wattwise_forecast.csv';a.click();URL.revokeObjectURL(url);
  };

  const pageTitle = page;
  const chartData = useMemo(()=>overview?.daily?.map(x=>({...x,date:x.date.slice(5)})) || [],[overview]);
  const compareData = evaluation?.comparison || [];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="brand">
        <div className="brand-mark"><Zap size={22} fill="currentColor"/></div>
        <div><div className="brand-name">wattwise<span>AI</span></div><div className="brand-caption">ENERGY INTELLIGENCE</div></div>
      </div>
      <div className="workspace"><div className="workspace-dot"></div><div><b>Personal workspace</b><small>Energy analytics</small></div><ChevronRight size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(([name,Icon])=><button key={name} onClick={()=>{setPage(name);setMobileOpen(false)}} className={`nav-item ${page===name?'active':''}`}><Icon size={18}/><span>{name}</span>{page===name&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><Sparkles size={16}/></div><b>WattWise insights</b><p>Turn energy data into smarter everyday decisions.</p></div>
        <div className="profile"><div className="avatar">WW</div><div><b>Project workspace</b><small>Student edition</small></div><Settings size={17}/></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu/></button>
        <div className="crumb">Workspace <span>/</span> <b>{pageTitle}</b></div>
        <div className="top-actions">
          <div className="live-pill"><span></span> SYSTEM {overview?'READY':'IDLE'}</div>
          <button className="icon-button" title="Refresh data" onClick={refresh}><RefreshCw size={17} className={busy?'spin':''}/></button>
          <div className="avatar small-avatar">WW</div>
        </div>
      </header>

      <section className="content">
        <div className="page-heading">
          <div><div className="eyebrow">ENERGY ANALYTICS PLATFORM</div><h1>{pageTitle}</h1>
            <p>{page==='Overview'?'Monitor consumption, understand patterns and stay ahead of energy costs.':`Explore ${page.toLowerCase()} with your household electricity data.`}</p></div>
          <div className="heading-actions">
            <label className="upload-btn"><Upload size={16}/> Upload dataset<input type="file" accept=".csv,.txt,.zip" onChange={e=>e.target.files?.[0]&&load('upload',e.target.files[0])}/></label>
            <button className="primary-btn" onClick={()=>load('uci')} disabled={busy}><Database size={16}/> Load UCI data</button>
          </div>
        </div>

        {(error||notice)&&<div className={error?'alert error':'alert success'}>{error?<AlertTriangle size={17}/>:<CheckCircle2 size={17}/>}<span>{error||notice}</span><button onClick={()=>{setError('');setNotice('')}}>×</button></div>}
        {!overview&&<div className="welcome-panel"><div className="welcome-orb"><Zap size={30}/></div><h2>Welcome to WattWise AI</h2><p>Load the public UCI household electricity dataset, upload your own CSV, or start with sample data.</p><div className="welcome-actions"><button className="primary-btn" onClick={()=>load('demo')} disabled={busy}>Explore demo dashboard <ChevronRight size={16}/></button><button className="secondary-btn" onClick={()=>load('uci')} disabled={busy}>Load real UCI dataset</button></div><small>Demo data is synthetic and intended only for preview.</small></div>}

        {overview&&<>
          <div className="data-strip"><div className="data-source"><Database size={14}/> {source}</div><span><CalendarDays size={14}/> {overview.start_date} — {overview.end_date}</span><span><i className="green-dot"/> {overview.records.toLocaleString()} daily records</span></div>

          {page==='Overview'&&<>
            <div className="metrics-grid">
              <Metric icon={Zap} label="TOTAL CONSUMPTION" value={`${number(overview.total_kwh)} kWh`} sub="Across loaded history" accent="blue"/>
              <Metric icon={Gauge} label="DAILY AVERAGE" value={`${number(overview.avg_kwh)} kWh`} sub="Average per day" accent="violet"/>
              <Metric icon={Activity} label="LATEST READING" value={`${number(overview.latest_kwh)} kWh`} sub="Most recent day" accent="amber"/>
              <Metric icon={TargetIcon} label="MODEL MAE" value={`${number(overview.metrics.mae)} kWh`} sub="Lower is better" accent="green"/>
            </div>
            <div className="grid-main">
              <div className="panel large-panel"><div className="panel-head"><div><h3>Consumption trend</h3><p>Daily energy usage · last 90 days</p></div><span className="tag">HISTORICAL</span></div>
                <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f8cff" stopOpacity={.28}/><stop offset="100%" stopColor="#4f8cff" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f7"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b98aa'}} interval="preserveStartEnd"/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b98aa'}}/><Tooltip content={<ChartTip/>}/><Area type="monotone" dataKey="kwh" name="Consumption" stroke="#4f8cff" strokeWidth={2.5} fill="url(#areaBlue)"/></AreaChart></ResponsiveContainer></div>
              </div>
              <div className="panel insight-panel"><div className="panel-head"><div><h3>Energy coach</h3><p>Smart observations</p></div><Sparkles size={18} color="#8b6cff"/></div>
                <div className="insight-feature"><div className="insight-symbol"><Lightbulb size={20}/></div><div><b>Build an efficient routine</b><p>Compare weekday and weekend usage to identify when your home consumes more power.</p></div></div>
                <div className="insight-row"><span>Average daily usage</span><b>{number(overview.avg_kwh)} kWh</b></div>
                <div className="insight-row"><span>Latest day vs average</span><b className={overview.latest_kwh>overview.avg_kwh?'orange':'green'}>{overview.latest_kwh>overview.avg_kwh?'+':''}{number((overview.latest_kwh/overview.avg_kwh-1)*100)}%</b></div>
                <div className="coach-note"><Leaf size={16}/> Tip: switch off standby devices and track the impact over the next week.</div>
              </div>
            </div>
            <div className="panel"><div className="panel-head"><div><h3>Monthly energy profile</h3><p>Total electricity consumed each month</p></div><span className="tag">MONTHLY</span></div>
              <div className="chart-wrap short"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f7"/><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b98aa'}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b98aa'}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="kwh" name="Monthly usage" fill="#6d7df6" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
            </div>
          </>}

          {page==='Forecast'&&<><div className="panel forecast-controls"><div><h3>Future consumption forecast</h3><p>Recursive daily predictions using a Random Forest model.</p></div><div className="control-right"><select value={days} onChange={e=>setDays(Number(e.target.value))}>{[7,14,21,30].map(x=><option key={x} value={x}>{x} days</option>)}</select><button className="secondary-btn" onClick={exportForecast}><Download size={15}/> Export CSV</button></div></div>
            <div className="metrics-grid three"><Metric icon={TrendingUp} label="FORECAST TOTAL" value={`${number(forecast?.total_kwh)} kWh`} sub={`Next ${days} days`} accent="violet"/><Metric icon={CalendarDays} label="FORECAST HORIZON" value={`${days} days`} sub="Adjust the period above" accent="blue"/><Metric icon={Gauge} label="DAILY FORECAST AVG" value={`${number((forecast?.total_kwh||0)/days)} kWh`} sub="Estimated average" accent="green"/></div>
            <div className="panel"><div className="panel-head"><div><h3>Predicted consumption</h3><p>Forecast values are estimates, not guaranteed readings.</p></div><span className="tag purple">AI FORECAST</span></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecast?.forecast||[]}><defs><linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9274ff" stopOpacity={.3}/><stop offset="100%" stopColor="#9274ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f7"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b98aa'}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b98aa'}}/><Tooltip content={<ChartTip/>}/><Area type="monotone" dataKey="kwh" name="Predicted" stroke="#9274ff" strokeWidth={2.5} fill="url(#forecastGrad)"/></AreaChart></ResponsiveContainer></div></div>
            <div className="panel"><div className="panel-head"><div><h3>Daily forecast table</h3><p>Downloadable forecast values</p></div></div><DataTable rows={forecast?.forecast||[]} columns={[['date','Date'],['kwh','Predicted kWh']]}/></div>
          </>}

          {page==='Usage insights'&&<><div className="metrics-grid three"><Metric icon={CalendarDays} label="HISTORY COVERED" value={`${overview.records} days`} sub="Daily observations" accent="blue"/><Metric icon={Zap} label="HIGHEST DAILY USAGE" value={`${number(Math.max(...overview.daily.map(x=>x.kwh)))} kWh`} sub="Within recent 90 days" accent="amber"/><Metric icon={Activity} label="WEEKLY PATTERN" value="7 days" sub="Average by weekday" accent="violet"/></div><div className="panel"><div className="panel-head"><div><h3>Average consumption by weekday</h3><p>Understand your weekly usage rhythm</p></div></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview.weekday}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f7"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip content={<ChartTip/>}/><Bar dataKey="kwh" name="Average kWh" fill="#18b8a6" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div><div className="panel"><div className="panel-head"><div><h3>Monthly consumption history</h3><p>Full monthly totals</p></div></div><DataTable rows={overview.monthly} columns={[['month','Month'],['kwh','Consumption (kWh)']]}/></div></>}

          {page==='Anomaly detection'&&<><div className="metrics-grid three"><Metric icon={ShieldAlert} label="UNUSUAL DAYS" value={anomalies?.count??0} sub="Isolation Forest results" accent="amber"/><Metric icon={Activity} label="DETECTION METHOD" value="Isolation Forest" sub="Unsupervised ML" accent="violet"/><Metric icon={Database} label="DATA POINTS" value={overview.records} sub="Daily observations" accent="blue"/></div><div className="panel"><div className="panel-head"><div><h3>Unusual consumption events</h3><p>Statistical outliers that may deserve a closer look</p></div><span className="tag orange">ANOMALY SCAN</span></div><DataTable rows={anomalies?.anomalies||[]} columns={[['date','Date'],['kwh','Consumption (kWh)']]}/><div className="notice"><AlertTriangle size={16}/> An anomaly is a statistical outlier. It does not prove meter failure, theft or a specific appliance fault.</div></div></>}

          {page==='Bill & savings'&&<><div className="bill-layout"><div className="panel"><div className="panel-head"><div><h3>Bill assumptions</h3><p>Adjust the inputs to estimate your upcoming bill.</p></div></div><div className="form-grid"><label>Tariff per unit (₹)<input type="number" value={tariff} min="0" onChange={e=>setTariff(e.target.value)}/></label><label>Fixed monthly charge (₹)<input type="number" value={fixed} min="0" onChange={e=>setFixed(e.target.value)}/></label><label>Target usage reduction (%)<input type="number" value={saving} min="0" max="80" onChange={e=>setSaving(e.target.value)}/></label><label>Grid emission factor (kg CO₂/kWh)<input type="number" value={factor} min="0" step=".05" onChange={e=>setFactor(e.target.value)}/></label></div><button className="primary-btn full" onClick={calcBill}>Calculate estimate <ChevronRight size={16}/></button><div className="notice">Illustrative estimate only. Actual utility bills may include slab rates, taxes, duties and other charges.</div></div><div className="bill-result"><div className="bill-glow"></div><div className="bill-kicker">ESTIMATED 30-DAY BILL</div><div className="bill-amount">{money(bill?.estimated_bill)}</div><p>Based on predicted usage and your entered tariff</p><div className="bill-divider"></div><div className="bill-line"><span>Forecast units</span><b>{number(bill?.units)} kWh</b></div><div className="bill-line"><span>Energy charge</span><b>{money(bill?.energy_charge)}</b></div><div className="bill-line"><span>Fixed charge</span><b>{money(bill?.fixed_charge)}</b></div><div className="saving-box"><Leaf size={18}/><div><b>Potential savings</b><strong>{money(bill?.saving_rupees)}</strong><small>At {saving}% lower usage</small></div></div><div className="co2-line">Estimated footprint <b>{number(bill?.co2_kg)} kg CO₂</b></div></div></div></>}

          {page==='Model performance'&&<><div className="metrics-grid"><Metric icon={TargetIcon} label="MAE" value={`${number(evaluation?.metrics.mae)} kWh`} sub="Mean absolute error" accent="blue"/><Metric icon={Activity} label="RMSE" value={`${number(evaluation?.metrics.rmse)} kWh`} sub="Root mean squared error" accent="violet"/><Metric icon={Gauge} label="R² SCORE" value={number(evaluation?.metrics.r2)} sub="Coefficient of determination" accent="green"/><Metric icon={ChartNoAxesCombined} label="BASELINE MAE" value={`${number(evaluation?.metrics.baseline_mae)} kWh`} sub="Ridge regression" accent="amber"/></div><div className="panel"><div className="panel-head"><div><h3>Actual vs predicted</h3><p>Chronological holdout test period · last 90 available test points</p></div><span className="tag">MODEL VALIDATION</span></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={compareData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f7"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:11}} interval="preserveStartEnd"/><YAxis tickLine={false} axisLine={false}/><Tooltip content={<ChartTip/>}/><Legend/><Line type="monotone" dataKey="actual" name="Actual" stroke="#17b89f" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="predicted" name="Predicted" stroke="#7b6cf6" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div></div><div className="notice"><CircleHelp size={16}/> The test set uses later dates than training to reduce time-series leakage. Model scores depend on the dataset and forecast horizon.</div></>}
        </>}
        <footer><span>© 2026 WattWise AI</span><span>Built for smarter energy decisions <span className="footer-dot">•</span> AIML Minor Project</span></footer>
      </section>
    </main>
  </div>
}

function TargetIcon(props){return <Activity {...props}/>}

function DataTable({rows,columns}){
  if(!rows?.length)return <div className="empty-table">No records to display.</div>;
  return <div className="table-scroll"><table><thead><tr>{columns.map(([k,label])=><th key={k}>{label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(([k])=><td key={k}>{typeof r[k]==='number'?number(r[k]):r[k]}</td>)}</tr>)}</tbody></table></div>
}
