# Guía de despliegue

Frontend (Next.js/Next) en Vercel → `https://crm.saberoconsulting.com` (lo que ve el cliente).
Backend (Nest) en Contabo con Docker → `https://api.saberoconsulting.com` (solo lo usa el front).
Base de datos gestionada en Supabase (Postgres) y Cloudinary para imágenes.

```
Cliente → https://crm.saberoconsulting.com   (Vercel, frontend)
                 │ fetch/axios
                 ▼
            https://api.saberoconsulting.com  (Contabo · Caddy TLS)
                 ▼
            contenedor crm_backend :3001  (Nest)
                 ▼
            Supabase (Postgres) · Cloudinary (imágenes)
```

## A) Variables de entorno (Contabo)

Crea `.env` en la raíz del repo (donde está `docker-compose.yml`); NO lo subas a git:

```bash
# Supabase / Pooler
DB_HOST=aws-0-us-west-2.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.<ref>
DB_PASSWORD=<password>
DB_NAME=postgres
DB_SSL=true

# API
JWT_SECRET=<secreto_largo_aleatorio>
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://crm.saberoconsulting.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

El `docker-compose.yml` exige con `${VAR:?}`: `DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET`. Sin `.env` no arranca (a propósito).

## B) Vercel (frontend)

1. Deploy del directorio `frontend`.
2. Environment variable del front: `NEXT_PUBLIC_API=https://api.saberoconsulting.com`.
3. `next.config.js` ya reenvía `/api/*` y `/uploads/*` hacia `NEXT_PUBLIC_API`.
4. Punto tu dominio DNS `crm` (CNAME a Vercel / A si corresponde) de modo que
   el cliente use `https://crm.saberoconsulting.com`.

## C) Contabo — levantar contenedores

```bash
ssh -i ~/.ssh/id_contabo ubuntu@209.145.62.118
cd ~/crm                          # clona tu repo y crea .env según paso A
nano .env
docker compose up -d --build
docker compose ps                 # backend + caddy
```

El contenedor `backend` aplica las **migraciones** contra Supabase y expone la app en `:3001`
(en red interna). El contenedor `caddy` hace el proxy + TLS y escucha en 80/443.

Para probar sin dominio:
```bash
docker compose exec backend sh -c "node dist/config/bootstrap-migrate.js && node dist/main.js" &
docker compose logs backend
```
(Si necesitas exponer el 3001 a la IP para pruebas, agrega `ports: ["3001:3001"]` en el servicio backend.)

## D) Caddy y DNS

El `Caddyfile` del repo ya define `api.saberoconsulting.com → reverse_proxy crm_backend:3001`.
En tu panel DNS:
- `api` (A/CNAME) → `209.145.62.118` (Contabo) para que Caddy resuelva y emita el certificado Let's Encrypt de `api.saberoconsulting.com`.
- `crm` → apunta a Vercel (para que el cliente use `https://crm.saberoconsulting.com`).

Caddy obtiene el certificado automáticamente al reservar `api.saberoconsulting.com` (puertos 80/443 abiertos en el firewall de Contabo).

## E) Migraciones limpias (contra Supabase)

```bash
docker compose up -d backend
docker compose logs backend       # verás "Migraciones OK - arrancando API..."
```
Las migraciones ya corren cada arranque (son idempotentes). Si quieres resetear el esquema en Supabase hazlo desde el panel SQL de Supabase, no con SSH (es BD gestionada).

## Notas de seguridad
- Ningún secreto debe quedar en el código o en composición versionada (usa solo `.env`).
- Nunca sirvas la BD ni el 3001 directo al público; solo `api.*` vía Caddy.
- Rota credenciales si llegaron a quedar en mensajes/logs históricos.


```bash
curl http://localhost:3001/api/auth/login   # 404 en GET es normal
docker compose logs backend
```

Para **migraciones limpias** (reiniciar esquema desde cero), ejecuta dentro del contenedor:

```bash
docker compose exec postgres psql -U postgres -d crm_inmobiliario -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose up -d backend   # re-aplica migraciones sobre esquema limpio
```

> Nota: `RUN_SEED` no se usa hoy (el seed es parte de la migración `1710000000001`). Si decides desactivar datos demo después de la primera vez, edita la migración o usa variables en una futura iteración.

## D) Proxy HTTPS recomendado (Caddy)

En lugar de exponer el puerto 3001 directo, usa Caddy para TLS automático en `api.tu-dominio`:

```bash
docker run -d --name caddy -p 80:80 -p 443:443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v caddydata:/data \
  caddy:2
```

Con Caddyfile (apunta al contenedor `crm_backend`):

```
api.tu-dominio {
	reverse_proxy crm_backend:3001
}
uploads.tu-dominio {
	reverse_proxy crm_backend:3001
	handle_path /uploads/* {
		reverse_proxy crm_backend:3001
	}
}
```

Luego en Vercel `NEXT_PUBLIC_API=https://api.tu-dominio`.

> Para producción también corrige el CORS/Front arriba y sirve `uploads` desde el contenedor con volúmenes ya montados (`uploads:/app/uploads`).

## E) Socket.IO (tiempo real)

Socket.IO se conecta a `NEXT_PUBLIC_API` (mismo host). Asegura que el proxy/site permita **upgrade websocket** (Caddy lo permite por defecto).
