# Guía de despliegue

Arquitectura: **Frontend (Next.js) en Vercel** + **Backend (Nest) y PostgreSQL en Contabo vía Docker Compose**.

```
Navegador ─► Vercel (frontend)
                 │  https://api.tu-dominio
                 ▼
            Contabo (Docker)
          backend(:3001) + postgres(:5432)
```

## A) Variables de entorno backend (Contabo)

Crea un archivo `.env` en la raíz del repo (donde está `docker-compose.yml`):

```bash
DB_USER=postgres
DB_PASSWORD=Cambia_esto_contra_segura
DB_NAME=crm_inmobiliario
JWT_SECRET=Cambia_esto_token_secreto_muy_largo_aleatorio
FRONTEND_URL=https://tu-front.vercel.app
RUN_SEED=true
```

> El `docker-compose.yml` exige `JWT_SECRET` (usa `${JWT_SECRET:?}`), así que sin `.env` no arranca a propósito.

## B) Vercel (frontend)

1. Sube el repo y crea proyecto apuntando al directorio **`frontend`** (root).
2. Configura Build/Start que vienen por defecto de Next.
3. Añade **Enviroment Variables**:
   - `NEXT_PUBLIC_API=https://api.tu-dominio`  (o `http://IP:3001` para pruebas)
4. `next.config.js` ya reescribe `/api/*` y `/uploads/*` hacia `NEXT_PUBLIC_API`, así el frontend habla con tu back en Contabo (incluye Socket.IO).
5. Deploy. Usa el dominio `*.vercel.app` o uno propio.

## C) Contabo — subir y levantar (Docker)

Desde tu máquina (usando tu llave `id_contabo`):

```bash
ssh -i ~/.ssh/id_contabo ubuntu@209.145.62.118
```

En el servidor (la primera vez) instala Docker si no está:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Clona y levanta:

```bash
cd ~
git clone <TU_REPO_URL> crm && cd crm
# crea y edita .env (paso A)
nano .env
docker compose up -d --build
docker compose ps
```

Al arrancar, el contenedor `backend` corre automáticamente las **migraciones** (esquema + seed de datos demo si `RUN_SEED=true`) antes de levantar la API. Valida:

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
