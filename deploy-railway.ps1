# Railway Deployment Script for Windows PowerShell
# This script helps deploy both frontend and backend to Railway

Write-Host "🚀 Starting Railway deployment for Comment System..." -ForegroundColor Green

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI is ready!" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli"
    exit 1
}

# Check if logged in to Railway
try {
    railway whoami | Out-Null
    Write-Host "✅ Logged in to Railway!" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Railway. Please login first:" -ForegroundColor Red
    Write-Host "railway login"
    exit 1
}

# Deploy Backend
Write-Host "📦 Deploying Backend Service..." -ForegroundColor Blue
railway up --service backend --dockerfile railway.dockerfile

# Deploy Frontend  
Write-Host "🎨 Deploying Frontend Service..." -ForegroundColor Blue
railway up --service frontend --dockerfile frontend.railway.dockerfile

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "🔗 Check your Railway dashboard for deployment status"
