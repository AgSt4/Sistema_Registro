# Conexion completa: Google + Supabase + Vercel

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... # opcional si aun usas la key legacy
```

La app privilegia `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Si no existe, usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 1. Crear proyecto en Supabase

1. Entra a [Supabase](https://supabase.com/) y crea un proyecto.
2. Abre `SQL Editor`.
3. Ejecuta [schema.sql](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/supabase/schema.sql).
4. Ve a `Project Settings > API Keys` o al dialogo `Connect`.
5. Copia:
   - `Project URL`
   - `Publishable key`
   - o la `anon key` si tu proyecto aun usa la version legacy

## 2. Crear credenciales OAuth en Google Cloud

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o elige un proyecto.
3. Ve a `APIs & Services > OAuth consent screen`.
4. Completa la pantalla OAuth.
5. Ve a `Credentials > Create Credentials > OAuth client ID`.
6. Elige `Web application`.
7. En `Authorized JavaScript origins` agrega:
   - `http://localhost:3000`
   - `https://TU-PROYECTO.vercel.app`
   - tu dominio propio, si aplica
8. En `Authorized redirect URIs` agrega:
   - `https://TU-PROYECTO.supabase.co/auth/v1/callback`
9. Guarda y copia el `Client ID` y `Client Secret`.

## 3. Conectar Google en Supabase

1. Ve a `Authentication > Providers > Google`.
2. Activa el provider.
3. Pega el `Client ID` y `Client Secret`.
4. Ve a `Authentication > URL Configuration`.
5. Configura:
   - `Site URL`: `http://localhost:3000`
   - Redirect adicional: `http://localhost:3000/auth/callback`
   - Redirect adicional: `https://TU-PROYECTO.vercel.app/auth/callback`
   - agrega tu dominio propio si corresponde
6. Guarda.

Nota:
Google redirige primero a Supabase en `...supabase.co/auth/v1/callback`. Supabase luego devuelve la sesion a la app en `/auth/callback`.

## 4. Configurar desarrollo local

1. Copia `.env.example` a `.env.local`.
2. Completa:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

3. Ejecuta `npm install`.
4. Ejecuta `npm run dev`.
5. Abre [http://localhost:3000/login](http://localhost:3000/login).
6. Haz click en `Ingresar con Google`.

## 5. Crear tu primer administrador

Despues del primer login, el trigger de [schema.sql](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/supabase/schema.sql) crea automaticamente un registro en `public.profiles`.

Luego corre esto en `SQL Editor`, reemplazando el correo:

```sql
update public.profiles
set default_role = 'ADMIN'
where email = 'tu-correo@dominio.cl';

insert into public.area_memberships (profile_id, area, role, can_export)
select id, 'FORMACION', 'ADMIN', true
from public.profiles
where email = 'tu-correo@dominio.cl'
on conflict do nothing;
```

Si quieres acceso transversal desde el dia 1, repite el `insert` para cada area.

## 6. Desplegar en Vercel

1. Sube el repo a GitHub.
2. Crea un proyecto en [Vercel](https://vercel.com/).
3. En `Settings > Environment Variables` agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Guarda las variables en `Production`. Si quieres, replica en `Preview` y `Development`.
5. Despliega.

Importante:
Los cambios de variables en Vercel requieren un nuevo deploy para aplicarse.

## 7. Cerrar el circuito

Cuando ya tengas la URL final de Vercel:

1. Agregala en Google Cloud como `Authorized JavaScript origin`.
2. Agregala en Supabase como redirect URL en `Authentication > URL Configuration`.
3. Si cambiaste variables o dominios, redeploy en Vercel.

## Archivos ya preparados en el proyecto

- Login: [app/login/page.tsx](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/app/login/page.tsx)
- Callback: [app/auth/callback/route.ts](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/app/auth/callback/route.ts)
- Cliente SSR server: [lib/supabase/server.ts](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/lib/supabase/server.ts)
- Cliente browser: [lib/supabase/browser.ts](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/lib/supabase/browser.ts)
- Middleware de sesion: [middleware.ts](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/middleware.ts)
- Lectura de datos reales: [lib/data.ts](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/lib/data.ts)
- Deduplicacion y normalizacion: [lib/dedupe.ts](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/lib/dedupe.ts)
- Bandeja de revision: [app/dedupe/page.tsx](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/app/dedupe/page.tsx)

## Nota de deduplicacion

El esquema ya viene preparado para operar identidad canonica y revision humana:

- `people` guarda campos normalizados de `rut`, `email`, `telefono` y `nombre`.
- `person_identity_signals` deja trazabilidad de cada señal usada para comparar registros.
- `dedupe_cases` guarda posibles duplicados y merges automaticos auditables.
- `person_merge_history` deja historial de fusiones bajo un ID canonico.

La cascada pensada es:

1. `RUT`
2. `email`
3. `telefono`
4. `nombre + apellido`

Los tres primeros pueden disparar auto-merge auditable. El cuarto debe ir por defecto a revision humana.
