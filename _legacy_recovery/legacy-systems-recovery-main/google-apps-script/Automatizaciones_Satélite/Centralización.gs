/* ============================================================
   CLIENTE: CONECTOR CON LIBRERÍA MAESTRA (VERSIÓN LIGERA)
   Identificador de Librería requerido: RegionalCore
   ============================================================ */

/* IMPORTANTE: 
   Aquí NO debe haber función onEdit().
   La vigilancia la realiza la Librería RegionalCore directamente 
   mediante los Activadores Instalables.
*/

// 1. GATILLADORES (Solo Menu)
function onOpen() {
  // Dibuja el menú al abrir la hoja
  RegionalCore.iniciarMenuRegional(); 
}

/* ============================================================
   2. WRAPPERS DEL MENÚ (Puentes Locales)
   Necesarios para que los botones del menú encuentren la función.
   ============================================================ */

// Selectores de Región (Mantenemos estos puentes para que el menú no de error)
function setRegionSTGO() { RegionalCore.setDireccion('STGO'); }
function setRegionIPBB() { RegionalCore.setDireccion('IPBB'); }
function setRegionIPLL() { RegionalCore.setDireccion('IPLL'); }
function setRegionIPOH() { RegionalCore.setDireccion('IPOH'); }
function setRegionINTL() { RegionalCore.setDireccion('INTL'); }
function setRegionHIST() { RegionalCore.setDireccion('HIST'); }
function setRegionIPAR() { RegionalCore.setDireccion('IPAR'); }

// Botones de Acción
function procesarPendientesTodo()    { RegionalCore.procesarPendientesTodo(); }

// Botones de validación
function aplicarEsquemaValidacion()  { RegionalCore.aplicarEsquemaValidacion(); }

/* ============================================================
   CONECTOR DE GRADUACIÓN (Puente a la Librería)
   ============================================================ */

function actualizarRolesPorEgreso() {
  RegionalCore.actualizarRolesPorEgreso();
}
