# Sistema de Datos IdeaPaís

ERP + CRM inicial para IdeaPaís, pensado para desplegar en `Vercel` y usar `Supabase` como base, auth y permisos.

## Qué incluye esta primera versión

- Dashboard ejecutivo con foco en formación, donaciones y activación.
- Directorio central de personas con responsable, etapa y pertenencia por área.
- Vista de formación con rutas, hitos y tablero tipo kanban.
- Módulo de actividades con reglas de asistencia y aprobación.
- Centro de exportación y plantillas Excel.
- Esquema SQL base para `Supabase` con `RLS`.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Inicia con `npm run dev`.

Si no configuras `Supabase`, la app usa datos demo para validar flujos y diseño.

## Montaje en Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En `SQL Editor`, ejecuta [`supabase/schema.sql`](/C:/Users/agu-s/OneDrive/Escritorio/Ideapaís/04_Sistema_Datos/Sistema_Registro/supabase/schema.sql).
3. En `Authentication > Providers`, habilita Google.
4. Agrega redirects:
   - `http://localhost:3000/auth/callback`
   - `https://tu-proyecto.vercel.app/auth/callback`
5. Copia `Project URL` y `anon public key` a `.env.local`.

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Crea un proyecto en [Vercel](https://vercel.com/).
3. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Despliega.

## Siguiente iteración sugerida

1. Conectar auth real con Google y callback.
2. Reemplazar datos demo por lectura y escritura desde Supabase.
3. Implementar carga real de Excel hacia tablas validadas.
4. Agregar filtros por área, región, ruta y responsable.
5. Conectar exportaciones a vistas SQL parametrizadas.
