#!/bin/bash

# Railway Deployment Script
# This script helps deploy both frontend and backend to Railway

echo "🚀 Starting Railway deployment for Comment System..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

echo "✅ Railway CLI is ready!"

# Deploy Backend
echo "📦 Deploying Backend Service..."
railway up --service backend --dockerfile railway.dockerfile

# Deploy Frontend
echo "🎨 Deploying Frontend Service..."
railway up --service frontend --dockerfile frontend.railway.dockerfile

echo "🎉 Deployment completed!"
echo "🔗 Check your Railway dashboard for deployment status"
