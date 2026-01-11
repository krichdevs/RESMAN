terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "cu-acs-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "cu-acs-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false

  tags = {
    Environment = var.environment
    Project     = "cu-acs"
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "cu-acs-alb-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cu-acs-alb"
    Environment = var.environment
  }
}

resource "aws_security_group" "ecs" {
  name_prefix = "cu-acs-ecs-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cu-acs-ecs"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "cu-acs-rds-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cu-acs-rds"
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "cu-acs-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cu-acs-redis"
    Environment = var.environment
  }
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "cu_acs" {
  name       = "cu-acs-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "cu-acs-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "cu_acs" {
  identifier             = "cu-acs-${var.environment}"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "cu_acs"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.cu_acs.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  backup_retention_period = 7

  tags = {
    Name        = "cu-acs-database"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "cu_acs" {
  name       = "cu-acs-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "cu-acs-redis-subnet-group"
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "cu_acs" {
  cluster_id           = "cu-acs-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t2.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.cu_acs.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name        = "cu-acs-redis"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "cu_acs" {
  name               = "cu-acs-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  tags = {
    Name        = "cu-acs-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "cu_acs" {
  name        = "cu-acs-tg-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "cu-acs-target-group"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "cu_acs" {
  load_balancer_arn = aws_lb.cu_acs.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.cu_acs.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "cu_acs" {
  name = "cu-acs-cluster-${var.environment}"

  tags = {
    Name        = "cu-acs-cluster"
    Environment = var.environment
  }
}

resource "aws_ecs_cluster_capacity_providers" "cu_acs" {
  cluster_name       = aws_ecs_cluster.cu_acs.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "cu_acs" {
  name              = "/ecs/cu-acs-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "cu-acs-log-group"
    Environment = var.environment
  }
}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "cu_acs_uploads" {
  bucket = "cu-acs-uploads-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "cu-acs-uploads"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "cu_acs_uploads" {
  bucket = aws_s3_bucket.cu_acs_uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.cu_acs.dns_name
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.cu_acs.endpoint
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.cu_acs.cache_nodes[0].address
}

output "s3_bucket_name" {
  description = "S3 bucket for uploads"
  value       = aws_s3_bucket.cu_acs_uploads.bucket
}
