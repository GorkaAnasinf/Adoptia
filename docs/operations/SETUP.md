# Setup — Adoptia

Cómo arrancar el proyecto desde cero en Windows (PowerShell). `make` requiere Git Bash/WSL — aquí van los **comandos directos** como ruta principal.

## Requisitos

- Node.js 20+ y npm
- Python 3.10+ (script de planificación y MkDocs)
- Git
- Cuenta en [Supabase](https://supabase.com) (free) y [Vercel](https://vercel.com) (Hobby)
- Supabase CLI: `npm i -g supabase` (o scoop)

## 1. Clonar y dependencias

```powershell
git clone <URL-del-repo> adoptia
cd adoptia
npm install                      # cuando exista package.json (FEATURE-000)
pip install pre-commit mkdocs-material
pre-commit install
```

## 2. Supabase

1. Crear proyecto en el dashboard (región `eu-west`).
2. `Settings → API`: copiar URL, `anon key` y `service_role key`.
3. Activar PostGIS: `Database → Extensions → postgis`.
4. Aplicar migraciones y seed:

```powershell
supabase link --project-ref <ref-del-proyecto>
supabase db push
# demo: supabase db reset  (aplica migraciones + seed.sql)
```

## 3. Variables de entorno

```powershell
Copy-Item .env.example .env.local
# editar .env.local con las claves reales
```

Detalle de cada variable en [ENVIRONMENT.md](ENVIRONMENT.md).

## 4. Arrancar

```powershell
npm run dev          # http://localhost:3000
```

## 5. Verificar

```powershell
npm run lint
npx tsc --noEmit
npm run test
python scripts/render_planning.py   # planificación al día
mkdocs serve                        # docs en http://localhost:8000
```

## 6. Deploy (una vez)

1. Importar el repo en Vercel; framework Next.js autodetectado.
2. Añadir variables de entorno en Vercel (Production + Preview).
3. `main` → producción; `develop` → preview automático.
4. En GitHub: secrets `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para CI y keepalive.

## Problemas comunes

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Invalid API key` al arrancar | `.env.local` sin rellenar | Paso 3 |
| Consultas devuelven vacío existiendo datos | RLS bloquea (esperado sin sesión) | Revisar políticas / usar usuario de prueba |
| Mapa en blanco | Leaflet renderizado en SSR | Importar con `dynamic(..., { ssr: false })` |
| Supabase "paused" | 7 días sin actividad (free) | Reactivar en dashboard; keepalive.yml lo previene |
