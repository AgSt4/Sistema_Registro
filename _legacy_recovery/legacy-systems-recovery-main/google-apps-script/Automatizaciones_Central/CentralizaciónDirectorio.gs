/* ============================================================
   MÓDULO 2: DIRECTORIO Y PARTICIPACIÓN (DATOS) - OPTIMIZADO V4
   ============================================================ */

function sincronizarTodoHibrido() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert('🔄 SINCRONIZACIÓN TOTAL', 
    'Se ejecutarán 3 procesos en orden:\n\n' +
    '1. 🐝 DICCIONARIOS: Estandarización de reglas y nombres.\n' +
    '2. 👥 DIRECTORIO: Copia completa (Borrón y cuenta nueva).\n' +
    '3. 📅 PARTICIPACIÓN: Carga incremental (Solo nuevos).\n\n' +
    '¿Continuar?', ui.ButtonSet.YES_NO);
  
  if (resp !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActive();
  // CORRECCIÓN 1: Capturamos TimeZone aquí también
  const timeZone = ss.getSpreadsheetTimeZone(); 
  const sedes = obtenerSedes(ss);
  
  if (sedes.length === 0) { ui.alert('❌ Sin sedes configuradas en ' + SHEET_CONFIG_SEDES); return; }

  // 1. DICCIONARIOS
  try {
    SincronizarDiccionarios(); 
  } catch (e) {
    console.error("Error manual en Dicc:", e.message);
  }

  // 2. DATOS
  // CORRECCIÓN 2: Pasamos timeZone a las funciones
  const tDir = procesarFullSync(ss, sedes, ORIGEN_DIR, DESTINO_DIR, timeZone);
  const tPart = procesarIncremental(ss, sedes, ORIGEN_PART, DESTINO_PART, timeZone);

  ui.alert(`✅ PROCESO FINALIZADO\n\n` + 
           `👥 Directorio: ${tDir} registros.\n` + 
           `📅 Participación: ${tPart} nuevos.`);
  registrarLog("Sync Híbrido Manual", `Dir: ${tDir} | Part: ${tPart}`); // <--- AQUÍ
  SpreadsheetApp.flush();
}

function sincronizarDirectorioFull() {
  const ss = SpreadsheetApp.getActive();
  const timeZone = ss.getSpreadsheetTimeZone();
  const sedes = obtenerSedes(ss);
  const t = procesarFullSync(ss, sedes, ORIGEN_DIR, DESTINO_DIR, timeZone);
  SpreadsheetApp.getUi().alert(`✅ Directorio: ${t} registros.`);
  aplicarEsquemaValidacion()
}

function sincronizarParticipacionInc() {
  const ss = SpreadsheetApp.getActive();
  const timeZone = ss.getSpreadsheetTimeZone();
  const sedes = obtenerSedes(ss);
  const t = procesarIncremental(ss, sedes, ORIGEN_PART, DESTINO_PART, timeZone);
  SpreadsheetApp.getUi().alert(`✅ Participación: ${t} nuevos.`);
}


/* ============================================================
   PROCESAMIENTO FULL SYNC (CON FUSIÓN DE HISTORIAL DE SEDES)
   ============================================================ */
// CORRECCIÓN 3: Agregamos timeZone a los argumentos
function procesarFullSync(ss, sedes, hojaOrigen, hojaDestino, timeZone) {
  const sheetDest = ss.getSheetByName(hojaDestino);
  if (!sheetDest) return 0;

  const headersDest = sheetDest.getRange(1, 1, 1, sheetDest.getLastColumn()).getValues()[0];
  const colDestNames = headersDest.map(h => h.toString().trim());
  
  const idxCorreoDest = colDestNames.indexOf('Correo');
  const idxSedeDest = colDestNames.indexOf('Sede_Origen'); 
  const idxActualizado = colDestNames.indexOf('Actualizado');
  const COL_KEY = 'ID_IP';
  
  const dbUnificada = new Map();
  // CORRECCIÓN 4: Eliminamos 'const timeZone = Session...' porque ya viene por parámetro
  
  sedes.forEach(sede => {
    try {
      const ssOrigen = SpreadsheetApp.openById(sede.id);
      const sheetOrigen = ssOrigen.getSheetByName(hojaOrigen);
      if (!sheetOrigen || sheetOrigen.getLastRow() < 2) return;

      const data = sheetOrigen.getDataRange().getValues();
      const headersOrigen = data[0];
      const mapaOrigen = {};
      
      headersOrigen.forEach((h, i) => { if (h) mapaOrigen[h.toString().trim()] = i; });
      
      if (!mapaOrigen.hasOwnProperty(COL_KEY)) return;
      const idxKeyOrigen = mapaOrigen[COL_KEY];

      for (let i = 1; i < data.length; i++) {
        const fila = data[i];
        const valID = fila[idxKeyOrigen];
        
        if (!valID || valID.toString().trim() === '' || valID.toString().length < 3) continue;

        const filaNueva = [];
        
        colDestNames.forEach((colName, indexCol) => {
          let valor = '';
          
          // 1. Extracción del valor
          if (colName === 'Sede_Origen') {
            valor = sede.nombre;
          } else if (colName === 'País') {
             valor = mapaOrigen.hasOwnProperty('País') ? fila[mapaOrigen['País']] : 'Chile';
          } else if (mapaOrigen.hasOwnProperty(colName)) {
            valor = fila[mapaOrigen[colName]];
          }
          
          // 2. FORMATEO DE FECHAS
          if (valor !== "" && valor !== null) {
            if (colName === 'Creado' || colName === 'Actualizado') {
                valor = formatDateSafe(valor, "dd/MM/yyyy HH:mm", timeZone);
            } else if (colName === 'Cumpleaños') {
                valor = formatDateSafe(valor, "dd/MM/yyyy", timeZone);
            }
          }

          // 3. Limpiezas estándar
          if (indexCol === idxCorreoDest && typeof valor === 'string') {
            valor = valor.trim();
            if (valor !== '' && (!valor.includes('@') || !valor.includes('.'))) valor = ''; 
          }
          
          // Forzar texto para evitar conflictos de tipo en validación
          if (valor !== "" && valor !== null && typeof valor !== 'string') {
             valor = valor.toString();
          }
          
          filaNueva.push(valor);
        });

        // Fusión (Merge) con Lógica "Smart Overwrite"
        if (dbUnificada.has(valID)) {
          let filaExistente = dbUnificada.get(valID);
          let filaEntrante = filaNueva; 

          // 1. GESTIÓN DE SEDES (Acumulativa)
          if (idxSedeDest > -1) {
             const sedesPrevias = String(filaExistente[idxSedeDest]);
             const sedeActual = String(filaEntrante[idxSedeDest]);
             
             let sedesUnidas = sedesPrevias;
             if (!sedesPrevias.includes(sedeActual)) {
                sedesUnidas = sedesPrevias + ", " + sedeActual;
             }
             filaExistente[idxSedeDest] = sedesUnidas;
             filaEntrante[idxSedeDest] = sedesUnidas;
          }

          // 2. TORNEO DE FECHAS (¿Cuál es más reciente?)
          let filaGanadora = filaExistente;
          let filaPerdedora = filaEntrante;

          if (idxActualizado > -1) {
            const fechaExistente = parseFechaStr(filaExistente[idxActualizado]);
            const fechaEntrante = parseFechaStr(filaEntrante[idxActualizado]);

            if (fechaEntrante > fechaExistente) {
              filaGanadora = filaEntrante;
              filaPerdedora = filaExistente;
            }
          }

          // 3. COMPLETAR VACÍOS (Gap Filling)
          for (let k = 0; k < filaGanadora.length; k++) {
             if ((filaGanadora[k] === '' || filaGanadora[k] === null) && 
                 (filaPerdedora[k] !== '' && filaPerdedora[k] !== null)) {
                 filaGanadora[k] = filaPerdedora[k];
             }
          }

          // 4. GUARDAR AL GANADOR ENRIQUECIDO
          dbUnificada.set(valID, filaGanadora);

        } else {
          dbUnificada.set(valID, filaNueva);
        }
      }
    } catch (e) { console.error(`ERROR ${sede.nombre}: ${e.message}`); }
  });

  const granData = Array.from(dbUnificada.values());

  if (granData.length > 0) {
    const lastRow = sheetDest.getLastRow();
    const maxRows = sheetDest.getMaxRows();
    const lastCol = sheetDest.getLastColumn();

    if (lastRow > 1) sheetDest.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    
    // Limpiamos validaciones viejas para evitar bloqueos
    sheetDest.getRange(2, 1, maxRows - 1, lastCol).clearDataValidations();
    sheetDest.getRange(2, 1, granData.length, granData[0].length).setValues(granData);
    
    SpreadsheetApp.flush(); 
    sheetDest.activate(); 
    try {
        console.log("Reaplicando validaciones y WhatsApp en: " + hojaDestino);
        aplicarEsquemaValidacion(hojaDestino); 
    } catch(e) {
        console.warn("Error re-validando: " + e.message);
    }
  }
  
  return granData.length;
}

// CORRECCIÓN 5: Agregamos timeZone a los argumentos
function procesarIncremental(ss, sedes, hojaOrigen, hojaDestino, timeZone) {
  const sheetDest = ss.getSheetByName(hojaDestino);
  if (!sheetDest) return 0;

  const headersDest = sheetDest.getRange(1, 1, 1, sheetDest.getLastColumn()).getValues()[0];
  const colDestNames = headersDest.map(h => h.toString().trim());
  const COL_KEY = 'ID_IP';
  
  let totalNuevos = 0;

  sedes.forEach(sede => {
    try {
      const ssOrigen = SpreadsheetApp.openById(sede.id);
      const sheetOrigen = ssOrigen.getSheetByName(hojaOrigen);
      if (!sheetOrigen || sheetOrigen.getLastRow() < 2) return;

      const values = sheetOrigen.getDataRange().getValues();
      const mapaOrigen = {};
      values[0].forEach((h, i) => mapaOrigen[h.toString().trim()] = i);

      // Verificación segura de dependencia externa documentada
      const colCheckName = (typeof COL_CHECK_NAME !== 'undefined') ? COL_CHECK_NAME : null;

      if (colCheckName && !mapaOrigen.hasOwnProperty(colCheckName)) return;
      if (!mapaOrigen.hasOwnProperty(COL_KEY)) return;

      const idxCheck = colCheckName ? mapaOrigen[colCheckName] : -1;
      const idxKey = mapaOrigen[COL_KEY];

      const filasParaCentral = [];
      const filasIndicesParaMarcar = [];

      for (let i = 1; i < values.length; i++) {
        const fila = values[i];
        const checkVal = idxCheck > -1 ? fila[idxCheck] : false; 
        const estaMarcado = checkVal === true || String(checkVal).toUpperCase() === 'TRUE';
        const idVal = fila[idxKey];
        const tieneID = idVal && String(idVal).trim() !== '';

        if (!estaMarcado && tieneID) {
          const filaNueva = [];
          colDestNames.forEach(colName => {
            let valFinal = '';
            
            if (colName === 'Sede_Origen') {
                valFinal = sede.nombre;
            } else if (colName === 'País') {
                valFinal = mapaOrigen.hasOwnProperty('País') ? fila[mapaOrigen['País']] : 'Chile';
            } else if (mapaOrigen.hasOwnProperty(colName)) {
                valFinal = fila[mapaOrigen[colName]];
            }

            if (valFinal !== "" && valFinal !== null) {
                if (colName === 'Creado' || colName === 'Actualizado') {
                    valFinal = formatDateSafe(valFinal, "dd/MM/yyyy HH:mm", timeZone);
                } else if (colName === 'Cumpleaños') {
                    valFinal = formatDateSafe(valFinal, "dd/MM/yyyy", timeZone);
                }
            }

            if (valFinal !== null && valFinal !== undefined && typeof valFinal !== 'string') {
                 valFinal = valFinal.toString();
            }

            filaNueva.push(valFinal);
          });
          filasParaCentral.push(filaNueva);
          filasIndicesParaMarcar.push(i);
        }
      }

      if (filasParaCentral.length > 0) {
        const idxDestKey = colDestNames.indexOf(COL_KEY);
        const colCheckIndex = idxDestKey > -1 ? idxDestKey : 0; 
        const maxRows = sheetDest.getMaxRows();
        const colData = sheetDest.getRange(1, colCheckIndex + 1, maxRows, 1).getValues();
        
        // 1. Encontrar la última fila REAL con datos
        let lastRealRow = 0;
        for (let r = colData.length - 1; r >= 0; r--) {
          if (colData[r][0] && String(colData[r][0]).trim() !== "") {
            lastRealRow = r + 1;
            break;
          }
        }
        
        // CORRECCIÓN CRÍTICA DE INSERCIÓN
        // Si lastRealRow es 0 (hoja vacía), escribimos en fila 1.
        // Si lastRealRow es 5, escribimos en fila 6.
        const insertRow = lastRealRow === 0 ? 1 : lastRealRow + 1;
        
        const rangoDestino = sheetDest.getRange(insertRow, 1, filasParaCentral.length, filasParaCentral[0].length);
        
        rangoDestino.clearDataValidations();
        rangoDestino.setValues(filasParaCentral);

        sheetDest.activate();
        try { 
            aplicarEsquemaValidacion(hojaDestino); 
        } catch(e) {}

        if (idxCheck > -1) {
            const rangeCheck = sheetOrigen.getRange(2, idxCheck + 1, sheetOrigen.getLastRow() - 1, 1);
            const valoresChecks = rangeCheck.getValues();
            filasIndicesParaMarcar.forEach(idx => valoresChecks[idx - 1][0] = true);
            rangeCheck.setValues(valoresChecks);
        }
        
        totalNuevos += filasParaCentral.length;
      }
    } catch (e) { console.error(`Error ${sede.nombre}: ${e.message}`); }
  });
  return totalNuevos;
}

function obtenerSedes(ss) {
  // Aseguramos tener el libro activo si no se pasa como argumento
  const libro = ss || SpreadsheetApp.getActive();
  
  // Usamos el nombre explícito de la hoja
  const sh = libro.getSheetByName('CONFIG_SEDES'); 
  if (!sh) return [];

  const data = sh.getDataRange().getValues();
  const lista = [];

  // Empezamos en i=1 para saltar encabezados
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    
    // MAPEO CORRECTO SEGÚN TU IMAGEN:
    // Col A [0] = Sigla (STGO)
    // Col B [1] = Nombre (Stgo_Univ)
    // Col C [2] = ID (1ygGN...)  <--- ESTE ES EL IMPORTANTE
    // Col D [3] = Estado (ACTIVO)

    const idSheet = fila[2]; 
    const estado = String(fila[3]).toUpperCase().trim();
    const sigla = fila[0];

    // Solo agregamos si tiene ID y está ACTIVO
    if (idSheet && estado === 'ACTIVO') {
      lista.push({ 
        nombre: sigla,  // El sistema usa esto para agrupar (STGO)
        id: idSheet     // El ID real para conectar
      });
    }
  }
  return lista;
}


/* ============================================================
   ⏰ AUTOMATIZACIÓN (POR HORA)
   ============================================================ */
function automataPorHora() {
  const ss = SpreadsheetApp.getActive();
  const timeZone = ss.getSpreadsheetTimeZone(); 
  const sedes = obtenerSedes(ss);
  
  // 1. Inicializamos contadores en 0 para el reporte
  let tDir = 0;
  let tPart = 0;

  if (sedes.length === 0) {
    console.error("Automata: No hay sedes configuradas en la hoja CONFIG.");
    return;
  }

  // BLOQUE 1: DICCIONARIOS
  try {
    console.log("🔄 Automata: Sincronizando Diccionarios...");
    SincronizarDiccionarios(); 
  } catch (e) {
    console.error("❌ Error Automata Dicc:", e.message, e.stack);
    registrarLog("ERROR Automata Dicc", e.message); // Log de error específico
  }

  // BLOQUE 2: DIRECTORIO
  try {
    console.log("👥 Automata: Sincronizando Directorio...");
    // CORRECCIÓN: Capturamos el resultado en la variable tDir
    tDir = procesarFullSync(ss, sedes, ORIGEN_DIR, DESTINO_DIR, timeZone);
  } catch (e) {
    console.error("❌ Error Automata Dir:", e.message, e.stack);
    registrarLog("ERROR Automata Dir", e.message);
  }

  // BLOQUE 3: PARTICIPACIÓN
  try {
    console.log("📅 Automata: Sincronizando Participación...");
    // CORRECCIÓN: Capturamos el resultado en la variable tPart
    tPart = procesarIncremental(ss, sedes, ORIGEN_PART, DESTINO_PART, timeZone);
  } catch (e) {
    console.error("❌ Error Automata Part:", e.message, e.stack);
    registrarLog("ERROR Automata Part", e.message);
  }
  
  // FINAL: Escribimos el resumen en la hoja LOG_CAMBIOS
  registrarLog("Automata Hora", `Resumen: ${tDir} en Directorio | ${tPart} nuevos en Part.`);
  console.log("✅ Ejecución automática completada.");
}

// --- FUNCIÓN AUXILIAR DE FECHAS (CORREGIDA) ---
function formatDateSafe(valor, patron, timeZone) {
  if (!valor) return "";

  // Caso 1: Ya es un objeto fecha real
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, timeZone, patron);
  }

  // Caso 2: Es texto o número que parece fecha
  const texto = valor.toString();
  
  if (texto.length >= 10) {
     const fechaIntento = new Date(valor);
     if (!isNaN(fechaIntento.getTime())) {
        return Utilities.formatDate(fechaIntento, timeZone, patron);
     }
  }

  // Caso 3: No es fecha, devolver tal cual (fallback)
  return valor;
}


// Convierte "dd/MM/yyyy HH:mm" a un número comparable (Timestamp)
function parseFechaStr(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return 0;
  try {
    const [fecha, hora] = fechaStr.trim().split(' ');
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const [hh, mm] = hora ? hora.split(':').map(Number) : [0, 0];
    return new Date(anio, mes - 1, dia, hh, mm).getTime();
  } catch (e) {
    return 0;
  }
}
