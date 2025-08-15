# Blue Data Analytics Dashboard

A professional, production-grade data analytics dashboard for Cleanon grease trap recycling facility, built with a clean, modular architecture.

## 🏗️ Project Structure

```
Bluedata-update1/
├── 📁 backend/                    # Python backend application
│   ├── app/                      # Main application
│   │   └── main.py              # Flask application entry point
│   ├── api/                      # API endpoints and routes
│   ├── models/                   # Data models and schemas
│   ├── utils/                    # Utility functions
│   │   ├── helpers/              # Core utilities
│   │   │   ├── data_processor.py # Data loading and processing
│   │   │   └── model_trainer.py  # ML model training
│   │   └── analysis/             # Business intelligence
│   │       └── business_analyzer.py
│   ├── config/                   # Configuration files
│   │   └── settings.py           # Project settings and paths
│   ├── scripts/                  # Utility scripts
│   │   ├── analysis/             # Data analysis scripts
│   │   ├── setup/                # Setup and installation scripts
│   │   └── deployment/           # Deployment scripts
│   ├── tests/                    # Test files
│   ├── logs/                     # Application logs
│   └── requirements.txt          # Python dependencies
├── 📁 frontend/                  # React frontend application
│   ├── src/                      # Source code
│   ├── public/                   # Public assets
│   ├── build/                    # Build output
│   ├── package.json              # Node.js dependencies
│   └── tailwind.config.js        # Tailwind CSS configuration
├── 📁 data/                      # Data management
│   ├── raw/                      # Raw Excel files
│   ├── processed/                # Processed data cache
│   ├── results/                  # Analysis results
│   ├── exports/                  # Data exports
│   └── backups/                  # Data backups
├── 📁 models/                    # Machine learning models
│   ├── saved/                    # Pre-trained models
│   ├── trained/                  # Trained models
│   └── evaluation/               # Model evaluation results
├── 📁 docs/                      # Documentation
│   ├── technical/                # Technical documentation
│   ├── user/                     # User guides
│   └── api/                      # API documentation
├── 📁 scripts/                   # Project scripts
│   ├── deployment/               # Deployment automation
│   ├── setup/                    # Setup and installation
│   └── analysis/                 # Data analysis automation
├── 📁 logs/                      # System logs
│   ├── application/              # Application logs
│   ├── errors/                   # Error logs
│   └── performance/              # Performance logs
└── 📁 .git/                      # Git repository
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Start the Dashboard
```bash
# Make startup script executable
chmod +x scripts/setup/start_dashboard.sh

# Start the complete dashboard
./scripts/setup/start_dashboard.sh
```

### 2. Manual Setup

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/main.py
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Access the Dashboard
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

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

## 🔧 Development

### Project Organization
- **Backend**: Python Flask application with modular architecture
- **Frontend**: React application with modern UI components
- **Data**: Organized data pipeline with raw, processed, and results
- **Models**: ML model management and persistence
- **Documentation**: Comprehensive technical and user documentation

### Adding New Features
1. **New API Endpoints**: Add to `backend/api/`
2. **New Utilities**: Add to `backend/utils/`
3. **New Models**: Add to `backend/models/`
4. **New Frontend Components**: Add to `frontend/src/`

### Configuration
- All settings in `backend/config/settings.py`
- Environment-specific configurations supported
- Comprehensive logging configuration

## 📁 Data Management

### Data Flow
1. **Raw Data**: Excel files in `data/raw/`
2. **Processing**: Data cleaning and feature engineering
3. **Storage**: Processed data cached in `data/processed/`
4. **Analysis**: Business intelligence generation
5. **Results**: Analysis results saved to `data/results/`

### Data Persistence
- Processed data automatically cached
- Models automatically saved after training
- Analysis results timestamped and stored
- Export functionality for business users

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
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
EXPOSE 5001
CMD ["python", "app/main.py"]
```

## 📚 Documentation

- **Technical Docs**: `docs/technical/`
- **User Guides**: `docs/user/`
- **API Reference**: `docs/api/`
- **Code Documentation**: Inline docstrings and type hints

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes following project structure
3. Add tests
4. Update documentation
5. Submit pull request

### Code Standards
- PEP 8 compliance for Python
- ESLint compliance for JavaScript
- Type hints and comprehensive error handling
- Logging throughout the application

## 📄 License

This project is proprietary software developed for Cleanon. All rights reserved.

## 🆘 Support

For technical support:
- Check logs in `logs/` directory
- Review documentation in `docs/`
- Check API health endpoint
- Verify data file integrity

---

**Built with ❤️ for Cleanon Grease Trap Recycling Facility**

