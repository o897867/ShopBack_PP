# 🐳 ShopBack Docker Deployment Guide

## Overview

This Docker setup provides a complete containerized environment for the ShopBack Management Platform, supporting both development and production deployments.

## 📁 Docker Files Structure

```
ShopBack_PP/
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── docker-scripts.sh            # Management scripts
├── .env.example                 # Environment template
├── .env.development             # Development config
├── .env.production              # Production config
├── back-end/
│   ├── Dockerfile               # Development backend
│   ├── Dockerfile.prod          # Production backend
│   └── .dockerignore
├── front-end/
│   ├── Dockerfile               # Development frontend
│   ├── Dockerfile.prod          # Production frontend
│   ├── nginx.conf               # Development nginx
│   ├── nginx.prod.conf          # Production nginx
│   └── .dockerignore
└── nginx/                       # Reverse proxy (production)
```

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available
- 10GB+ disk space

### Development Environment

1. **Start Development Environment**:
   ```bash
   ./docker-scripts.sh dev-start
   ```

2. **Access Applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

3. **View Logs**:
   ```bash
   ./docker-scripts.sh dev-logs
   # Or specific service:
   ./docker-scripts.sh dev-logs backend
   ```

4. **Stop Environment**:
   ```bash
   ./docker-scripts.sh dev-stop
   ```

### Production Environment

1. **Configure Production Settings**:
   ```bash
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Start Production Environment**:
   ```bash
   ./docker-scripts.sh prod-start
   ```

3. **Access Application**:
   - Application: http://localhost:80

## ⚙️ Configuration

### Environment Variables

Key configuration options in `.env` files:

```bash
# Application
ENVIRONMENT=development|production
DEBUG=true|false

# Database
DATABASE_URL=sqlite:///data/shopback_data.db

# API Settings
API_HOST=0.0.0.0
API_PORT=8001
CORS_ORIGINS=http://localhost:3000

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Security (CHANGE IN PRODUCTION!)
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
```

### Production Checklist

Before deploying to production:

- [ ] Update `SECRET_KEY` and `JWT_SECRET`
- [ ] Configure email settings (SMTP)
- [ ] Set proper `CORS_ORIGINS`
- [ ] Configure domain names
- [ ] Set up SSL certificates
- [ ] Configure database backup strategy

## 🛠️ Management Commands

The `docker-scripts.sh` provides convenient management commands:

### Development Commands
```bash
./docker-scripts.sh dev-start      # Start development
./docker-scripts.sh dev-stop       # Stop development
./docker-scripts.sh dev-restart    # Restart services
./docker-scripts.sh dev-logs       # View logs
```

### Production Commands
```bash
./docker-scripts.sh prod-start     # Start production
./docker-scripts.sh prod-stop      # Stop production
./docker-scripts.sh prod-logs      # View logs
```

### Database Commands
```bash
./docker-scripts.sh db-backup      # Create backup
./docker-scripts.sh db-restore     # Restore from backup
```

### Utility Commands
```bash
./docker-scripts.sh status         # Show container status
./docker-scripts.sh health         # Health check
./docker-scripts.sh clean          # Clean unused resources
```

## 📊 Monitoring

### Health Checks

Both backend and frontend include health checks:

```bash
# Check application health
./docker-scripts.sh health

# Monitor container health
docker-compose ps
```

### Logs

View real-time logs:
```bash
# All services
./docker-scripts.sh dev-logs

# Specific service
./docker-scripts.sh dev-logs backend
./docker-scripts.sh dev-logs frontend
```

### Performance Monitoring

Access performance metrics:
- Backend metrics: http://localhost:8001/api/performance
- Container stats: `docker stats`

## 🗄️ Database Management

### Backup Strategy

Regular backups are essential:

```bash
# Manual backup
./docker-scripts.sh db-backup

# Automated backup (add to cron)
0 2 * * * /path/to/docker-scripts.sh db-backup
```

### Data Persistence

Data is persisted in Docker volumes:
- `backend-data`: Database and application data
- `backend-logs`: Application logs
- `nginx-logs`: Web server logs

## 🔧 Development Workflow

### Live Development

The development setup supports live reloading:

- **Backend**: Code changes trigger automatic reload
- **Frontend**: Hot module replacement enabled
- **Database**: Persisted in Docker volume

### Debugging

1. **Access container shell**:
   ```bash
   docker-compose exec backend bash
   docker-compose exec frontend sh
   ```

2. **View detailed logs**:
   ```bash
   docker-compose logs -f --tail=100 backend
   ```

3. **Inspect containers**:
   ```bash
   docker inspect shopback-backend
   ```

## 🌐 Production Deployment

### Docker Compose Production

For production deployment:

1. **Configure environment**:
   ```bash
   cp .env.production .env
   # Edit production values
   ```

2. **Start production stack**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Cloud Deployment

The containers are ready for cloud platforms:

#### AWS ECS
```bash
# Build and push to ECR
docker build -t your-account.dkr.ecr.region.amazonaws.com/shopback-backend .
docker push your-account.dkr.ecr.region.amazonaws.com/shopback-backend
```

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/your-project/shopback-backend
gcloud run deploy --image gcr.io/your-project/shopback-backend
```

#### Azure Container Instances
```bash
# Create resource group and deploy
az container create --resource-group shopback --name shopback-app
```

## 🔐 Security

### Production Security

- **Non-root users**: All containers run as non-root
- **Security headers**: Configured in nginx
- **Rate limiting**: API rate limiting enabled
- **CORS**: Properly configured origins
- **Secrets**: Use environment variables for secrets

### SSL/TLS

For HTTPS in production, add SSL certificates:

```bash
# Create nginx/ssl directory
mkdir -p nginx/ssl

# Add your certificates
cp your-domain.crt nginx/ssl/
cp your-domain.key nginx/ssl/
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :8001
   ```

2. **Container not starting**:
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Check resource usage
   docker stats
   ```

3. **Database issues**:
   ```bash
   # Reset database volume
   docker-compose down -v
   docker-compose up -d
   ```

4. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Performance Issues

1. **Increase memory limits**:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
   ```

2. **Add more workers**:
   ```bash
   API_WORKERS=8  # In .env file
   ```

## 📈 Scaling

### Horizontal Scaling

Scale services independently:

```bash
# Scale backend
docker-compose up -d --scale backend=3

# Scale with load balancer
# Add nginx upstream configuration
```

### Resource Limits

Configure resource limits in production:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## 🆘 Support

For issues or questions:

1. Check logs: `./docker-scripts.sh dev-logs`
2. Verify health: `./docker-scripts.sh health`
3. Clean resources: `./docker-scripts.sh clean`
4. Review configuration files
5. Check Docker and Docker Compose versions

---

**Happy Dockerizing! 🐳**