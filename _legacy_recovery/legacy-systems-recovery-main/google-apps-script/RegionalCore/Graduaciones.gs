/* ============================================================
   🎓 AUTOMATIZACIÓN DE CAMBIO DE MANDO (GRADUACIÓN)
   ============================================================ */

function actualizarRolesPorEgreso() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  
  // 1. Configuración: ¿En qué hoja trabajamos?
  // Lo ideal es correrlo en la fuente original (Regional) para que el cambio sea permanente.
  const NOMBRE_HOJA = 'DIRECTORIO_REGIONAL'; 
  const sheet = ss.getSheetByName(NOMBRE_HOJA);
  
  if (!sheet) {
    ui.alert(`❌ No encuentro la hoja "${NOMBRE_HOJA}".`);
    return;
  }

  // Confirmación de seguridad (Porque esto modifica datos masivamente)
  const resp = ui.alert(
    '🎓 MODO GRADUACIÓN',
    '¿Deseas actualizar los ROLES según el año de egreso?\n\n' +
    '• Escolares egresados pasarán a Universitarios.\n' +
    '• Universitarios egresados pasarán a Profesionales.\n\n' +
    'Esta acción es irreversible.',
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  // 2. Lectura de Datos
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  
  // Mapeo dinámico de columnas (para no depender de posiciones fijas)
  const map = {};
  headers.forEach((h, i) => map[String(h).trim()] = i);

  // Verificamos que existan las columnas necesarias
  if (map['Rol'] === undefined || map['Egreso_Col'] === undefined || map['Egreso_Uni'] === undefined) {
    ui.alert('❌ Faltan columnas clave (Rol, Egreso_Col o Egreso_Uni).');
    return;
  }

  const idxRol = map['Rol'];
  const idxCol = map['Egreso_Col'];
  const idxUni = map['Egreso_Uni'];

  const YEAR_ACTUAL = new Date().getFullYear(); // 2025, 2026, etc.
  let cambios = 0;
  const nuevosRoles = []; // Array vertical solo para la columna Rol

  // 3. Procesamiento (Fila por fila en memoria)
  // Empezamos desde i=1 para saltar encabezados
  for (let i = 1; i < values.length; i++) {
    const fila = values[i];
    let rolActual = fila[idxRol];
    const egresoCol = parseInt(fila[idxCol]); // Aseguramos que sea número
    const egresoUni = parseInt(fila[idxUni]); // Aseguramos que sea número
    
    let nuevoRol = rolActual; // Por defecto, se queda igual

    // REGLA 1: Escolar -> Universitario
    if (rolActual === 'Escolares' && !isNaN(egresoCol) && egresoCol > 0) {
      // Si el año actual es MAYOR al de egreso (Ej: 2025 > 2024), ya salió.
      if (YEAR_ACTUAL > egresoCol) {
        nuevoRol = 'Universitarios';
        cambios++;
      }
    }

    // REGLA 2: Universitario -> Profesional
    else if (rolActual === 'Universitarios' && !isNaN(egresoUni) && egresoUni > 0) {
      if (YEAR_ACTUAL > egresoUni) {
        nuevoRol = 'Profesionales';
        cambios++;
      }
    }

    nuevosRoles.push([nuevoRol]);
  }

  // 4. Escritura Eficiente (Solo sobreescribimos la columna Rol)
  // fila 2, columna Rol + 1, alto = cantidad de datos, ancho = 1
  if (cambios > 0) {
    sheet.getRange(2, idxRol + 1, nuevosRoles.length, 1).setValues(nuevosRoles);
    ss.toast(`Se actualizaron ${cambios} personas de rol.`, '🎓 Graduación Completa');
  } else {
    ss.toast('No se encontraron personas para graduar este año.', 'Información');
  }
}
