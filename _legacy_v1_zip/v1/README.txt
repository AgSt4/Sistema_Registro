================================================================
SISTEMA DE FORMACIÓN POLÍTICA — GUÍA DE INSTALACIÓN
================================================================
Instrucciones en español, paso a paso, sin jerga técnica.
Tiempo estimado: 30-45 minutos la primera vez.
================================================================


════════════════════════════════════════════════════════════════
PASO 1 — CREAR PROYECTO EN SUPABASE
════════════════════════════════════════════════════════════════

1. Ve a https://supabase.com y crea una cuenta gratuita (o inicia sesión).

2. Haz clic en "New project".

3. Elige un nombre (por ejemplo: "formacion-politica"), selecciona
   una región cercana (South America - São Paulo es la más cercana),
   y crea una contraseña segura para la base de datos. Guárdala.

4. Espera ~2 minutos mientras Supabase crea el proyecto.

5. Cuando el panel esté listo, ve al menú izquierdo → "SQL Editor".

6. Copia TODO el contenido del archivo "schema.sql" que te entregamos.

7. Pégalo en el editor SQL y haz clic en "Run" (botón verde).
   Deberías ver "Success. No rows returned."

   Si ves un error, asegúrate de haber copiado el archivo completo
   desde el inicio hasta el final.


════════════════════════════════════════════════════════════════
PASO 2 — CONFIGURAR GOOGLE OAUTH
════════════════════════════════════════════════════════════════

--- Parte A: En Google Cloud Console ---

1. Ve a https://console.cloud.google.com y crea una cuenta o inicia sesión.

2. Crea un proyecto nuevo (esquina superior izquierda → "Nuevo proyecto").

3. En el menú, busca "APIs y servicios" → "Pantalla de consentimiento de OAuth".
   - Selecciona "Externo" → Crear.
   - Llena el nombre de la app (ej: "Sistema Formación"), tu email, y guarda.
   - En "Alcances" no necesitas agregar nada extra. Guarda y continúa.

4. Ve a "APIs y servicios" → "Credenciales" → "Crear credenciales" → "ID de cliente OAuth".
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "Formación Web"
   - En "Orígenes autorizados de JavaScript" agrega:
       https://TU-PROYECTO.supabase.co
       (reemplaza TU-PROYECTO con el nombre real de tu proyecto Supabase)
   - En "URIs de redireccionamiento autorizados" agrega:
       https://TU-PROYECTO.supabase.co/auth/v1/callback
   - Haz clic en "Crear".

5. Copia el "ID de cliente" y el "Secreto del cliente" que aparecen.

--- Parte B: En Supabase ---

6. En el panel de Supabase, ve a "Authentication" → "Providers".

7. Busca "Google" y actívalo (el interruptor).

8. Pega el "Client ID" y "Client Secret" que copiaste de Google.

9. Guarda los cambios.


════════════════════════════════════════════════════════════════
PASO 3 — EDITAR config.js
════════════════════════════════════════════════════════════════

Abre el archivo "config.js" con cualquier editor de texto (Bloc de notas,
Notepad, TextEdit, etc.) y reemplaza los 3 valores:

1. SUPABASE_URL: En el panel de Supabase, ve a "Settings" → "API".
   Copia el valor "Project URL" (empieza con https://).

2. SUPABASE_ANON_KEY: En la misma página, copia el valor "anon public"
   (es una clave larga que empieza con "eyJ...").

3. GOOGLE_CLIENT_ID: Es el "ID de cliente" que obtuviste en el Paso 2.

El archivo debería quedar así:
   const SUPABASE_URL = "https://abcdefghij.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6...";
   const GOOGLE_CLIENT_ID = "123456789.apps.googleusercontent.com";

Guarda el archivo.


════════════════════════════════════════════════════════════════
PASO 4 — CREAR USUARIOS
════════════════════════════════════════════════════════════════

Necesitas crear los usuarios del sistema en dos pasos:

--- Paso A: Invitar al usuario desde Supabase ---

1. En el panel de Supabase, ve a "Authentication" → "Users".
2. Haz clic en "Invite user".
3. Escribe el correo Gmail del usuario (ej: gestor@gmail.com).
4. Haz clic en "Send invitation".
5. Supabase creará el usuario. Copia el UUID que aparece en la lista
   (es un código largo como: a1b2c3d4-e5f6-7890-abcd-ef1234567890).

--- Paso B: Asignar rol en la base de datos ---

6. Ve a "SQL Editor" y ejecuta uno de estos comandos según el rol:

PARA EL GESTOR CENTRAL:
   INSERT INTO usuarios (id, nombre, rol, sede_id)
   VALUES ('PEGA-EL-UUID-AQUI', 'Nombre del Gestor', 'gestor', null);

PARA UN ENCARGADO DE SEDE:
   Primero necesitas el ID de la sede. Ve a "Table Editor" → tabla "sedes"
   y copia el id de la sede correspondiente.
   Luego ejecuta:
   INSERT INTO usuarios (id, nombre, rol, sede_id)
   VALUES ('PEGA-EL-UUID-AQUI', 'Nombre del Encargado', 'encargado', 'ID-DE-LA-SEDE');

Repite los pasos A y B para cada persona que deba acceder al sistema.


════════════════════════════════════════════════════════════════
PASO 5 — PUBLICAR EN VERCEL
════════════════════════════════════════════════════════════════

1. Ve a https://vercel.com y crea una cuenta gratuita (o inicia sesión).

2. En el panel de Vercel, haz clic en "Add New..." → "Project".

3. Vercel ofrecerá importar desde GitHub, pero podemos usar el método
   más simple: en la parte inferior de la pantalla busca la opción
   "Deploy without Git" o arrastra una carpeta.

   Método alternativo (más fácil):
   - Instala la extensión de Vercel o usa Vercel CLI... 
   
   MÉTODO MÁS SIMPLE (recomendado sin conocimientos técnicos):
   - Ve a https://vercel.com/new
   - En la sección inferior, busca "Or deploy from your computer"
   - Arrastra la carpeta completa con los archivos al área indicada
   - O usa el botón para seleccionar la carpeta

4. Vercel detectará los archivos automáticamente. No necesitas cambiar
   ninguna configuración. Haz clic en "Deploy".

5. En ~1 minuto, Vercel te dará una URL pública (ej: formacion-xxxx.vercel.app).
   Esa es la URL del sistema.

6. IMPORTANTE: Vuelve a Google Cloud Console (Paso 2) y agrega esta nueva
   URL en los "Orígenes autorizados de JavaScript" y en los
   "URIs de redireccionamiento autorizados" también en Supabase:
   - En Supabase: Authentication → URL Configuration → Site URL → escribe tu URL de Vercel
   - También agrega en "Redirect URLs": https://tu-url.vercel.app/app.html


════════════════════════════════════════════════════════════════
PASO 6 — PRIMER ACCESO
════════════════════════════════════════════════════════════════

1. Abre la URL de Vercel en el navegador.
2. Verás la pantalla de login con el botón "Ingresar con Google".
3. Haz clic y selecciona la cuenta Gmail que registraste como gestor.
4. Si todo está bien, accederás al sistema.

Si el sistema dice "Tu cuenta no está autorizada", significa que
olvidaste ejecutar el INSERT en el Paso 4B.


════════════════════════════════════════════════════════════════
ERRORES COMUNES Y SOLUCIONES
════════════════════════════════════════════════════════════════

ERROR: "invalid_client" al intentar iniciar sesión con Google
SOLUCIÓN: El Client ID o Client Secret en Supabase no coincide con
los de Google Cloud Console. Vuelve a verificar los valores.

ERROR: "redirect_uri_mismatch"
SOLUCIÓN: La URL de Vercel no está en la lista de URIs autorizados
en Google Cloud Console. Agrégala siguiendo el Paso 5.6.

ERROR: "Tu cuenta no está autorizada"
SOLUCIÓN: El email no está registrado en la tabla "usuarios".
Ejecuta el INSERT del Paso 4B con el UUID correcto.

ERROR: Los datos no cargan / pantalla en blanco
SOLUCIÓN: El config.js tiene valores incorrectos. Verifica que
SUPABASE_URL y SUPABASE_ANON_KEY estén bien copiados.

ERROR: Al ejecutar schema.sql aparece "relation already exists"
SOLUCIÓN: Significa que ya ejecutaste el schema antes. No es un
error grave si es la primera vez. Puedes ignorarlo o ejecutar
solo las partes faltantes.

ERROR: No veo el botón de arrastar en Vercel
SOLUCIÓN: Usa la opción de importar desde GitHub:
1. Crea cuenta en GitHub (github.com)
2. Crea un repositorio nuevo
3. Sube los archivos
4. Importa ese repositorio en Vercel


════════════════════════════════════════════════════════════════
DATOS DE EJEMPLO INCLUIDOS
════════════════════════════════════════════════════════════════

El schema.sql ya incluye datos de ejemplo:
- 2 sedes: Santiago Centro y Valparaíso
- 2 rutas formativas con 4 hitos cada una
- 5 personas de ejemplo
- 3 actividades de ejemplo

Para eliminar estos datos de ejemplo antes de usar el sistema en
producción, ve al SQL Editor y ejecuta:
   DELETE FROM asistencias;
   DELETE FROM sesiones;
   DELETE FROM actividad_hito;
   DELETE FROM actividades;
   DELETE FROM persona_ruta;
   DELETE FROM persona_sede;
   DELETE FROM personas;
   DELETE FROM hitos;
   DELETE FROM rutas;
   -- No borres las sedes ni los usuarios

================================================================
¿Necesitas ayuda? Contacta al equipo técnico con el mensaje de
error exacto que aparece en pantalla.
================================================================
