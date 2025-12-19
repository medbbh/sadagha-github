# SADA9A - Charitable Donations & Volunteering Platform

<div align="center">
  <img src="https://www.sada9a.com/logo.png" alt="SADA9A Logo" width="200"/>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
  [![Django](https://img.shields.io/badge/django-4.2-green.svg)](https://www.djangoproject.com/)
  [![React](https://img.shields.io/badge/react-19.0-61dafb.svg)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/fastapi-0.104.1-009688.svg)](https://fastapi.tiangolo.com/)
  [![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
</div>

## 📖 About

SADA9A is a modern digital platform designed to revolutionize charitable giving and volunteering in Mauritania. The platform connects donors, charitable organizations, and volunteers through a transparent, efficient, and user-friendly system.

### Key Features

- 🎯 **Campaign Management**: Create, manage, and track charitable campaigns
- 💰 **Transparent Donations**: Real-time tracking of funds with complete transparency
- 🤝 **Volunteer Management**: Match volunteers with opportunities based on skills and availability
- 📊 **Analytics Dashboard**: Comprehensive insights for organizations and administrators
- 🔐 **Multi-role Authentication**: Separate interfaces for donors, organizations, and administrators
- 🌐 **Multi-language Support**: Arabic, French, and English
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🔴 **Facebook Live Integration**: Stream activities directly to supporters
- 🤖 **AI-Powered Recommendations**: Intelligent campaign suggestions using multilingual sentence transformers

## 🏗️ Architecture

SADA9A follows a modern microservices architecture:

- **Backend**: Django 4.2 + Django REST Framework 3.16.0
- **AI Microservice**: FastAPI 0.104.1 with Sentence Transformers
- **Frontend**: React 19.0 with Vite 6.3.1
- **Database**: PostgreSQL 15+ (Supabase)
- **Cache & WebSockets**: Redis 7+ (Upstash) with Django Channels
- **Storage**: Supabase Storage
- **Deployment**: Google Cloud Run + Vercel
- **Containerization**: Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

- **Python 3.12**
- **Node.js 18+**
- **PostgreSQL 15+** (or Supabase account)
- **Redis 7+** (or Upstash account)
- **Pipenv** (for Python package management)
- **Docker & Docker Compose** (optional, for containerized setup)

### Installation Methods

Choose one of the following installation methods:

#### Option 1: Docker Setup (Recommended for Quick Start)

The easiest way to get started with SADA9A is using Docker:

1. **Clone the repository:**
```bash
git clone https://github.com/medbbh/sadagha-github.git
cd sadagha-github
```

2. **Configure environment variables:**

Create `.env` files for each service (see [Environment Variables](#-environment-variables) section below).

3. **Build and start services:**
```bash
# Build images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f ai-service
```

4. **Run database migrations (first time only):**
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

5. **Access the services:**
- Backend API: `http://localhost:8000`
- AI Service: `http://localhost:8001`
- Frontend: `http://localhost:5173` (run separately, see below)

6. **Stop services:**
```bash
docker-compose down

# Stop and remove volumes (caution: deletes data)
docker-compose down -v
```

**Docker Services Overview:**

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| Backend | `backend` | 8000 | Django REST API with Gunicorn |
| AI Service | `ai-service` | 8001 | FastAPI recommendation engine |

**Useful Docker Commands:**
```bash
# Rebuild specific service
docker-compose build backend

# Restart specific service
docker-compose restart backend

# Execute commands in running container
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py createsuperuser

# View container status
docker-compose ps

# Remove all stopped containers
docker-compose rm
```

#### Option 2: Manual Setup (For Development)

##### Backend Setup (Django)

1. **Clone the repository:**
```bash
git clone https://github.com/medbbh/sadagha-github.git
cd sadagha-github
```

2. **Navigate to backend directory and install dependencies:**
```bash
cd backend
pip install pipenv
pipenv install
pipenv shell
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```

4. **Run migrations:**
```bash
python manage.py migrate
```

5. **Create superuser:**
```bash
python manage.py createsuperuser
```

6. **Collect static files:**
```bash
python manage.py collectstatic --noinput
```

7. **Start development server:**
```bash
# Development server (Django)
python manage.py runserver

# Or production server (Gunicorn)
gunicorn sadagha.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

The backend will be available at `http://localhost:8000`

##### AI Microservice Setup (FastAPI)

1. **Navigate to AI service directory:**
```bash
cd recommendation_service
```

2. **Install dependencies:**
```bash
pip install pipenv
pipenv install
pipenv shell
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database configuration
```

4. **Start FastAPI server:**
```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Production
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

The AI service will be available at `http://localhost:8001`

**Note**: First run will download the `paraphrase-multilingual-MiniLM-L12-v2` model (~420MB).

##### Frontend Setup (React)

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env.local
# Edit .env.local (see Environment Variables section)
```

4. **Start development server:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
npm run preview  # Preview production build
```

The frontend will be available at `http://localhost:5173`

## 🐳 Docker Configuration Details

### Backend Dockerfile

The backend uses a multi-stage approach optimized for Cloud Run deployment:
```dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc postgresql-client libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput || echo "Skipping collectstatic"

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Run with Gunicorn
CMD exec gunicorn sadagha.wsgi:application --bind :$PORT --workers 4 --threads 8 --timeout 0
```

**Key Features:**
- Uses Python 3.12 slim for smaller image size
- Runs as non-root user for security
- Optimized for Google Cloud Run with `$PORT` environment variable
- 4 workers with 8 threads for concurrent request handling

### AI Service Dockerfile

The AI service uses a lightweight configuration:
```dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
```

**Key Features:**
- Lightweight FastAPI setup
- Downloads ML models on first run
- Uses environment `$PORT` for flexibility

### Docker Compose Configuration

Create a `docker-compose.yml` in the project root:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sada9a-backend
    ports:
      - "8000:8080"
    environment:
      - PORT=8080
    env_file:
      - ./backend/.env
    depends_on:
      - redis
    volumes:
      - ./backend:/app
    restart: unless-stopped

  ai-service:
    build:
      context: ./recommendation_service
      dockerfile: Dockerfile
    container_name: sada9a-ai-service
    ports:
      - "8001:8080"
    environment:
      - PORT=8080
    env_file:
      - ./recommendation_service/.env
    volumes:
      - ./recommendation_service:/app
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: sada9a-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Notes:**
- Redis is included for local development
- In production, use Upstash Redis instead
- Frontend is typically run separately or deployed to Vercel

## 📚 Documentation

- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

## 🌐 Production

The application is deployed at: [https://www.sada9a.com](https://www.sada9a.com)

**Deployment Architecture:**
- Backend & AI Service: Google Cloud Run (containerized)
- Frontend: Vercel
- Database: Supabase (PostgreSQL)
- Cache: Upstash Redis
- Storage: Supabase Storage
- CDN: Cloudflare

## 🛠️ Technology Stack

### Backend (Django)
- **Django** 4.2
- **Django REST Framework** 3.16.0
- **Django Channels** (WebSocket support)
- **Django CORS Headers** 4.7.0
- **Django Redis** 5.4.0
- **Django Filter** (API filtering)
- **Django Extensions** (development utilities)
- **Gunicorn** 21.2.0 (WSGI server)
- **Channels Redis** (async support)
- **PostgreSQL** via psycopg2 2.9.10
- **Supabase** Python Client 2.x
- **JWT** via PyJWT 2.10.1
- **Cryptography** 44.0.2
- **XlsxWriter** 3.1.9 (Excel exports)
- **ReportLab** 4.0.7 (PDF generation)

### AI Microservice (FastAPI)
- **FastAPI** 0.104.1
- **Uvicorn** 0.24.0 (ASGI server)
- **Sentence Transformers** (multilingual embeddings)
- **PyTorch** (ML framework)
- **Transformers** (Hugging Face)
- **Pandas** 2.1.3
- **Scikit-learn** (ML utilities)
- **NumPy** 1.26.4
- **SciPy** 1.16.2
- **SQLAlchemy** 2.0.23
- **PostgreSQL** via psycopg2-binary 2.9.9
- **Pydantic** 2.11.9 (data validation)

### Frontend
- **React** 19.0
- **Vite** 6.3.1 (build tool)
- **React Router DOM** 7.5.3
- **Redux Toolkit** 2.7.0
- **React Redux** 9.2.0
- **Redux Persist** 6.0.0
- **Axios** 1.9.0
- **Tailwind CSS** 4.1.5
- **DaisyUI** 5.0.35
- **Framer Motion** 12.9.5 (animations)
- **Recharts** 3.1.0 (charts)
- **React Icons** 5.5.0
- **Lucide React** 0.507.0
- **i18next** 25.3.2 (internationalization)
- **React i18next** 15.6.1
- **HeroUI/React** 2.7.8 (UI components)
- **Supabase JS** 2.49.4

### Infrastructure
- **Google Cloud Run** (Backend & AI service)
- **Vercel** (Frontend)
- **Upstash Redis** (Cache & WebSockets)
- **Supabase** (PostgreSQL + Storage + Auth)
- **Cloudflare** (DNS & CDN)
- **Docker** (Containerization)

### AI/ML Models
- **paraphrase-multilingual-MiniLM-L12-v2** (Sentence Transformers)
  - Multilingual support (Arabic, French, English)
  - Used for campaign recommendations
  - Semantic search capabilities
  - Volunteer-opportunity matching

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **M'Hamed Babah El Bah** - Software Developer
- **Dr. Eng. Mohamedou Cheikh Tourad** - Academic Supervisor
- **Eng. Cheikh Abdelkader Ahmed Telmoud** - Professional Supervisor

### Academic Institution
**University of Nouakchott**
- Faculty of Science and Technology
- Department of Computer Science
- Master in Information Systems

## 🏢 Organization

Developed at **Next Technology**, Mauritania

## 📞 Contact

- Website: [https://www.sada9a.com](https://www.sada9a.com)
- Email: mhamed.bbh01@gmail.com

## 📈 Roadmap

- [ ] Mobile application (iOS & Android)
- [ ] International payment methods (PayPal, credit cards)
- [ ] Advanced reporting for international donors
- [ ] Multi-currency support
- [ ] Automated tax receipt generation
- [ ] Integration with more social media platforms
- [ ] Enhanced AI features (fraud detection, donor behavior analysis)
- [ ] Kubernetes deployment for better orchestration

## 🐛 Known Issues

- First load of AI service may be slow due to model download (~420MB)
- WebSocket connections require Redis to be running
- Some features require Supabase configuration

## 📝 Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory with the following variables:
```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
PORT=8080
ENVIRONMENT=production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-eu-west-2.pooler.supabase.com:6543/postgres

# Supabase Configuration
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Supabase Storage Buckets
SUPABASE_STORAGE_BUCKET=campaign
SUPABASE_STORAGE_BUCKET_ORG=org-document
SUPABASE_ORG_IMAGES_BUCKET=org-images

# Redis Configuration (Upstash for production, local for development)
REDIS_URL=rediss://default:your-redis-password@your-redis-host.upstash.io:6379
# Or for local development:
# REDIS_URL=redis://redis:6379/1  # If using Docker Compose
# REDIS_URL=redis://127.0.0.1:6379/1  # If running locally

# AI Microservice
PAYMENT_MICROSERVICE_URL=http://localhost:8001
# Or if using Docker Compose:
# PAYMENT_MICROSERVICE_URL=http://ai-service:8080

# Facebook OAuth Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=https://www.sada9a.com/auth/facebook/callback

# Frontend URL (for CORS)
FRONTEND_URL=https://www.sada9a.com
# Or for local development:
# FRONTEND_URL=http://localhost:5173
```

**Important Notes:**
- Never commit your `.env` file to version control
- Keep `DEBUG=False` in production
- Use strong `SECRET_KEY` in production
- For Docker Compose, use service names as hostnames (e.g., `redis`, `ai-service`)
- `ALLOWED_HOSTS` should include all domains where your backend is deployed

### AI Service (.env)

Create a `.env` file in the `recommendation_service/` directory:
```bash
# Database URL (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-eu-west-2.pooler.supabase.com:6543/postgres

# Optional: Model Configuration
MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2

# Port (for Docker)
PORT=8080
```

**Notes:**
- The AI service only needs database access for reading campaign data
- First run will download the ML model (~420MB)

### Frontend (.env.local)

Create a `.env.local` file in the `frontend/` directory:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
VITE_APP_API_BASE_URL=https://your-backend-url.run.app/api
# Or for local development:
# VITE_APP_API_BASE_URL=http://localhost:8000/api

# Facebook OAuth Configuration
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_FACEBOOK_REDIRECT_URI=https://www.sada9a.com/auth/facebook/callback

# Environment
NODE_ENV=production
# Or for development:
# NODE_ENV=development
```

**Notes:**
- All Vite environment variables must be prefixed with `VITE_`
- Use `.env.local` for local development (git-ignored)
- Use `.env.production` for production builds
- Never expose `FACEBOOK_APP_SECRET` in frontend

### Environment Setup Quick Reference

| Service | File | Location | Docker Service Name |
|---------|------|----------|---------------------|
| Django Backend | `.env` | `backend/.env` | `backend` |
| FastAPI AI Service | `.env` | `recommendation_service/.env` | `ai-service` |
| React Frontend | `.env.local` | `frontend/.env.local` | N/A (deployed separately) |

### Docker-specific Environment Variables

When using Docker Compose, update these variables:

**Backend `.env`:**
```bash
REDIS_URL=redis://redis:6379/1
PAYMENT_MICROSERVICE_URL=http://ai-service:8080
```

**Note**: Service names in Docker Compose (`redis`, `ai-service`) are used as hostnames.

### Security Checklist

- [ ] All sensitive keys in `.env` files (not in code)
- [ ] `.env` files added to `.gitignore`
- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` in production
- [ ] HTTPS enabled for all production URLs
- [ ] CORS configured correctly
- [ ] Database credentials rotated regularly
- [ ] Redis connection uses SSL/TLS (`rediss://`) in production
- [ ] Facebook App Secret never exposed in frontend
- [ ] Docker containers run as non-root users
- [ ] Secrets not baked into Docker images

---

<div align="center">
  Made with ❤️ in Mauritania
  
  [Report Bug](https://github.com/medbbh/sadagha-github/issues) · [Request Feature](https://github.com/medbbh/sadagha-github/issues)
</div>
