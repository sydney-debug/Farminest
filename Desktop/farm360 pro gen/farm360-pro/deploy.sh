#!/bin/bash

# Farm360 Pro Deployment Script
# This script helps deploy the application to Netlify and Supabase

echo "🚀 Farm360 Pro Deployment Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/index.html" ]; then
    echo "❌ Error: Please run this script from the farm360-pro root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install --silent
cd ../frontend && npm install --silent
cd ..

echo "✅ Dependencies installed"

# Database setup (Supabase)
echo "🗄️  Setting up Supabase database..."
echo ""
echo "Please follow these steps to set up your Supabase database:"
echo ""
echo "1. Go to https://supabase.com and create a new project"
echo "2. In your Supabase dashboard, go to Settings > Database"
echo "3. Copy your database connection details:"
echo "   - Host: db.YOUR_PROJECT_ID.supabase.co"
echo "   - Database name: postgres"
echo "   - Username: postgres"
echo "   - Password: (your database password)"
echo ""
echo "4. Update the .env file in the backend directory with your Supabase credentials"
echo "5. In Supabase SQL Editor, run the database_schema.sql file"
echo ""
echo "Once you've completed these steps, the database will be ready!"
echo ""

# Deployment instructions
echo "🌐 Deployment Instructions:"
echo "=========================="
echo ""
echo "FRONTEND (Netlify):"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Netlify"
echo "3. Set build settings:"
echo "   - Build command: (leave empty)"
echo "   - Publish directory: frontend/"
echo "4. Add environment variables in Netlify dashboard:"
echo "   - VITE_API_URL=https://your-backend-url.com"
echo ""
echo "BACKEND (Railway/Replit/Render/Heroku):"
echo "1. Deploy your backend to a hosting service"
echo "2. Update CORS settings in server.js for your Netlify domain"
echo "3. Set environment variables for Supabase connection"
echo ""
echo "Example hosting services:"
echo "- Railway.app (recommended for Node.js)"
echo "- Render.com"
echo "- Replit.com"
echo "- Heroku.com"
echo ""

echo "🎉 Deployment setup complete!"
echo "Follow the instructions above to deploy your Farm360 Pro application."
