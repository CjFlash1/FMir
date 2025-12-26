#!/bin/sh
set -e

echo "Starting FujiMir..."

# Ensure uploads directory exists in volume
mkdir -p /app/data/uploads

# Check if database exists in volume, if not copy template
if [ ! -f "/app/data/production.db" ]; then
    echo "Database not found in volume, copying template..."
    
    if [ -f "/app/template.db" ]; then
        cp /app/template.db /app/data/production.db
        echo "Database initialized from template with seed data."
    else
        echo "ERROR: Template database not found!"
        exit 1
    fi
else
    echo "Database found at /app/data/production.db"
fi

echo "Uploads directory: /app/data/uploads"
echo "Ready to serve!"

# Execute the main command
exec "$@"
