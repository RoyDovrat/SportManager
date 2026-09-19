# Production server templates

These files match the one-VPS architecture. They are templates — they do not deploy anything by themselves.

| File | Install on the VPS as |
|------|------------------------|
| `nginx-sportmanager.conf` | `/etc/nginx/sites-available/sportmanager` |
| `sportmanager.service` | `/etc/systemd/system/sportmanager.service` |
| `sportmanager.env.example` | `/etc/sportmanager/sportmanager.env` (fill in secrets there) |
| `backup-postgres.sh` | `/opt/sportmanager/backup-postgres.sh` |

Do not commit a filled-in `sportmanager.env`.

## Paths

- Frontend: `/var/www/sportmanager` (contents of `frontend/dist`)
- Backend JAR: `/opt/sportmanager/sportmanager-backend.jar`
- Logs: `/var/log/sportmanager/application.log`
- DB backups: `/var/backups/sportmanager`

## Secrets

Production secrets live only in `/etc/sportmanager/sportmanager.env` (mode `600`, owner `sportmanager`). systemd loads that file. `application-local.properties` is not used in production and is excluded from the JAR.

Replace `YOUR-DOMAIN` in Nginx and in `CORS_ALLOWED_ORIGINS` with the real HTTPS origin (no trailing slash).

## HTTPS

Start with the HTTP Nginx site, then:

```bash
certbot --nginx -d YOUR-DOMAIN
```

## Journal vs log file

`StandardOutput=journal` keeps logs in `journalctl -u sportmanager`. The app also writes the rotating file under `/var/log/sportmanager`.
