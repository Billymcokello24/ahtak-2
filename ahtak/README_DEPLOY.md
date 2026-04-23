# VPS Deployment Guide for AHTAK (Ubuntu 22.04+)

This document outlines steps to deploy the Django app on a VPS using PostgreSQL, Gunicorn, and Nginx with Let's Encrypt TLS.

Replace `YOUR_USER` and `yourdomain.com` with your real user and domain. This guide uses the deployment directory `/var/www/ahtak` and two domains:

- Frontend: ahttak.or.ke (serves the built SPA)
- Backend API: api.ahttak.co.ke (proxied to Gunicorn)

## 1. Initial server setup

```bash
# Update & install essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-venv python3-pip nginx git postgresql postgresql-contrib redis-server libpq-dev
```

## 2. Create system user (optional)

```bash
sudo adduser --disabled-password --gecos "" deployuser
sudo usermod -aG sudo deployuser
# or use your existing user
```

git clone https://your-repo.git ahtak
## 3. Clone repo and create venv (deploy to `/var/www/ahtak`)

```bash
# as root or sudo user
sudo mkdir -p /var/www/ahtak
sudo chown YOUR_USER:YOUR_USER /var/www/ahtak
cd /var/www
git clone https://your-repo.git ahtak
cd ahtak
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Configure environment

Copy the example env and edit values:

```bash
cp .env.example .env
# edit .env: SECRET_KEY, DEBUG=False, ALLOWED_HOSTS, DB credentials
chmod 600 .env
```

You can store env vars in `/etc/systemd/system/gunicorn.service` via `EnvironmentFile=/home/YOUR_USER/ahtak/.env` (already referenced in the `deploy/gunicorn.service` template).

## 5. PostgreSQL setup

```bash
sudo -u postgres psql
CREATE DATABASE ahtak;
CREATE USER ahtak WITH PASSWORD 'strongpassword';
ALTER ROLE ahtak SET client_encoding TO 'utf8';
ALTER ROLE ahtak SET default_transaction_isolation TO 'read committed';
ALTER ROLE ahtak SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ahtak TO ahtak;
\q
```

Update `.env` DB_* values to match.

## 6. Build frontend, Django migrations and collectstatic

Build the frontend and place the production build into `/var/www/ahtak/frontend/dist` (adjust if your SPA build dir differs):

```bash
cd frontend
npm install --production
# Point the frontend at the API before building
# Example: export VITE_API_URL=https://api.ahttak.or.ke
export VITE_API_URL=https://api.ahttak.or.ke
npm run build
mkdir -p /var/www/ahtak/frontend
cp -r dist/* /var/www/ahtak/frontend/dist/
```

Then run Django migrations and collectstatic:

```bash
source .venv/bin/activate
export $(grep -v '^#' .env | xargs) || true
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py createsuperuser  # interactive; skip if you seed admin
```

## 7. Permissions

```bash
# static/media owned by web user
sudo chown -R YOUR_USER:www-data /home/YOUR_USER/ahtak/staticfiles /home/YOUR_USER/ahtak/media
sudo chmod -R 750 /home/YOUR_USER/ahtak/media
```

## 8. Systemd service for Gunicorn

Copy the template `deploy/gunicorn.service` to `/etc/systemd/system/gunicorn-ahtak.service` (it already points to `/var/www/ahtak` and `/var/www/ahtak/.venv`). Ensure the `.env` referenced by `EnvironmentFile` exists and is readable by the `www-data` user (or update `User=` to a different system user).

```bash
sudo cp deploy/gunicorn.service /etc/systemd/system/gunicorn-ahtak.service
sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn-ahtak
sudo systemctl status gunicorn-ahtak
```

Check logs:

```bash
sudo journalctl -u gunicorn-ahtak -f
```

## 9. Nginx setup

Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/ahtak`. The provided template contains two server blocks: one for `ahttak.or.ke` (frontend) and one for `api.ahttak.co.ke` (API). Update any paths if you changed them.

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/ahtak
sudo ln -s /etc/nginx/sites-available/ahtak /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 10. Obtain TLS certificate (Let's Encrypt)

Install Certbot and request certificates for both domains (frontend and API):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ahttak.or.ke -d www.ahttak.or.ke -d api.ahttak.or.ke
# Test renewal
sudo certbot renew --dry-run
```

## 11. Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 12. Celery (optional)

If you use Celery, create a systemd unit similar to Gunicorn and start a worker:

```
# Example systemd unit (create /etc/systemd/system/celery.service)
# ExecStart=/home/YOUR_USER/ahtak/.venv/bin/celery -A ahtak worker --loglevel=info
```

## 13. Troubleshooting

- Check Nginx logs: `/var/log/nginx/error.log` and `/var/log/nginx/access.log`
- Check Gunicorn: `sudo journalctl -u gunicorn-ahtak -e`
- Check Django logs if configured

---
If you want, I can:
- create the systemd unit file adjusted to your username and paths,
- create the final Nginx conf for your domain,
- or run migrations and collectstatic locally to verify.

Which shall I do next?