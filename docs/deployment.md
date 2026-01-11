# Deployment Guide

This guide covers how to deploy the Central University Available Class System (CU ACS) in different environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [AWS Deployment](#aws-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Monitoring](#monitoring)

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/krichdevs/RESMAN.git
   cd RESMAN
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Configure environment variables** (see [Environment Variables](#environment-variables) section)

5. **Set up the database:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start the services:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev

   # Terminal 3: Redis (if not using Docker)
   redis-server
   ```

7. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start with Docker Compose

1. **Clone the repository:**
   ```bash
   git clone https://github.com/central-university/cu-acs.git
   cd cu-acs
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma db seed
   ```

5. **Access the application:**
   - Application: http://localhost
   - API Documentation: http://localhost/api/docs

### Production Docker Deployment

For production deployment, use the production Docker Compose file:

```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

This includes:
- Nginx reverse proxy with SSL
- PostgreSQL and Redis
- Prometheus and Grafana for monitoring
- Proper security configurations

## AWS Deployment

### Prerequisites

- AWS CLI configured
- Terraform 1.0+
- AWS account with appropriate permissions

### Infrastructure Setup

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

2. **Initialize Terraform:**
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

3. **Configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the infrastructure:**
   ```bash
   terraform apply
   ```

### Application Deployment

1. **Build and push Docker images:**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and push backend
   docker build -t cu-resman-backend ./backend
   docker tag cu-resman-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cu-resman-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cu-resman-backend:latest

   # Build and push frontend
   docker build -t cu-resman-frontend ./frontend
   docker tag cu-resman-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cu-resman-frontend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cu-resman-frontend:latest
   ```

2. **Update ECS service:**
   ```bash
   aws ecs update-service \
     --cluster cu-acs-cluster \
     --service cu-acs-service \
     --force-new-deployment
   ```

3. **Run database migrations:**
   ```bash
   aws ecs run-task \
     --cluster cu-acs-cluster \
     --task-definition cu-acs-migration-task \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345]}"
   ```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | development | Yes |
| `PORT` | Server port | 3001 | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d | No |
| `SMTP_HOST` | SMTP server host | - | Yes |
| `SMTP_PORT` | SMTP server port | 587 | No |
| `SMTP_USER` | SMTP username | - | Yes |
| `SMTP_PASS` | SMTP password | - | Yes |
| `SMTP_FROM` | From email address | - | Yes |
| `CORS_ORIGIN` | CORS allowed origins | http://localhost:3000 | No |
| `LOG_LEVEL` | Logging level | info | No |
| `UPLOAD_PATH` | File upload path | ./uploads | No |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | 10485760 | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API URL | http://localhost:3001 | Yes |
| `REACT_APP_SOCKET_URL` | WebSocket URL | http://localhost:3001 | No |
| `REACT_APP_ENVIRONMENT` | Environment name | development | No |

### Docker Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_USER` | Database username | postgres | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_NAME` | Database name | cu_acs | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `JWT_SECRET` | JWT secret | - | Yes |
| `SMTP_HOST` | SMTP host | - | Yes |
| `SMTP_PORT` | SMTP port | 587 | No |
| `SMTP_USER` | SMTP username | - | Yes |
| `SMTP_PASS` | SMTP password | - | Yes |
| `GRAFANA_PASSWORD` | Grafana admin password | admin | No |

## Database Setup

### PostgreSQL Setup

1. **Create database:**
   ```sql
   CREATE DATABASE cu_acs;
   CREATE USER cu_acs_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cu_acs TO cu_acs_user;
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

### Redis Setup

Redis is used for:
- Session storage
- Rate limiting
- Caching
- WebSocket adapter

Default configuration should work for most deployments.

## Monitoring

### Application Monitoring

The application includes built-in monitoring with:

- **Prometheus metrics** at `/metrics` endpoint
- **Health checks** at `/health` endpoint
- **Structured logging** with Winston

### Infrastructure Monitoring

For production deployments:

1. **Prometheus** collects metrics from all services
2. **Grafana** provides dashboards for visualization
3. **Alert Manager** handles alerting rules

### Log Aggregation

Logs are structured and can be aggregated using:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- AWS CloudWatch
- Google Cloud Logging
- Datadog

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify database user permissions

2. **Redis connection errors:**
   - Check REDIS_URL format
   - Ensure Redis is running
   - Verify network connectivity

3. **JWT token errors:**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format

4. **File upload errors:**
   - Check UPLOAD_PATH permissions
   - Verify MAX_FILE_SIZE configuration
   - Ensure disk space availability

### Health Checks

Use these endpoints to verify deployment health:

- `GET /health` - Application health
- `GET /api/health` - API health
- `GET /metrics` - Prometheus metrics

### Logs

Check these log locations:

- **Application logs:** `/var/log/cu-acs/`
- **Nginx logs:** `/var/log/nginx/`
- **Docker logs:** `docker logs <container_name>`
- **AWS CloudWatch:** `/ecs/cu-acs-*`

## Security Considerations

1. **Environment Variables:**
   - Never commit secrets to version control
   - Use secret management services (AWS Secrets Manager, etc.)
   - Rotate secrets regularly

2. **Network Security:**
   - Use VPC and security groups
   - Implement WAF rules
   - Enable SSL/TLS everywhere

3. **Database Security:**
   - Use strong passwords
   - Enable encryption at rest
   - Implement backup and recovery

4. **Application Security:**
   - Keep dependencies updated
   - Implement rate limiting
   - Use HTTPS only
   - Enable CORS properly

## Backup and Recovery

### Database Backup

```bash
# Manual backup
pg_dump cu_acs > backup.sql

# Automated backup (cron)
0 2 * * * pg_dump cu_acs | gzip > /backups/cu_acs_$(date +\%Y\%m\%d).sql.gz
```

### File Backup

```bash
# Backup uploaded files
tar -czf uploads_backup.tar.gz uploads/
```

### Recovery

```bash
# Restore database
psql cu_acs < backup.sql

# Restore files
tar -xzf uploads_backup.tar.gz
```

## Scaling

### Horizontal Scaling

1. **Application servers:**
   - Add more ECS tasks
   - Use load balancer for distribution

2. **Database:**
   - Use read replicas for read operations
   - Implement connection pooling

3. **Cache:**
   - Use Redis cluster for high availability
   - Implement cache warming strategies

### Performance Optimization

1. **Database:**
   - Add appropriate indexes
   - Use query optimization
   - Implement pagination

2. **Caching:**
   - Cache frequently accessed data
   - Use CDN for static assets
   - Implement HTTP caching headers

3. **Code:**
   - Optimize bundle size
   - Implement lazy loading
   - Use compression

## Support

For deployment support:
- Check the troubleshooting section
- Review application logs
- Contact the development team
- Create an issue in the repository
