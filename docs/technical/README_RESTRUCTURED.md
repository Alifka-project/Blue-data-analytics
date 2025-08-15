# Blue Data Analytics Dashboard - Restructured

A professional, production-grade data analytics dashboard for Cleanon grease trap recycling facility, built with a clean, modular architecture.

## 🏗️ Project Structure

```
Bluedata-update1/
├── 📁 data/
│   ├── raw/                    # Raw Excel files (Blue-data2.xlsx)
│   ├── processed/              # Processed data (pickle files)
│   └── results/                # Analysis results and exports
├── 📁 models/
│   ├── saved/                  # Pre-trained model templates
│   └── trained/                # Trained ML models (joblib files)
├── 📁 utils/
│   ├── helpers/                # Core utilities
│   │   ├── data_processor.py   # Data loading and processing
│   │   └── model_trainer.py    # ML model training
│   └── analysis/               # Business intelligence
│       └── business_analyzer.py # Business insights generation
├── 📁 config/
│   └── settings.py             # Configuration and paths
├── 📁 logs/                    # Application logs
├── 📁 src/                     # React frontend
├── app.py                      # Main Flask application
├── requirements.txt             # Python dependencies
└── start_dashboard_restructured.sh # Startup script
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Bluedata-update1
```

### 2. Start the Dashboard
```bash
chmod +x start_dashboard_restructured.sh
./start_dashboard_restructured.sh
```

This script will:
- Create a Python virtual environment
- Install all dependencies
- Start the Python backend (port 5001)
- Start the React frontend (port 3000)

### 3. Access the Dashboard
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 🔧 Manual Setup

### Python Backend
```bash
# Create virtual environment
python3 -m venv clean_env
source clean_env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend
python app.py
```

### React Frontend
```bash
# Install dependencies
npm install

# Start frontend
npm start
```

## 📊 Features

### 1. **Professional Summary EDA & Predictions**
- Executive-level KPIs and metrics
- Monthly trends and forecasts
- High-risk outlet identification
- Revenue and service analytics

### 2. **Full Dataset Exploration & Derived Insights**
- Dynamic filtering by area, category, grade
- Outlet rankings and performance metrics
- Geographic and category-based analysis
- Calculated risk indices

### 3. **Predictive Model (Inspection & Collection Forecasting)**
- Machine learning models for missed cleaning prediction
- Volume forecasting models
- Feature importance analysis
- Model accuracy metrics

### 4. **Enhanced Chatbot with Business Logic**
- Context-aware business intelligence
- Natural language query processing
- Actionable recommendations
- Risk alerts and insights

### 5. **Prediction-Based Inspection Scheduling & Route Planning**
- Optimized inspector routes
- Weekly scheduling with priority ranking
- Geographic clustering
- Export functionality (CSV/Excel)

## 🧠 Machine Learning Models

### Models Trained
1. **Missed Cleaning Prediction** (Random Forest Classifier)
   - Predicts which outlets are likely to miss cleanings
   - Features: Gallons collected, trap count, days since collection, efficiency

2. **Volume Prediction** (Random Forest Regressor)
   - Forecasts future grease waste volumes
   - Features: Trap count, days since collection

### Model Persistence
- Models are automatically saved to `models/trained/`
- Model metrics and performance data stored
- Automatic retraining when data changes

## 📈 Business Intelligence

### Revenue Analysis
- Monthly trends and growth patterns
- Seasonal analysis
- Geographic performance breakdown

### Operational Efficiency
- Service frequency analysis
- Trap efficiency metrics
- Risk assessment and scoring

### Geographic Performance
- Area and zone-based analysis
- Performance scoring and ranking
- Resource allocation insights

## 🔌 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/data/summary` - Data summary and KPIs
- `GET /api/data/exploration` - Detailed data exploration
- `GET /api/predictions` - ML model predictions
- `GET /api/scheduling` - Inspection scheduling
- `POST /api/chatbot` - AI chatbot queries

### Analysis Endpoints
- `GET /api/analysis/business-insights` - Comprehensive business insights
- `GET /api/analysis/summary` - Analysis summary

## 🛠️ Development

### Adding New Features
1. **New Data Processors**: Add to `utils/helpers/`
2. **New Analysis**: Add to `utils/analysis/`
3. **New Models**: Extend `ModelTrainer` class
4. **New API Endpoints**: Add to `app.py`

### Configuration
- All settings in `config/settings.py`
- Environment variables supported
- Logging configuration included

### Testing
```bash
# Test backend
curl http://localhost:5001/api/health

# Test data loading
python -c "from utils.helpers.data_processor import DataProcessor; dp = DataProcessor(); print(dp.load_data())"
```

## 📁 Data Management

### Data Flow
1. **Raw Data**: Excel files in `data/raw/`
2. **Processing**: Data cleaning and feature engineering
3. **Storage**: Processed data saved as pickle files
4. **Analysis**: Business intelligence generation
5. **Results**: Analysis results saved to `data/results/`

### Data Persistence
- Processed data automatically cached
- Models automatically saved after training
- Analysis results timestamped and stored

## 🔍 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check logs
tail -f logs/app.log

# Check dependencies
pip list | grep -E "(pandas|numpy|sklearn)"

# Check Excel file
ls -la data/raw/
```

#### Model Training Issues
```bash
# Check data quality
python -c "from utils.helpers.data_processor import DataProcessor; dp = DataProcessor(); dp.load_data(); print(dp.get_data_summary())"

# Check model directory
ls -la models/trained/
```

#### Frontend Issues
```bash
# Check backend connectivity
curl http://localhost:5001/api/health

# Check React build
npm run build
```

### Performance Optimization
- Data processing results cached
- Models loaded once at startup
- API responses optimized for frontend
- Large datasets processed in chunks

## 🚀 Deployment

### Production Considerations
- Use production WSGI server (Gunicorn)
- Environment variable configuration
- Database integration for large datasets
- Monitoring and logging setup

### Docker Support
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app.py"]
```

## 📚 Documentation

### Code Documentation
- All classes and methods documented
- Type hints included
- Example usage in docstrings

### API Documentation
- OpenAPI/Swagger support ready
- Endpoint descriptions
- Request/response examples

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Code Standards
- PEP 8 compliance
- Type hints
- Comprehensive error handling
- Logging throughout

## 📄 License

This project is proprietary software developed for Cleanon. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the logs in `logs/` directory
- Review the troubleshooting section
- Check API health endpoint
- Verify data file integrity

---

**Built with ❤️ for Cleanon Grease Trap Recycling Facility**
