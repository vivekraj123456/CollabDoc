#!/bin/bash

# CollabDoc Deployment Preparation Script
# This script prepares your project for deployment to Vercel + Railway/Render

set -e

echo "🚀 CollabDoc Deployment Preparation"
echo "===================================="
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Build backend
echo "📦 Building backend..."
cd backend
npm install --legacy-peer-deps
npm run build
cd ..
echo "✅ Backend built successfully"
echo ""

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..
echo "✅ Frontend built successfully"
echo ""

# Check if .env files exist
echo "🔍 Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Create it from .env.example"
    echo "   Command: cp backend/.env.example backend/.env"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Create it from .env.example"
    echo "   Command: cp frontend/.env.example frontend/.env"
fi
echo ""

# Check git status
echo "📝 Git status:"
if [ -z "$(git status --short)" ]; then
    echo "✅ All changes are committed"
else
    echo "⚠️  Uncommitted changes detected:"
    git status --short
    echo "   Please commit before deploying"
fi
echo ""

echo "📋 Deployment Checklist:"
echo "========================"
echo ""
echo "1️⃣  SET UP MONGODB ATLAS"
echo "   - Go to https://www.mongodb.com/cloud/atlas"
echo "   - Create free M0 cluster"
echo "   - Create database user"
echo "   - Copy connection string"
echo ""

echo "2️⃣  DEPLOY BACKEND"
echo "   Option A - Railway (recommended):"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project' → 'Deploy from GitHub'"
echo "   - Select CollabDoc repository"
echo "   - Set root directory: backend"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "   Option B - Render (free but sleeps):"
echo "   - Go to https://render.com"
echo "   - Click 'New' → 'Web Service'"
echo "   - Select CollabDoc repository"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""

echo "3️⃣  DEPLOY FRONTEND"
echo "   - Go to https://vercel.com"
echo "   - Click 'Add New' → 'Project'"
echo "   - Import CollabDoc repository"
echo "   - Root directory: frontend"
echo "   - Add environment variables:"
echo "     VITE_API_URL=https://your-backend-url/api"
echo "     VITE_SOCKET_URL=https://your-backend-url"
echo ""

echo "4️⃣  TEST DEPLOYMENT"
echo "   - Visit your Vercel URL"
echo "   - Register and login"
echo "   - Upload a document"
echo "   - Create annotations"
echo ""

echo "📚 Documentation:"
echo "================="
echo "- Full guide: DEPLOYMENT.md"
echo "- Quick checklist: DEPLOYMENT_CHECKLIST.md"
echo "- Backend config: backend/.env.example"
echo "- Frontend config: frontend/.env.example"
echo ""

echo "✅ Project is deployment-ready!"
echo ""
echo "Next steps:"
echo "1. Read DEPLOYMENT.md"
echo "2. Complete DEPLOYMENT_CHECKLIST.md"
echo "3. Deploy to MongoDB Atlas, Railway/Render, and Vercel"
echo ""
