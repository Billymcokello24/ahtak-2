#!/bin/bash
# Setup PostgreSQL database for ahtak
# Ensure PostgreSQL is installed and running

set -e

DB_NAME="${DB_NAME:-ahtak}"
DB_USER="${DB_USER:-postgres}"

echo "Creating database '$DB_NAME' (user: $DB_USER)..."
psql -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
echo "Database ready."

echo ""
echo "Running Django migrations..."
python manage.py migrate

echo ""
echo "Seeding database with super admin (admin / admin123)..."
python manage.py seed_db --no-input || python manage.py createsuperuser

echo ""
echo "Done. You can now:"
echo "  - Login at http://localhost:5173 (frontend) with your superuser credentials"
echo "  - Login at http://127.0.0.1:8000/admin/ (Django admin)"
