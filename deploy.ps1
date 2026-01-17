# CollabDoc Deployment Preparation Script (Windows)
# This script prepares your project for deployment to Vercel + Railway/Render

Write-Host "🚀 CollabDoc Deployment Preparation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if node is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Build backend
Write-Host "📦 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm install --legacy-peer-deps
npm run build
Set-Location ..
Write-Host "✅ Backend built successfully" -ForegroundColor Green
Write-Host ""

# Build frontend
Write-Host "🎨 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install --legacy-peer-deps
npm run build
Set-Location ..
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Check if .env files exist
Write-Host "🔍 Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Create it from .env.example" -ForegroundColor Yellow
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend\.env not found. Create it from .env.example" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "📋 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  SET UP MONGODB ATLAS" -ForegroundColor Green
Write-Host "   - Go to https://www.mongodb.com/cloud/atlas"
Write-Host "   - Create free M0 cluster"
Write-Host "   - Create database user"
Write-Host "   - Copy connection string"
Write-Host ""

Write-Host "2️⃣  DEPLOY BACKEND" -ForegroundColor Green
Write-Host "   Option A - Railway (recommended):"
Write-Host "   - Go to https://railway.app"
Write-Host "   - Click 'New Project' → 'Deploy from GitHub'"
Write-Host "   - Select CollabDoc repository"
Write-Host "   - Set root directory: backend"
Write-Host "   - Add environment variables (see DEPLOYMENT.md)"
Write-Host ""
Write-Host "   Option B - Render (free but sleeps):"
Write-Host "   - Go to https://render.com"
Write-Host "   - Click 'New' → 'Web Service'"
Write-Host "   - Select CollabDoc repository"
Write-Host "   - Add environment variables (see DEPLOYMENT.md)"
Write-Host ""

Write-Host "3️⃣  DEPLOY FRONTEND" -ForegroundColor Green
Write-Host "   - Go to https://vercel.com"
Write-Host "   - Click 'Add New' → 'Project'"
Write-Host "   - Import CollabDoc repository"
Write-Host "   - Root directory: frontend"
Write-Host "   - Add environment variables:"
Write-Host "     VITE_API_URL=https://your-backend-url/api"
Write-Host "     VITE_SOCKET_URL=https://your-backend-url"
Write-Host ""

Write-Host "4️⃣  TEST DEPLOYMENT" -ForegroundColor Green
Write-Host "   - Visit your Vercel URL"
Write-Host "   - Register and login"
Write-Host "   - Upload a document"
Write-Host "   - Create annotations"
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "- Full guide: DEPLOYMENT.md"
Write-Host "- Quick checklist: DEPLOYMENT_CHECKLIST.md"
Write-Host "- Backend config: backend\.env.example"
Write-Host "- Frontend config: frontend\.env.example"
Write-Host ""

Write-Host "✅ Project is deployment-ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Read DEPLOYMENT.md"
Write-Host "2. Complete DEPLOYMENT_CHECKLIST.md"
Write-Host "3. Deploy to MongoDB Atlas, Railway/Render, and Vercel"
Write-Host ""
