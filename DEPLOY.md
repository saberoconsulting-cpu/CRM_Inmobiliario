# GuÃ­a de despliegue - CRM Inmobiliario

Frontend (Next) en Vercel -> https://crm.saberoconsulting.com (cliente).
Backend (Nest) en Contabo con Docker y Nginx -> https://api.saberoconsulting.com (solo lo usa el front).
Base de datos gestionada: Supabase (Postgres). Imagenes: Cloudinary.

Flujo
  Cliente -> https://crm.saberoconsulting.com   (Vercel, frontend)
                     fetch / axios
                     v
             https://api.saberoconsulting.com   (Contabo, Nginx TLS)
                     v
             contenedor crm_backend:3001 (Nest, red interna Docker)
                     v
             Supabase (Postgres) | Cloudinary (imagenes)

## A) Variables de entorno (Contabo)

Crea .env en la raiz del repo (donde vive docker-compose.yml). NO lo subas a git.

  # Supabase / Pooler
  DB_HOST=aws-0-us-west-2.pooler.supabase.com
  DB_PORT=5432
  DB_USER=postgres.<tu-ref>
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

El docker-compose exige con ${VAR:?}: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. Sin .env no inicia (a proposito).

## B) Vercel (frontend)

1. Deploy del directorio frontend.
2. Env var del front: NEXT_PUBLIC_API=https://api.saberoconsulting.com
3. next.config.js ya reenvia /api/* y /uploads/* hacia NEXT_PUBLIC_API.
4. DNS: crm.saberoconsulting.com apunta a Vercel.

## C) Contabo - levantar backend + nginx

  ssh -i ~/.ssh/id_contabo ubuntu@209.145.62.118
  cd ~/crm                      # clona tu repo y crea .env (paso A)
  nano .env
  docker compose up -d --build
  docker compose ps             # backend + nginx

El contenedor backend aplica migraciones contra Supabase y escucha en :3001 en la red
interna de Docker (no expuesto al publico). El contenedor nginx escucha 80/443 y hace
proxy hacia backend:3001 por nombre de servicio.

## D) Nginx + Certbot (HTTPS api.saberoconsulting.com)

El repo trae config inicial HTTP + desafio ACME en nginx/site.conf y la config SSL
listo en nginx/site-ssl.conf (inactivo hasta que existan certificados).

Preparar carpeta webroot (montada como /var/www/html):
  mkdir -p ~/crm/nginx/html

1) Levanta primero (config HTTP 80):
  docker compose up -d --build

2) Emite el certificado con Certbot en el host (requiere certbot instalado):
  docker compose stop nginx        # libera 80
  sudo certbot certonly --standalone -d api.saberoconsulting.com \
       --register-unsafely-without-email --agree-tos
  docker compose start nginx

   > Si no puedes detener 80, usa --webroot -w ~/crm/nginx/html
     mientras nginx siga activo respondiendo /.well-known.

3) Activa HTTPS: copia los certificados de letsencrypt del host y recarga nginx.
   El directorio letsencrypt del host ya esta montado de solo lectura en el contenedor:
     docker compose exec nginx sh -c "cp /etc/nginx/conf.d/api.saberoconsulting.com.conf /tmp/site.conf"
   (alternativa: despues de emitir, edita site.conf usando las rutas /etc/letsencrypt/live/... )

   Para simplificar, despues de emitir el cert ejecuta:
     cp nginx/site-ssl.conf nginx/site.conf
     docker compose restart nginx

4) DNS:
   - api  (A) -> 209.145.62.118 (Contabo)  -> Nginx atiende api.
   - crm  (CNAME/A) -> Vercel              -> cliente usa crm.

5) Verifica:
   curl -I https://api.saberoconsulting.com

## E) Migraciones contra Supabase

  docker compose up -d backend
  docker compose logs backend   # "Migraciones OK - arrancando API..."

Las migraciones corren en cada arranque y son idempotentes. Supabase gestiona la BD;
resetea esquema desde el SQL editor de Supabase, no por SSH.

## Notas de seguridad
- Ningun secreto en codigo ni en compose versionado: usar solo .env.
- Nunca expones backend:3001 al publico ni la BD; solo api.* por Nginx.
- Rota credenciales si quedaron en mensajes/logs historicos o se publico el repo.
