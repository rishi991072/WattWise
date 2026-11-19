# ⚡ WattWise AI
### An Intelligent Machine Learning-Based Electricity Consumption Prediction and Energy Optimization System

**Predict. Monitor. Optimize. Save.**

WattWise AI is a smart electricity consumption prediction and energy optimization platform powered by Machine Learning. It helps users analyze electricity usage, forecast future consumption, detect unusual energy patterns, estimate electricity bills, and explore potential energy savings through an interactive dashboard.

---

## 🚀 Key Features

- **Electricity Consumption Prediction:** Forecast electricity consumption for the next 1–30 days using Machine Learning.
- **Interactive Dashboard:** View daily and monthly electricity consumption through visual charts.
- **Usage Insights:** Analyze electricity usage patterns and consumption trends.
- **Anomaly Detection:** Identify unusual electricity consumption using Isolation Forest.
- **Electricity Bill Estimation:** Estimate electricity bills in Indian Rupees (₹) using configurable tariff rates.
- **Energy Savings Calculator:** Explore potential savings by reducing electricity consumption.
- **Model Performance:** Evaluate prediction models using MAE, RMSE, and R².
- **Dataset Upload:** Upload custom electricity consumption datasets.
- **Demo Dataset:** Explore the dashboard using sample synthetic data.
- **CSV Export:** Download electricity consumption forecasts.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Python, FastAPI |
| Machine Learning | Scikit-learn |
| ML Algorithms | Random Forest, Ridge Regression, Isolation Forest |
| Data Processing | Pandas, NumPy |
| Visualization | Recharts |
| API Communication | REST API |
| Dataset | UCI Individual Household Electric Power Consumption |

---

## 🧠 Machine Learning Approach

WattWise AI uses multiple machine learning techniques:

### 1. Random Forest Regressor
Used to predict future electricity consumption based on historical consumption patterns and time-based features.

### 2. Ridge Regression
Used as a baseline model to compare forecasting performance.

### 3. Isolation Forest
Used to identify unusual electricity consumption patterns and potential anomalies.

### Model Evaluation Metrics

- **MAE:** Mean Absolute Error
- **RMSE:** Root Mean Squared Error
- **R² Score:** Coefficient of Determination

---

## 📊 Dashboard Modules

| Module | Description |
|---|---|
| Overview | Electricity consumption summary and key metrics |
| Forecast | Future electricity consumption prediction |
| Usage Insights | Daily and monthly consumption analysis |
| Anomaly Detection | Identification of unusual usage |
| Bill & Savings | Estimated electricity bill and savings |
| Model Performance | Machine learning evaluation metrics |

---

## 📁 Project Structure

```text
WattWise-AI/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── style.css
│   ├── index.html
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.10+
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/WattWise-AI.git
```

```bash
cd WattWise-AI
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 📂 Dataset Information

This project supports electricity consumption data from the **UCI Individual Household Electric Power Consumption Dataset**.

Dataset source:

https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption

The dataset contains household electricity measurements recorded at one-minute intervals.

WattWise AI can also use a synthetic demo dataset or compatible custom CSV/TXT/ZIP uploads.

**Note:** Synthetic demo data is for demonstration purposes and does not represent actual household meter readings.

---

## 🔮 Future Enhancements

- Real-time electricity monitoring through IoT smart meters.
- User authentication and personalized dashboards.
- Historical consumption tracking and database integration.
- Advanced forecasting models such as XGBoost and LSTM.
- Smart appliance-level energy analysis.
- Personalized energy-saving recommendations.
- Mobile application integration.
- Solar energy generation and consumption analysis.

---

## 🎯 Project Objective

The main objective of WattWise AI is to demonstrate how Machine Learning can be applied to electricity consumption forecasting, anomaly detection, and energy optimization.

The platform aims to help users understand their electricity usage, anticipate future consumption, estimate bills, and make more informed energy-saving decisions.

---

## 👨‍💻 Developer

**Rishi Kumar Yadav**

B.Tech – Computer Science & Engineering  
Guru Gobind Singh Indraprastha University (GGSIPU)

**Areas of Interest:** Python | Machine Learning | Artificial Intelligence | React.js | FastAPI

---

## 📜 License

This project is developed for academic and educational purposes.

---

⭐ If you find this project interesting, consider giving the repository a star!
