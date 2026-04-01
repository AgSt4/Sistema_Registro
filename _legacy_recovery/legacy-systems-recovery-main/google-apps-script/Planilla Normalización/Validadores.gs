/* ============================================================ 
🛡️ GESTOR DE VALIDACIONES Y PROTECCIÓN (MASTER VALIDATOR V2.3)
============================================================ */
function aplicarEsquemaValidacion() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  const log = [];

  // MENSAJE DE ESTADO INICIAL
  ss.toast('⚙️ Analizando estructura y limpiando reglas antiguas...', 'En curso', -1);

  const sheetDic = ss.getSheetByName('Diccionario');
  if (!sheetDic) { ui.alert('❌ Falta la hoja "Diccionario".'); return; }

  const dicMap = mapaColumnasDiccionario(sheetDic);
  const ESQUEMA = obtenerEsquemaReglas();

  Object.keys(ESQUEMA).forEach(nombreHoja => {
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet) return;

    // 1. LIMPIEZA PROFUNDA
    const protecciones = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    protecciones.forEach(p => p.remove());

    sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns()).clearDataValidations();

    const headers = obtenerCabeceras(sheet);
    const maxRows = sheet.getMaxRows();

    // 2. FORMATO GENERAL (DEBE IR ANTES DEL FORMATO AUTOMÁTICO)
    const headerRange = sheet.getRange(1, 1, 1, sheet.getMaxColumns());
    headerRange.setBackground('#161233');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontFamily('Playfair Display');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    if (maxRows > 1) {

  // CASO ESPECIAL: no tocar ID_IP de PARTICIPACIÓN_REGIONAL (sistema cromático)
  if (nombreHoja === 'PARTICIPACIÓN_REGIONAL' && headers['ID_IP']) {
    const colID = headers['ID_IP'];

    // Rango antes de ID_IP
    if (colID > 1) {
      const leftRange = sheet.getRange(2, 1, maxRows - 1, colID - 1);
      leftRange.setBackground('#FFFFFF');
      leftRange.setFontColor('#000000');
      leftRange.setFontFamily('Roboto Mono');
      leftRange.setFontSize(10);
    }

    // Rango después de ID_IP
    if (colID < sheet.getMaxColumns()) {
      const rightRange = sheet.getRange(2, colID + 1, maxRows - 1, sheet.getMaxColumns() - colID);
      rightRange.setBackground('#FFFFFF');
      rightRange.setFontColor('#000000');
      rightRange.setFontFamily('Roboto Mono');
      rightRange.setFontSize(10);
    }

  } else {
    // Normal para el resto de hojas
    const contentRange = sheet.getRange(2, 1, maxRows - 1, sheet.getMaxColumns());
    contentRange.setBackground('#FFFFFF');
    contentRange.setFontColor('#000000');
    contentRange.setFontFamily('Roboto Mono');
    contentRange.setFontSize(10);
  }
}



    // 2. APLICAR REGLAS Y FORMATOS
    Object.keys(headers).forEach(colName => {
      const colIndex = headers[colName];
      const config = ESQUEMA[nombreHoja][colName];
      const rango = sheet.getRange(2, colIndex, maxRows - 1, 1);

      if (!config) return;

      try {
        // A. PROTECCIONES
        if (config.tipo === 'LOCKED' || config.tipo === 'LOCKED_CHECKBOX') {
          const proteccion = rango.protect().setDescription(`🔒 Sistema: ${colName}`);
          proteccion.setWarningOnly(true);

          if (config.tipo === 'LOCKED_CHECKBOX') {
            rango.insertCheckboxes();
          }

        } else {
          // B. VALIDACIONES
          const reglaBuilder = construirRegla(ss, sheetDic, dicMap, config, sheet, headers);
          if (reglaBuilder) rango.setDataValidation(reglaBuilder);

          if (config.tipo === 'CHECKBOX') {
            rango.insertCheckboxes();
          }
        }

        // C. FORMATO AUTOMÁTICO
        if (config.automatica) {
          const rangoConHeader = sheet.getRange(1, colIndex, maxRows, 1);
          rangoConHeader.setBackground('#F3E5F5');
          rangoConHeader.setFontColor('#6A1B9A');
          rangoConHeader.setFontStyle('italic');
        }

      } catch (e) {
        log.push(`⚠️ Error en ${nombreHoja} [${colName}]: ${e.message}`);
      }
    });

    // 4. WHATSAPP
    if (headers['WhatsApp']) {
      inyectarFormulaWhatsApp(sheet, headers);
      log.push(`✅ ${nombreHoja}: WhatsApp configurado.`);
    }

    log.push(`✅ ${nombreHoja}: Blindaje aplicado.`);
  });

  // MENSAJE FINAL
  ss.toast('✅ Proceso finalizado correctamente.', 'Listo', 3);

  if (log.length > 0) {
    console.log(log.join('\n'));
  }
}

/* ============================================================
   🧠 ESQUEMA DE REGLAS (CON FLAGS DE COLUMNAS AUTOMÁTICAS)
   ============================================================ */

function obtenerEsquemaReglas() {
  const COMUN_DIRECTORIO = {
    'ID_IP':            { tipo: 'ID', automatica: true }, // ✅ Solo automática en DIRECTORIO
    'Correo':           { tipo: 'EMAIL' },
    'Teléfono':         { tipo: 'TELEFONO' }, // ✅ Validación condicional según Dirección
    'Sexo':             { tipo: 'LIST', valores: ['Masculino', 'Femenino'] },
    'Colegio':          { tipo: 'DICT', ref: 'Colegios' },
    'Universidad':      { tipo: 'DICT', ref: 'Sigla_Uni' },
    'Egreso_Col':       { tipo: 'NUMBER', min: 1925, max: 2125 },
    'Egreso_Uni':       { tipo: 'NUMBER', min: 1925, max: 2125 },
    'Carrera':          { tipo: 'DICT_MULTI', ref: 'Carreras' },
    'Rol':              { tipo: 'DICT', ref: 'Rol' },
    'Dirección':        { tipo: 'DICT', ref: 'Sigla_Dir', automatica: true },
    'Dirección_Origen': { tipo: 'DICT', ref: 'Sigla_Dir', automatica: true },
    'Estado':           { tipo: 'DICT', ref: 'Estado de Seguimiento' },
    'Cumpleaños':       { tipo: 'DATE' },
    'Comuna':           { tipo: 'DICT', ref: 'Comunas' },
    'País':             { tipo: 'DICT', ref: 'Países' },
    'RUT':              { tipo: 'RUT' },
    'Interesante':      { tipo: 'CHECKBOX' },
    'SDD':              { tipo: 'CHECKBOX' },
    'Colectivo':        { tipo: 'CHECKBOX' },
    'WhatsApp':         { tipo: 'LOCKED', automatica: true },
    'Creado':           { tipo: 'LOCKED', automatica: true }, 
    'Actualizado':      { tipo: 'LOCKED', automatica: true }
  };

  const COMUN_PARTICIPACION = {
    'ID_IP':            { tipo: 'ID' }, // ⚠️ SIN automatica - mantiene código de colores funcional
    'Correo':           { tipo: 'EMAIL' },
    'Teléfono':         { tipo: 'TELEFONO' }, // ✅ Validación condicional según Dirección
    'Sexo':             { tipo: 'LIST', valores: ['Masculino', 'Femenino'] },
    'Colegio':          { tipo: 'DICT', ref: 'Colegios' },
    'Universidad':      { tipo: 'DICT', ref: 'Sigla_Uni' },
    'Egreso_Col':       { tipo: 'NUMBER', min: 1925, max: 2125 },
    'Egreso_Uni':       { tipo: 'NUMBER', min: 1925, max: 2125 },
    'Carrera':          { tipo: 'DICT_MULTI', ref: 'Carreras' },
    'Rol':              { tipo: 'DICT', ref: 'Rol' },
    'Dirección':        { tipo: 'DICT', ref: 'Sigla_Dir', automatica: true },
    'Dirección_Origen': { tipo: 'DICT', ref: 'Sigla_Dir' },
    'Estado':           { tipo: 'DICT', ref: 'Estado de Seguimiento' },
    'Cumpleaños':       { tipo: 'DATE' },
    'Comuna':           { tipo: 'DICT', ref: 'Comunas' },
    'País':             { tipo: 'DICT', ref: 'Países' },
    'RUT':              { tipo: 'RUT' },
    'Interesante':      { tipo: 'CHECKBOX' },
    'SDD':              { tipo: 'CHECKBOX' },
    'Colectivo':        { tipo: 'CHECKBOX' },
    'WhatsApp':         { tipo: 'LOCKED' },
    'Creado':           { tipo: 'LOCKED', automatica: true },
    'Actualizado':      { tipo: 'LOCKED' },
    'Proyecto':         { tipo: 'DICT', ref: 'Proyecto' },
    'Tipo_Registro':    { tipo: 'DICT', ref: 'Tipo_Registro' },
    'MATRIZ':           { tipo: 'CHECKBOX', automatica: true }
  };

  return {
    'DIRECTORIO_REGIONAL': COMUN_DIRECTORIO,
    'PARTICIPACIÓN_REGIONAL': COMUN_PARTICIPACION
  };
}

/* ============================================================
   🏗️ FÁBRICA DE REGLAS
   ============================================================ */

function construirRegla(ss, sheetDic, dicMap, config, sheet, headers) {
  let rule = SpreadsheetApp.newDataValidation();

  switch (config.tipo) {
    case 'ID':
      const regexID = "^(?:[A-Z0-9\\-\\']+_){2,3}[A-Z0-9]{4}$";
      rule.requireFormulaSatisfied(`=REGEXMATCH(TO_TEXT(INDIRECT("R[0]C[0]"; FALSE)); "${regexID}")`);
      rule.setHelpText('⚠️ Formato ID inválido.\nDebe ser: NOMBRE_APELLIDO_XXXX (Mayúsculas).\nEj: JUAN_PEREZ_A1B2');
      break;

    case 'TELEFONO':
      // ✅ Validación condicional: Si Dirección==INTL, no valida formato
      if (headers['Dirección']) {
        const colDireccion = columnToLetter(headers['Dirección']);
        // Acepta: 9 dígitos empezando con 9
        rule.requireFormulaSatisfied(
          `=OR(INDIRECT("${colDireccion}"&ROW())="INTL"; REGEXMATCH(TO_TEXT(INDIRECT("R[0]C[0]"; FALSE)); "^9[0-9]{8}$"))`
        );
        rule.setHelpText('Formato chileno: 9 dígitos empezando con 9 (ej: 912345678)\n(Sin validación si Dirección=INTL)');
      } else {
        rule.requireFormulaSatisfied(`=REGEXMATCH(TO_TEXT(INDIRECT("R[0]C[0]"; FALSE)); "^9[0-9]{8}$")`);
        rule.setHelpText('Formato chileno: 9 dígitos empezando con 9 (ej: 912345678)');
      }
      break;

    case 'DICT_MULTI':
      if (!dicMap[config.ref]) return null;
      const colLetM = columnToLetter(dicMap[config.ref]);
      const rangeDicM = sheetDic.getRange(`${colLetM}2:${colLetM}`);
      
      rule.requireValueInRange(rangeDicM, true);
      rule.setAllowInvalid(true);
      break;

    case 'DICT':
    case 'DICT_SOFT':
      if (!dicMap[config.ref]) return null;
      const colLetter = columnToLetter(dicMap[config.ref]);
      const rangeDic = sheetDic.getRange(`${colLetter}2:${colLetter}`);
      rule.requireValueInRange(rangeDic, true);
      rule.setAllowInvalid(config.tipo === 'DICT_SOFT');
      break;

    case 'LIST':
      rule.requireValueInList(config.valores, true);
      break;

    case 'NUMBER':
      rule.requireNumberBetween(config.min, config.max);
      rule.setHelpText(`Debe ser un número entre ${config.min} y ${config.max}`);
      break;

    case 'DATE':
      rule.requireDate();
      break;

    case 'EMAIL':
      const regexEmail = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
      rule.requireFormulaSatisfied(`=REGEXMATCH(INDIRECT("R[0]C[0]"; FALSE); "${regexEmail}")`);
      rule.setHelpText('Correo inválido (Debe tener @ y .)');
      break;

    case 'RUT':
      // ✅ CORREGIDO: Acepta dígito verificador numérico (0-9) O letra K/k
      rule.requireFormulaSatisfied(`=REGEXMATCH(TO_TEXT(INDIRECT("R[0]C[0]"; FALSE)); "^[0-9]{7,8}-[0-9Kk]$")`);
      rule.setHelpText('Formato requerido: 12345678-9 o 12345678-K (Sin puntos, con guión)');
      break;

    case 'CHECKBOX':
      // ✅ No retornamos regla para checkboxes, se insertan directamente
      return null;

    default:
      return null;
  }

  return rule.build();
}


function mapaColumnasDiccionario(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => { 
    if(h) map[h.toString().trim()] = i + 1; 
  });
  return map;
}


function obtenerCabeceras(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => { 
    if(h) map[h.toString().trim()] = i + 1; 
  });
  return map;
}

function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
