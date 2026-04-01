# Cliente Satélite (Wrapper / Interfaz)

**Tipo:** Cliente Ligero (Thin Client)
**Dependencia CRÍTICA:** Librería `RegionalCore`
**Despliegue:** Se pega en cada Planilla Regional.

## ⚠️ Instrucciones de Restauración (VITAL)
Este código **NO FUNCIONARÁ** por sí solo. Es un "Wrapper" que redirige llamadas.

Para que funcione tras una restauración:
1. Abrir el editor de Apps Script de la planilla satélite.
2. Ir a **"Bibliotecas" (Libraries)** en la barra lateral izquierda (+).
3. Agregar el **Script ID** del proyecto `RegionalCore`.
4. Configurar el Identificador como: `RegionalCore` (Exactamente así, mayúsculas y minúsculas).
5. Seleccionar la versión más reciente (HEAD o numerada).

## Funcionalidad
* **onOpen:** Inyecta el menú visual usando `RegionalCore.iniciarMenuRegional()`.
* **Wrappers:** Funciones puente (ej: `setRegionSTGO`) que permiten asignar los botones del menú a la lógica encapsulada en la librería.
* **Sin Triggers Locales:** Delega toda la vigilancia de `onEdit` a los activadores instalables gestionados por la Librería.
