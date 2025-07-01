#!/bin/bash

# PostgreSQL Setup Script for Animal Impact App
echo "🐘 Setting up PostgreSQL for Animal Impact App..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Installing now..."
    
    # Install PostgreSQL based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "Please install Homebrew first or install PostgreSQL manually"
            exit 1
        fi
    else
        echo "Please install PostgreSQL manually for your operating system"
        exit 1
    fi
fi

# Start PostgreSQL service
echo "🔄 Starting PostgreSQL service..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql
fi

# Wait for PostgreSQL to start
sleep 3

echo "📊 Creating database and user..."

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE animalimpact;

-- Create user
CREATE USER animalimpact WITH PASSWORD 'animalimpact123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE animalimpact TO animalimpact;

-- Grant schema privileges
\c animalimpact
GRANT ALL ON SCHEMA public TO animalimpact;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO animalimpact;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO animalimpact;

-- Alter default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO animalimpact;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO animalimpact;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL setup completed successfully!"
    echo ""
    echo "Database details:"
    echo "  Database: animalimpact"
    echo "  User: animalimpact"
    echo "  Password: animalimpact123"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo ""
    echo "🚀 Run 'bun run db:init' to initialize the database schema"
else
    echo "❌ Failed to setup PostgreSQL. Please check the logs above."
    exit 1
fi