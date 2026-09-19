# VPS setup runbook

Do not run this until you have an Ubuntu VPS and a domain pointing at it. This file is the command list; it does not deploy by itself.

Assumes Ubuntu 24.04, one domain, empty production database.

Replace `YOUR-DOMAIN` everywhere (no `https://`, no trailing slash).

## 0. On your PC first

- Commit/push `chore/production-setup` when you are ready (do not commit secrets).
- Generate secrets locally; paste them only into `/etc/sportmanager/sportmanager.env` on the server:

```bash
openssl rand -base64 48
```

Use one value for `JWT_SECRET` (at least 32 characters) and a different strong value for `ADMIN_DEFAULT_PASSWORD` and `DB_PASSWORD`.

## 1. DNS

Create an A record: `YOUR-DOMAIN` → VPS public IP. Wait until it resolves.

## 2. Firewall and packages (on the VPS as root)

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
ufw deny 8080
ufw deny 5432

apt update
apt install -y openjdk-21-jre-headless nginx postgresql certbot python3-certbot-nginx
```

Confirm Java: `java -version` (21).

## 3. Service user and directories

```bash
useradd --system --home /opt/sportmanager --shell /usr/sbin/nologin sportmanager
mkdir -p /opt/sportmanager /var/www/sportmanager /etc/sportmanager /var/log/sportmanager /var/backups/sportmanager
chown sportmanager:sportmanager /opt/sportmanager /var/log/sportmanager /var/backups/sportmanager
chown www-data:www-data /var/www/sportmanager
chmod 750 /etc/sportmanager
```

## 4. PostgreSQL (localhost only, empty database)

```bash
sudo -u postgres psql -c "CREATE USER sportmanager WITH PASSWORD 'the-same-DB_PASSWORD-you-will-put-in-the-env-file';"
sudo -u postgres psql -c "CREATE DATABASE sportmanager OWNER sportmanager;"
```

In `/etc/postgresql/*/main/postgresql.conf` leave `listen_addresses` as localhost (default). Do not open 5432 on the firewall.

## 5. Application env (secrets live here only)

```bash
# From the cloned repo on the VPS, or scp the example then edit:
cp deploy/sportmanager.env.example /etc/sportmanager/sportmanager.env
chmod 600 /etc/sportmanager/sportmanager.env
chown sportmanager:sportmanager /etc/sportmanager/sportmanager.env
nano /etc/sportmanager/sportmanager.env
```

Set real `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_DEFAULT_PASSWORD`, and `CORS_ALLOWED_ORIGINS=https://YOUR-DOMAIN`. Leave `SPRING_PROFILES_ACTIVE=prod` and `JPA_DDL_AUTO=update` for the first boot.

## 6. Backend JAR

Build **without** `application-local.properties` on the machine if that file exists in `backend/src/main/resources` (the JAR plugin also excludes it). On the VPS or CI:

```bash
cd backend
./mvnw -DskipTests package
cp target/sportmanager-backend-0.0.1-SNAPSHOT.jar /opt/sportmanager/sportmanager-backend.jar
chown sportmanager:sportmanager /opt/sportmanager/sportmanager-backend.jar
```

```bash
cp deploy/sportmanager.service /etc/systemd/system/sportmanager.service
systemctl daemon-reload
systemctl enable sportmanager
systemctl start sportmanager
curl -sS http://127.0.0.1:8080/api/health
```

Expect `{"status":"UP"}`. Logs: `journalctl -u sportmanager -e` and `/var/log/sportmanager/application.log`. First boot should create tables and seed `admin` plus FOOTBALL/SWIMMING activities.

## 7. Frontend

```bash
cd frontend
npm ci
npm run build
rsync -a --delete dist/ /var/www/sportmanager/
chown -R www-data:www-data /var/www/sportmanager
```

`npm run build` uses `.env.production` (same-origin `/api`). Do not bake localhost.

## 8. Nginx then HTTPS

```bash
cp deploy/nginx-sportmanager.conf /etc/nginx/sites-available/sportmanager
# Set server_name to the real domain (nano or sed).
ln -sf /etc/nginx/sites-available/sportmanager /etc/nginx/sites-enabled/sportmanager
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
certbot --nginx -d YOUR-DOMAIN
```

After Certbot, confirm `CORS_ALLOWED_ORIGINS` is `https://YOUR-DOMAIN` and restart the API if you changed it: `systemctl restart sportmanager`.

## 9. Backup cron

```bash
cp deploy/backup-postgres.sh /opt/sportmanager/backup-postgres.sh
chmod 700 /opt/sportmanager/backup-postgres.sh
chown sportmanager:sportmanager /opt/sportmanager/backup-postgres.sh
```

Peer auth: allow local `sportmanager` to dump, or use `/var/lib/postgresql/.pgpass` / a `.pgpass` for that user. Then:

```bash
crontab -e
# 15 2 * * * /opt/sportmanager/backup-postgres.sh
```

Run the script once by hand and confirm a file appears under `/var/backups/sportmanager`.

## 10. Smoke tests

- `https://YOUR-DOMAIN/api/health`
- Home page; refresh `/register/football` (SPA fallback)
- Admin login at `/admin/login` with the production admin password
- Create a season (empty DB)
- `ss -lntp | grep 8080` — listen on `127.0.0.1` only
- `ss -lntp | grep 5432` — not public

After the schema looks correct: set `JPA_DDL_AUTO=validate` in the env file and `systemctl restart sportmanager`.
