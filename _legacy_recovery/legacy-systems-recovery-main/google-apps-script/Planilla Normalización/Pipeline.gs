/**
 * @fileoverview Orquestador maestro. Ejecuta todos los módulos de limpieza en orden.
 */

function NORMALIZAR_TODO_EL_STAGING() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Feedback visual inicial
  ss.toast('Iniciando proceso de normalización masiva...', '🚀 Procesando', 10);

  try {
    // 1. Limpieza básica y formatos (Rut, Teléfonos, Capitalización general)
    // Fuente: Normalizacion.gs
    console.time('Base Completa');
    normalizarBaseCompleta(); 
    console.timeEnd('Base Completa');

    // 2. Normalización de Universidades (Regex)
    // Fuente: NormalizacionUniversidades.gs
    console.time('Universidades');
    normalizarUniversidades();
    console.timeEnd('Universidades');

    // 3. Normalización de Dominios (Comuna, Carrera, Rol contra Diccionarios)
    // Fuente: NormalizacionDominios.gs
    console.time('Dominios');
    normalizarDominiosBatch();
    console.timeEnd('Dominios');

    // 4. Inferencia de Sexo (Si falta)
    // Fuente: AsignacionGenero.gs
    console.time('Genero');
    asignarSexoMasivo();
    console.timeEnd('Genero');

    // Notificación final
    ui.alert('Proceso Terminado', 'La base de datos ha sido normalizada exitosamente.', ui.ButtonSet.OK);

  } catch (e) {
    console.error(e);
    ui.alert('Error Crítico', 'Ocurrió un error durante la normalización:\n' + e.message, ui.ButtonSet.OK);
  }
}
