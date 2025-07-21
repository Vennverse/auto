#!/bin/bash

echo "🚀 AutoJobr Setup Script"
echo "========================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your database credentials."
    echo ""
    echo "🔧 Required environment variables:"
    echo "   - DATABASE_URL: Your PostgreSQL connection string"
    echo "   - SESSION_SECRET: A random 32+ character string"
    echo "   - GROQ_API_KEY: Your Groq API key for AI features"
    echo ""
    echo "📚 Database providers:"
    echo "   - Neon: https://neon.tech (Recommended)"
    echo "   - Supabase: https://supabase.com"
    echo "   - PlanetScale: https://planetscale.com"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if DATABASE_URL is set
source .env 2>/dev/null || true
if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "⚠️  DATABASE_URL not found in .env"
    echo "Please set your database connection string in .env file"
    echo "Example: DATABASE_URL=postgresql://username:password@host:port/database"
    echo ""
    echo "For Neon:"
    echo "1. Go to https://neon.tech"
    echo "2. Create a new project"
    echo "3. Copy the connection string"
    echo ""
else
    echo "✅ DATABASE_URL configured"
    
    # Run database migration
    echo "🗄️  Setting up database..."
    npm run db:push
    
    if [ $? -eq 0 ]; then
        echo "✅ Database setup complete"
    else
        echo "❌ Database setup failed. Please check your DATABASE_URL"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🔧 Chrome Extension:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked' and select the 'extension' folder"
echo ""
echo "📖 For more help, see README.md"