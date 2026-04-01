/**
 * @fileoverview Solo Menú y Orquestador. Asume que las otras funciones ya existen.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚡ Normalización')
    .addItem('▶️ EJECUTAR LIMPIEZA', 'BOTON_EJECUTAR_TODO')
    .addToUi();
}

function BOTON_EJECUTAR_TODO() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  // 1. PURGA PREVENTIVA: Eliminar validadores para que no bloqueen la limpieza
  // (Esto soluciona el problema de que se bloquee la planilla)
  ss.toast('Eliminando validaciones para escritura segura...', 'Paso 1');
  sheet.getDataRange().clearDataValidations();
  SpreadsheetApp.flush(); // Obliga a que esto termine antes de seguir

  try {
    // 2. LLAMADA A TUS FUNCIONES EXISTENTES
    // Usamos los nombres exactos que mostraste en las capturas
    
    normalizarBaseCompleta();       // Limpia Rut, Mail, Nombres
    normalizarUniversidades();      // Regex de Ues
    normalizarDominiosBatch();      // Comunas, Carreras, Roles
    asignarSexo();                  // Ojo: En tu captura se llama 'asignarSexo', no 'Masivo'
    
    // 3. RE-INSTALACIÓN DE VALIDACIONES
    // Vuelve a colocar los dropdowns al final
    ss.toast('Reinstalando validaciones y dropdowns...', 'Paso Final');
    aplicarEsquemaValidacion();
    
    ui.alert('Proceso Terminado', 'Base normalizada y validada correctamente.', ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('Error', 'Hubo un problema llamando a una función: ' + e.message, ui.ButtonSet.OK);
  }
}
