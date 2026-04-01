/* ============================================================
      GESTIÓN DE PLANILLAS SATÉLITES
      CONFIGURACIÓN REGIONAL Y MENÚ
   ============================================================ */

const DIRECCIONES = {
  STGO: '🏙️ Santiago',       // Capital
  IPOH: "🍇 O'Higgins",      // Centro
  IPBB: '🌉 Biobío',         // Centro-Sur
  IPAR: '🌲 Araucanía',      // Sur (NUEVO)
  IPLL: '🌋 Los Lagos',      // Sur
  INTL: '✈️ Internacional',  // Extranjero
  HIST: '🏛️ Histórico'       // Archivo Pasivo (NUEVO)
};

function iniciarMenuRegional() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('⚙️ Funcionalidades');
  const dirActual = PropertiesService.getDocumentProperties().getProperty('DIR');

  // Helper visual para el check (✓)
  const addItem = (codigo, nombre, funcion) => {
    const check = dirActual === codigo ? '✓ ' : '   ';
    menu.addItem(`${check}${nombre}`, funcion);
  };

  // 1. SELECCIÓN DE SEDE (Orden Geográfico)
  addItem('STGO', DIRECCIONES.STGO, 'setRegionSTGO');
  addItem('IPOH', DIRECCIONES.IPOH, 'setRegionIPOH');
  addItem('IPBB', DIRECCIONES.IPBB, 'setRegionIPBB');
  addItem('IPAR', DIRECCIONES.IPAR, 'setRegionIPAR');
  addItem('IPLL', DIRECCIONES.IPLL, 'setRegionIPLL');
  menu.addSeparator();
  addItem('INTL', DIRECCIONES.INTL, 'setRegionINTL');
  addItem('HIST', DIRECCIONES.HIST, 'setRegionHIST');

  // 2. OPERACIONES DIARIAS (Lo que se usa siempre)
  menu.addSeparator();
  menu.addItem('📥 Procesar Pendientes (Sync)', 'procesarPendientesTodo');

  // 3. ADMINISTRACIÓN Y MANTENIMIENTO (Uso esporádico)
  menu.addSeparator();
  menu.addItem('🛡️ Blindar/Reparar Planilla', 'aplicarEsquemaValidacion');
  menu.addItem('🎓 Graduación Anual', 'actualizarRolesPorEgreso');
  
  menu.addToUi();
}

/* --- Lógica interna --- */
function setDireccion(codigo) {
  PropertiesService.getDocumentProperties().setProperty('DIR', codigo);
  SpreadsheetApp.getActive().toast(`Región configurada: ${DIRECCIONES[codigo]}`, 'Configuración');
  iniciarMenuRegional();
}

function getDireccionCodigo() { return PropertiesService.getDocumentProperties().getProperty('DIR') || null; }

/* ============================================================
   CONSTANTES GLOBALES (Pégalo al inicio del archivo)
   ============================================================ */

const CAMPOS_PERFIL = [
  'Nombre',
  'Apellido1',
  'Apellido2',
  'Teléfono',
  'Correo',
  'Sexo',
  'Colegio',
  'Universidad',
  'Organización',
  'Egreso_Col',
  'Egreso_Uni',
  'Carrera',
  'Rol',
  'Comentarios',
  'Dirección',
  'Estado',
  'Cumpleaños',
  'Comuna',
  'País',
  'Instagram',
  'X',
  'Tiktok',
  'RUT',
  'Interesante',
  'SDD',
  'Colectivo'
];


/* ============================================================
   UTILIDADES BÁSICAS (Helpers)
   ============================================================ */

/**
 * Caché de mapas de cabeceras por hoja.
 * Vida: una sola ejecución de script.
 */
const MAP_CACHE = Object.create(null);

/**
 * Devuelve un mapa {NombreColumna: índiceBase1}
 * Usa caché para evitar lecturas repetidas.
 */
function getMap(sheet) {
  if (!sheet) throw new Error('getMap: sheet inválido');

  const sheetName = sheet.getName();
  if (MAP_CACHE[sheetName]) {
    return MAP_CACHE[sheetName];
  }

  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    MAP_CACHE[sheetName] = {};
    return MAP_CACHE[sheetName];
  }

  const headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0];

  const map = Object.create(null);

  headers.forEach((header, i) => {
    if (!header) return;

    const key = header.toString().trim();
    if (map[key]) {
      console.warn(`Columna duplicada ignorada: ${key} (${sheetName})`);
      return;
    }
    map[key] = i + 1; // Base 1
  });

  MAP_CACHE[sheetName] = map;
  return map;
}

/**
 * Normaliza texto para comparaciones:
 * - Sin acentos
 * - Sin espacios extremos
 * - En mayúsculas
 */
function norm(value) {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Genera un string aleatorio alfanumérico en mayúsculas.
 */
function generarRandom(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

/**
 * Genera ID único basado en:
 * Primer nombre + Apellido1 + Apellido2 (opcional) + Random
 */
function generarID(nombre, apellido1, apellido2) {
  const n = norm(nombre).split(/\s+/)[0] || 'X';
  const a1 = norm(apellido1).split(/\s+/)[0] || 'X';
  const a2 = norm(apellido2).split(/\s+/)[0] || '';

  return [n, a1, a2, generarRandom(4)]
    .filter(Boolean)
    .join('_');
}

/**
 * Logger defensivo de errores.
 */
function logError(contexto, error) {
  try {
    const mensaje = error && error.message ? error.message : String(error);
    console.error(`[${contexto}] ${mensaje}`, error);
  } catch (_) {
    console.error(`[${contexto}] Error no serializable`);
  }
}


/* ============================================================
   DISPATCHER onEdit (Controlador Central)
   ============================================================ */

/**
 * Punto único de entrada para ediciones regionales.
 * Controla concurrencia y enruta según hoja.
 */
function procesarEdicionRegional(e) {
  if (!e || !e.range || !e.source) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(200)) return;

  try {
    const ss = e.source;
    const range = e.range;
    const sh = range.getSheet();
    const sheetName = sh.getName();

    const rowStart = range.getRow();
    const colStart = range.getColumn();

    // Ignoramos cabeceras
    if (rowStart < 2) return;

    garantizarSistemaLogs(ss);

    if (sheetName === 'PARTICIPACIÓN_REGIONAL') {
      manejarEdicionParticipacion(e, ss, sh, rowStart, colStart);
      return;
    }

    if (sheetName === 'DIRECTORIO_REGIONAL') {
      manejarEdicionDirectorio(e, ss, sh, rowStart, colStart);
      return;
    }

  } catch (err) {
    logError('procesarEdicionRegional', err);
  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
   MANEJO PARTICIPACIÓN (INTELIGENTE / AUTO-MASIVO)
   ============================================================ */

function manejarEdicionParticipacion(e, ss, sh, rowStart, colStart) {
  const map = getMap(sh);

  const colID = map['ID_IP'];
  const colNombre = map['Nombre'];
  // 1. AGREGADO: Mapeamos Correo y Teléfono para detectar cambios en ellos
  const colCorreo = map['Correo'];
  const colTel = map['Teléfono'];

  // Validación defensiva mínima
  if (!colID || !colNombre) {
    console.warn('Participación: columnas obligatorias no encontradas');
    return;
  }

  const range = e.range;
  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();
  const colEnd = colStart + numCols - 1;

  /* ------------------------------------------------------------
     CASO 1: PEGADO MASIVO (Detectamos Nombre, ID, Correo o Teléfono)
     ------------------------------------------------------------ */
  if (numRows > 1) {
    const tocaNombre = colNombre >= colStart && colNombre <= colEnd;
    const tocaID = colID >= colStart && colID <= colEnd;
    // 2. AGREGADO: Verificamos si el rango editado toca Correo o Teléfono
    const tocaCorreo = colCorreo && (colCorreo >= colStart && colCorreo <= colEnd);
    const tocaTel = colTel && (colTel >= colStart && colTel <= colEnd);

    if (tocaNombre || tocaID || tocaCorreo || tocaTel) {
      ss.toast(
        '⚡ Detectado pegado masivo. Generando dropdowns…',
        'Procesando',
        -1
      );

      inyectarDropdownsEnRango(sh, rowStart, numRows);

      ss.toast(
        `✅ Listos ${numRows} registros nuevos.`,
        'Finalizado',
        3
      );
    }
    return; // No seguimos con lógica individual
  }

  /* ------------------------------------------------------------
     CASO 2: EDICIÓN INDIVIDUAL
     ------------------------------------------------------------ */
  const currentRow = rowStart;
  const tocaID = colID >= colStart && colID <= colEnd;

  // A. Selección manual de ID (Mantenemos esto para procesar la selección final)
  if (tocaID) {
    const valorID = sh.getRange(currentRow, colID).getValue();
    if (valorID) {
      manejarSeleccionID(
        { value: valorID },
        ss,
        sh,
        currentRow,
        colID,
        'PARTICIPACIÓN_REGIONAL'
      );
    }
  }

  // 3. ELIMINADO: Se quitó el bloque "B. Escritura manual del nombre"
  // para evitar lentitud y cumplir con el requisito de no inyectar onEdit por nombre.
}


/* ============================================================
   INYECTOR DE DROPDOWNS (POR RANGO)
   ============================================================ */

function inyectarDropdownsEnRango(sh, startRow, numRows) {
  const map = getMap(sh);
  const colID = map['ID_IP'];
  const colNombre = map['Nombre'];
  const colApe1 = map['Apellido1'];
  
  // 1. MAPEADO DE COLUMNAS (Se agrega RUT)
  const colApe2 = map['Apellido2'] || null;
  const colCorreo = map['Correo'] || null;
  const colTel = map['Teléfono'] || null;
  const colRut = map['RUT'] || null; // <--- NUEVO: Mapeo de columna RUT [cite: 13, 101, 271]

  // CARGA ÚNICA
  const dataCentralLigera = obtenerDataCentralLigera(); 
  
  const values = sh.getRange(startRow, 1, numRows, sh.getLastColumn()).getValues();
  const validations = sh.getRange(startRow, colID, numRows, 1).getDataValidations();

  let huboCambios = false;

  // 2. PROCESAMIENTO INSTANTÁNEO
  for (let i = 0; i < numRows; i++) {
    const fila = values[i];
    const idActual = fila[colID - 1];

    if (idActual) continue;

    // 2. EXTRACCIÓN DE DATOS (Se agrega rut)
    const nombre = fila[colNombre - 1];
    const ape1 = colApe1 ? fila[colApe1 - 1] : '';
    const ape2 = colApe2 ? fila[colApe2 - 1] : '';
    const mail = colCorreo ? fila[colCorreo - 1] : '';
    const tel = colTel ? fila[colTel - 1] : '';
    const rut = colRut ? fila[colRut - 1] : ''; // <--- NUEVO: Extracción de valor RUT [cite: 101, 215]

    // 3. VALIDACIÓN FLEXIBLE
    // Agregamos rut a la condición de búsqueda [cite: 102, 216]
    if (!nombre && !mail && !tel && !rut) continue;

    // 4. LLAMADA ACTUALIZADA (Ahora con 7 argumentos incluyendo el RUT)
    const opciones = obtenerCandidatosOptimizado(
        nombre, 
        ape1, 
        ape2, 
        mail, 
        tel, 
        rut, // <--- NUEVO: Argumento 6 (RUT) 
        dataCentralLigera // <--- Pasa a ser el Argumento 7 [cite: 103]
    );

    validations[i][0] = SpreadsheetApp.newDataValidation()
      .requireValueInList(opciones, true)
      .setAllowInvalid(false)
      .build();

    huboCambios = true;
  }

  // 3. ESCRITURA ÚNICA
  if (huboCambios) {
    sh.getRange(startRow, colID, numRows, 1).setDataValidations(validations);
    sh.getRange(startRow, colID, numRows, 1).setBackground('#FFF2CC');
  }
}


/* ============================================================
   MANEJO DIRECTORIO (MULTI-FILA / OPTIMIZADO)
   ============================================================ */

function manejarEdicionDirectorio(e, ss, sh, rowStart, colStart) {
  const map = getMap(sh);
  const colID = map['ID_IP'];

  if (!colID) {
    console.warn('Directorio: columna ID_IP no encontrada');
    return;
  }

  const range = e.range;
  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();
  const colEnd = colStart + numCols - 1;

  // 1. CARGA DE DATOS (Optimizada)
  const values = range.getValues(); // Matriz de valores NUEVOS
  
  // IDs actuales en la hoja (Post-edición)
  const idsFila = sh.getRange(rowStart, colID, numRows, 1).getValues();

  // Headers (Limitados al rango de datos para evitar arrays gigantes vacíos)
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  // Detección de topología del cambio
  const indiceRelativoID = colID - colStart;
  const tocaID = colID >= colStart && colID <= colEnd;
  
  // VERIFICACIÓN CRÍTICA: ¿Es una edición puntual reversible?
  // Solo si es 1 fila y 1 columna, podemos confiar en e.oldValue
  const esEdicionUnica = (numRows === 1 && numCols === 1);

  // 2. PROCESAMIENTO
  for (let i = 0; i < numRows; i++) {
    const currentRow = rowStart + i;
    
    // Sanitización: Evitamos 'undefined' o 'null', forzamos string para el ID
    const rawID = idsFila[i][0];
    const idDeLaFila = rawID == null ? "" : String(rawID); 

    /* --------------------------------------------------------
       CASO 1: CAMBIO EN LA COLUMNA ID (Estructural)
       -------------------------------------------------------- */
    if (tocaID) {
      const nuevoID = values[i][indiceRelativoID];
      
      // Si hay un ID nuevo, procesamos la lógica de negocio
      if (nuevoID) {
        manejarSeleccionID(
          { value: nuevoID }, ss, sh, currentRow, colID, 'DIRECTORIO_REGIONAL'
        );
      } 
      // CRÍTICO: Si borraron el ID (nuevoID es vacío), deberíamos loguearlo o alertar.
      // Por ahora, permitimos que continúe para registrar el cambio vacío en el log abajo.

      // Si solo se tocó el ID, saltamos al siguiente ciclo
      if (numCols === 1) continue; 
    }

    /* --------------------------------------------------------
       CASO 2: LOGGING DE CAMPOS (Auditoría)
       -------------------------------------------------------- */
    // Si no hay ID, asignamos un identificador de contingencia para no perder la traza
    const idLog = idDeLaFila === "" ? "ID_DESCONOCIDO/BORRADO" : idDeLaFila;

    for (let j = 0; j < numCols; j++) {
      const currentCol = colStart + j;

      // Saltamos la columna ID porque ya se manejó arriba (o es estructural)
      if (currentCol === colID) continue;
      
      // Protección contra edición fuera de los headers definidos
      if (currentCol > lastCol) continue;

      const nombreCampo = headers[currentCol - 1];
      if (!nombreCampo) continue;

      const valorNuevo = values[i][j];
      
      // RECUPERACIÓN INTELIGENTE DE DATOS
      let valorAntiguo;
      let tipoCambio;

      if (esEdicionUnica) {
        // Precisión Quirúrgica: Tenemos el dato real
        valorAntiguo = e.oldValue === undefined ? "" : e.oldValue;
        tipoCambio = 'MANUAL_INDIVIDUAL';
        
        // FILTRO DE RUIDO: Si el usuario entró a la celda y salió sin cambiar nada
        if (String(valorAntiguo) === String(valorNuevo)) continue;
        
      } else {
        // Aproximación por Lote: No tenemos historia
        valorAntiguo = '(Lote/Carga Masiva)';
        tipoCambio = 'MANUAL_LOTE';
      }

      registrarCambio(
        ss,
        tipoCambio,  // Diferencia entre edición hormiga y carga masiva
        idLog,       // Registra incluso si el ID se borró
        nombreCampo,
        valorAntiguo,
        valorNuevo
      );
    }
  }
}


/* ============================================================
   MANEJO DE SELECCIÓN DE ID (NATIVO VS FORÁNEO)
   ============================================================ */

function manejarSeleccionID(e, ss, sh, row, col, fuente) {
  try {
    let valor = e && e.value ? e.value : null;
    if (!valor && e && e.range) {
      valor = e.range.getValue();
    }
    if (!valor) return;

    valor = valor.toString();

    // 1. OBTENER MAPA AL INICIO (Para usarlo en todos los casos)
    const map = getMap(sh);
    const colCreado = map['Creado']; // Identificamos columna fecha

    /* --------------------------------------------------------
       CASO 1: SELECCIÓN DESDE DROPDOWN (Ej: "Juan [ID...]")
       -------------------------------------------------------- */
    const matchID = valor.match(/\[([A-Z0-9_\-]+)\]$/);
    if (matchID) {
      const idReal = matchID[1];
      const miSede = getDireccionCodigo();

      const matchSede = valor.match(/\[📍\s*([^\]]+)\]/);
      const sedeOrigen = matchSede ? matchSede[1] : '';
      const esNativo = miSede && sedeOrigen.includes(miSede);

      const color = esNativo ? '#CFE2F3' : '#D9D2E9';

      const cell = sh.getRange(row, col);
      cell
        .clearDataValidations()
        .setValue(idReal)
        .setBackground(color);

      if (map['Dirección']) {
        sh.getRange(row, map['Dirección']).setValue(miSede);
      }

      // --- CORRECCIÓN: ESTAMPAR FECHA EN CASO 1 ---
      if (colCreado) {
        const celdaCreado = sh.getRange(row, colCreado);
        if (!celdaCreado.getValue()) {
           celdaCreado.setValue(new Date());
        }
      }
      
      return;
    }

    /* --------------------------------------------------------
       CASO 2: CREAR NUEVO
       -------------------------------------------------------- */
    if (valor.includes('CREAR NUEVO')) {
      const nombre = sh.getRange(row, map['Nombre']).getValue();
      const ape1 = sh.getRange(row, map['Apellido1']).getValue();
      const ape2 = map['Apellido2']
        ? sh.getRange(row, map['Apellido2']).getValue()
        : '';

      const nuevoID = generarID(nombre, ape1, ape2);
      const miSede = getDireccionCodigo();

      sh.getRange(row, col)
        .clearDataValidations()
        .setValue(nuevoID)
        .setBackground('#CFE2F3');

      if (map['Dirección']) {
        sh.getRange(row, map['Dirección']).setValue(miSede);
      }

      // --- CORRECCIÓN: ESTAMPAR FECHA EN CASO 2 ---
      if (colCreado) {
        const celdaCreado = sh.getRange(row, colCreado);
        if (!celdaCreado.getValue()) {
           celdaCreado.setValue(new Date());
        }
      }
    }

  } catch (err) {
    logError('manejarSeleccionID', err);
  }
}


/* ============================================================
   PROCESADOR HÍBRIDO (AZUL + MORADO) – BLINDADO
   ============================================================ */

function procesarPendientesTodo() {
  const ss = SpreadsheetApp.getActive();
  const regionActual = getDireccionCodigo();

  if (!regionActual) {
    SpreadsheetApp.getUi().alert('⛔ Error: No se detecta la región.');
    return;
  }

  const shPart = ss.getSheetByName('PARTICIPACIÓN_REGIONAL');
  const shDir  = ss.getSheetByName('DIRECTORIO_REGIONAL');
  if (!shPart || !shDir) return;

  ss.toast('⏳ Escaneando...', 'Iniciando', -1);

  const mapPart = getMap(shPart);
  if (!mapPart['ID_IP']) return;

  const dataPart = shPart.getDataRange().getValues();
  const lastRowIdx = dataPart.length - 1;
  const bgColors = shPart.getRange(1, mapPart['ID_IP'], dataPart.length, 1).getBackgrounds();

  const idxId = mapPart['ID_IP'] - 1;
  const idxNom = mapPart['Nombre'] - 1;
  const idxApe1 = mapPart['Apellido1'] - 1;

  const batchAzul   = [];
  const batchMorado = [];
  const filasVerdes = [];
  let inyeccionesNuevas = 0;
  
  // Regla de parada: si encontramos 15 filas verdes seguidas, dejamos de subir.
  let filasYaProcesadasSeguidas = 0;
  const LIMITE_PARADA = 15;

  const normColor = c => (c || '').toString().toUpperCase();

  // --- BUCLE BOTTOM-UP (Eficiencia Máxima) ---
  for (let i = lastRowIdx; i >= 1; i--) {
    const row = i + 1;
    const idVal = String(dataPart[i][idxId] || '').trim();
    const nombreVal = String(dataPart[i][idxNom] || '').trim();
    const ape1Val = String(dataPart[i][idxApe1] || '').trim();
    const color = normColor(bgColors[i][0]);

    // A. Inyección de Dropdowns (Si tiene Nombre + Apellido1 y está vacío)
    if (!idVal && nombreVal !== "" && ape1Val !== "") {
      inyectarDropdownsEnRango(shPart, row, 1);
      inyeccionesNuevas++;
      filasYaProcesadasSeguidas = 0;
      continue;
    }

    // B. Clasificación para Sincronización
    if (idVal && !idVal.includes('CREAR') && (color === '#CFE2F3' || color === '#D9D2E9')) {
      const dataObj = { ID_IP: idVal, _row: row };
      CAMPOS_PERFIL.forEach(k => {
        if (mapPart[k]) dataObj[k] = dataPart[i][mapPart[k] - 1];
      });

      if (color === '#CFE2F3') batchAzul.push(dataObj);
      else batchMorado.push(dataObj);
      
      filasYaProcesadasSeguidas = 0;
      continue;
    }

    // C. Control de parada (Si ya está verde)
    if (color === '#D9EAD3') {
      filasYaProcesadasSeguidas++;
      if (filasYaProcesadasSeguidas >= LIMITE_PARADA) break; 
    }
  }

  if (inyeccionesNuevas > 0) ss.toast(`✨ Preparados ${inyeccionesNuevas} dropdowns.`, 'Éxito');

  if (batchAzul.length === 0 && batchMorado.length === 0) {
    if (inyeccionesNuevas === 0) ss.toast('Nada pendiente.', 'Fin');
    return;
  }

  /* --- GESTIÓN DE VALIDACIONES --- */
  let reglasGuardadas = [];
  try {
    const maxCols = shDir.getLastColumn();
    reglasGuardadas = shDir.getRange(2, 1, 1, maxCols).getDataValidations()[0];
    const maxRows = shDir.getMaxRows();
    if (maxRows > 1) shDir.getRange(2, 1, maxRows - 1, maxCols).clearDataValidations();
  } catch (e) { console.warn("Validaciones:", e); }

  /* --- PROCESAMIENTO AZUL (LOCAL) --- */
  if (batchAzul.length) {
    batchAzul.forEach(d => { 
      delete d['WhatsApp']; // No importar WhatsApp
      d['Dirección_Origen'] = regionActual; // Origen local
    });
    actualizarDirectorioLocal(ss, shDir, batchAzul);
    batchAzul.forEach(d => filasVerdes.push(d._row));
    }

    /* --- PROCESAMIENTO MORADO (CENTRAL) --- */
    if (batchMorado.length) {
    try {
      const ID_CENTRAL = '1uPMMLlhEhlr57cKkeezvK3KfhCmUCrZ7druHUm8IT2A';
      const ssC = SpreadsheetApp.openById(ID_CENTRAL);
      const shC = ssC.getSheetByName('DIRECTORIO');
      const dataC = shC.getDataRange().getValues();
      const mapC = getMap(shC);
      const idxIdC = mapC['ID_IP'] - 1;

      const cIndex = new Map();
      for (let r = 1; r < dataC.length; r++) {
        const cid = String(dataC[r][idxIdC] || '').trim();
        if (cid) cIndex.set(cid, dataC[r]);
      }

      batchMorado.forEach(item => {
        const rowC = cIndex.get(item.ID_IP);
        if (!rowC) return;

        delete item['WhatsApp']; // No importar WhatsApp

        // PERFIL
        CAMPOS_PERFIL.forEach(c => {
          if (c === 'WhatsApp') return;
          if ((!item[c] || item[c] === '') && mapC[c]) {
            item[c] = rowC[mapC[c] - 1];
          }
        });

        // Dirección origen (fuera de perfil)
        if (mapC['Dirección_Origen']) {
          item['Dirección_Origen'] = rowC[mapC['Dirección_Origen'] - 1];
        }

        // FECHAS HISTÓRICAS (CLAVE)
        if (mapC['Creado']) {
          item['Creado'] = rowC[mapC['Creado'] - 1];
        }
        if (mapC['Actualizado']) {
          item['Actualizado'] = rowC[mapC['Actualizado'] - 1];
        }
      });


      actualizarDirectorioLocal(ss, shDir, batchMorado);
      batchMorado.forEach(d => filasVerdes.push(d._row));
    } catch (e) { console.error(e); }
    }

    /* --- RESTAURAR Y CERRAR --- */
    if (reglasGuardadas.length > 0) {
      const mRows = shDir.getMaxRows();
      reglasGuardadas.forEach((regla, ci) => {
        if (regla) shDir.getRange(2, ci + 1, mRows - 1, 1).setDataValidation(regla);
      });
    }

  if (filasVerdes.length) {
    filasVerdes.forEach(r => shPart.getRange(r, mapPart['ID_IP']).setBackground('#D9EAD3'));
    ss.toast(`✅ Sincronizados: ${filasVerdes.length} registros.`, 'Finalizado');
  }
}


/**
 * Helper interno para guardar en el Directorio Local
 * OPTIMIZADO + BLINDADO
 */
function actualizarDirectorioLocal(ss, shDir, datos) {
  const mapDir = getMap(shDir);
  if (!mapDir['ID_IP']) return;

  const maxCol = shDir.getLastColumn();
  const dataDir = shDir.getDataRange().getValues();
  const idxId = mapDir['ID_IP'] - 1;

  const idToRow = new Map();
  const rowsToUpdate = [];
  const newRows = [];

  let lastRealRow = 1;

  for (let i = 1; i < dataDir.length; i++) {
    const id = String(dataDir[i][idxId] || '').trim();
    if (id) {
      idToRow.set(id, i);
      lastRealRow = i + 1;
    }
  }

  const COLUMNAS_ACUMULATIVAS = ['Interesante', 'SDD', 'Colectivo'];

  datos.forEach(dato => {
    const id = dato.ID_IP;
    if (!id) return;

    if (idToRow.has(id)) {
      /* ---------------- UPDATE ---------------- */
      const rowIdx = idToRow.get(id);
      const rowCopy = [...dataDir[rowIdx]];

      Object.keys(dato).forEach(k => {
        if (k === '_row' || !mapDir[k]) return;

        const nuevo = dato[k];
        const col = mapDir[k] - 1;
        const actual = rowCopy[col];

        if (k === 'WhatsApp') {
          if (!nuevo) return;
          const lista = String(actual || '').split(',').map(x => x.trim()).filter(Boolean);
          const n = String(nuevo).trim();
          if (n && !lista.includes(n)) rowCopy[col] = lista.concat(n).join(', ');
          return;
        }

        if (COLUMNAS_ACUMULATIVAS.includes(k) && esVerdaderoUniversal(actual)) return;

        if (nuevo !== '' && nuevo !== null && nuevo !== undefined) {
          rowCopy[col] = nuevo;
        }
      });

      // Actualizado es local
      if (mapDir['Actualizado']) rowCopy[mapDir['Actualizado'] - 1] = new Date();
      rowsToUpdate.push({ row: rowIdx + 1, values: rowCopy });

    } else {
      /* ---------------- CREATE ---------------- */
      const newRow = new Array(maxCol).fill('');

      Object.keys(dato).forEach(k => {
        if (k !== '_row' && mapDir[k]) newRow[mapDir[k] - 1] = dato[k];
      });

      const now = new Date();

      // Creado: si viene, se respeta; si no, nace ahora.
      if (mapDir['Creado']) {
        newRow[mapDir['Creado'] - 1] = dato['Creado'] ? dato['Creado'] : now;
      }

      // Actualizado siempre nace con now
      if (mapDir['Actualizado']) {
        newRow[mapDir['Actualizado'] - 1] = now;
      }

      newRows.push(newRow);
    }
  });

  /* ---------------- ESCRITURA ---------------- */
  rowsToUpdate.forEach(u => shDir.getRange(u.row, 1, 1, maxCol).setValues([u.values]));

  if (newRows.length) {
    const filaInicio = lastRealRow + 1;
    shDir.getRange(filaInicio, 1, newRows.length, maxCol).setValues(newRows);
  }
}



/* ==========================================================
   SISTEMA DE LOGS
   ========================================================== */

function garantizarSistemaLogs(ss) {
  const nombreHoja = 'LOG_CAMBIOS';
  let l = ss.getSheetByName(nombreHoja);
  
  if (!l) {
    l = ss.insertSheet(nombreHoja);
    const headers = ['Timestamp', 'Usuario', 'Tipo', 'ID_Afectado', 'Campo_Modificado', 'Valor_Anterior', 'Valor_Nuevo'];
    
    l.appendRow(headers);
    l.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#EFEFEF')
      .setBorder(true, true, true, true, null, null);
    l.setFrozenRows(1);
    
    // Opcional: Ocultar líneas de cuadrícula para limpieza visual
    l.setHiddenGridlines(true);
  }
}

function registrarCambio(ss, tipo, id, campo, ant, nue) {
  try {
    const log = ss.getSheetByName('LOG_CAMBIOS');
    if (!log) return; 

    // 1. Identidad (Intento de capturar usuario)
    let usuario = 'System/Anónimo';
    try {
      const email = Session.getActiveUser().getEmail();
      if (email) usuario = email;
    } catch (_) {}

    // 2. Sanitización (Evita errores de tipos de datos)
    const formatValue = (val) => {
      if (val === null || val === undefined) return '';
      // Si es fecha, formatear para que no salga texto gigante
      if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
      return String(val);
    };

    const safeAnt = formatValue(ant);
    const safeNue = formatValue(nue);

    // 3. Filtro de redundancia (Si A == B, no gastamos fila)
    // Excepción: Si es 'CREACION' siempre registramos, aunque sea vacío
    if (!tipo.startsWith('CREACION') && safeAnt === safeNue) return;

    // 4. ESCRITURA ATÓMICA (La clave de la integración)
    // appendRow pone el cambio en cola y garantiza que no se sobrescriba
    // aunque el bucle del directorio vaya muy rápido.
    log.appendRow([
      new Date(),
      usuario,
      tipo,
      id,
      campo,
      safeAnt,
      safeNue
    ]);

  } catch (e) {
    console.error(`Fallo en Log [${id}]: ${e.message}`);
  }
}


function crearLoteEnDirectorio(ss, listaDatos) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const dir = ss.getSheetByName('DIRECTORIO_REGIONAL');
    if (!dir) throw new Error('DIRECTORIO_REGIONAL no encontrado');

    const mapDir = getMap(dir);
    if (!mapDir['ID_IP']) throw new Error('DIRECTORIO sin ID_IP');

    const maxCol = dir.getLastColumn();
    const now = new Date();
    const dirCode = getDireccionCodigo();

    // Detectar última fila real por ID
    const data = dir.getRange(2, mapDir['ID_IP'], dir.getLastRow(), 1).getValues();
    let startRow = 2;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][0]) {
        startRow = i + 3;
        break;
      }
    }

    const matriz = listaDatos.map(dato => {
      const fila = new Array(maxCol).fill('');

      Object.keys(dato).forEach(k => {
        if (mapDir[k]) fila[mapDir[k] - 1] = dato[k];
      });

      if (mapDir['Creado']) fila[mapDir['Creado'] - 1] = now;
      if (mapDir['Actualizado']) fila[mapDir['Actualizado'] - 1] = now;
      if (dirCode && mapDir['Dirección']) fila[mapDir['Dirección'] - 1] = dirCode;
      if (dirCode && mapDir['Dirección_Origen']) fila[mapDir['Dirección_Origen'] - 1] = dirCode;

      return fila;
    });

    if (matriz.length) {
      dir.getRange(startRow, 1, matriz.length, maxCol).setValues(matriz);
      registrarCambio(
        ss,
        'CREACION_MASIVA',
        'LOTE',
        'ALL',
        '',
        `Se crearon ${matriz.length} registros`
      );
    }

  } catch (e) {
    console.error(e);
    ss.toast('Error en carga masiva: ' + e.message);

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
   GENERADOR DE CANDIDATOS (Punto Medio: Tokenización)
   ============================================================ */
function obtenerCandidatosOptimizado(nInput, a1Input, a2Input, mailInput, telInput, rutInput, dataLigera) {
  if (!dataLigera || !dataLigera.length) return ['>>> CREAR NUEVO <<<'];
  const opciones = [];
  
  // 1. Pre-procesamiento y Normalización del RUT de entrada
  const rIn = rutInput ? String(rutInput).replace(/[^0-9kK]/g, '').toUpperCase() : '';
  const nIn = norm(nInput);
  const a1In = norm(a1Input);
  const a2In = norm(a2Input);
  const mIn = mailInput ? String(mailInput).trim().toLowerCase() : '';
  const tIn = telInput ? String(telInput).replace(/\D/g, '') : '';
  
  // Umbrales de activación de búsqueda
  const buscarRut = rIn.length > 7; 
  const buscarTel = tIn.length > 5;
  const buscarMail = mIn.length > 3;
  const buscarNombre = a1In.length > 1;

  for (let i = 0; i < dataLigera.length; i++) {
    const row = dataLigera[i]; 
    // Índices esperados: [0:Nom, 1:Ape1, 2:Ape2, 3:ID, 4:Sede, 5:Mail, 6:Tel, 7:RUT]
    let esCandidato = false;

    // --- PRIORIDAD 0: RUT (EL MATCH MÁS FUERTE) ---
    if (buscarRut) {
       // Normalizamos el RUT de la base de datos en tiempo real para la comparación
       const rDb = row[7] ? String(row[7]).replace(/[^0-9kK]/g, '').toUpperCase() : '';
       if (rDb && rDb === rIn) {
         esCandidato = true;
       }
    }

    // --- PRIORIDAD 1: TELÉFONO (Filtro secundario si RUT no matcheó) ---
    if (!esCandidato && buscarTel) {
       const tDb = row[6] ? String(row[6]).replace(/\D/g, '') : '';
       if (tDb && tDb.includes(tIn)) esCandidato = true;
    }

    // --- PRIORIDAD 2: MAIL ---
    if (!esCandidato && buscarMail) {
       const mDb = row[5] ? String(row[5]).trim().toLowerCase() : '';
       if (mDb && mDb.includes(mIn)) esCandidato = true;
    }

    // --- PRIORIDAD 3: NOMBRE ---
    if (!esCandidato && buscarNombre) {
       const a1Db = norm(row[1]);
       if (a1Db.startsWith(a1In)) {
          const nDb = norm(row[0]);
          if (nDb.startsWith(nIn) || (nIn === '' && a1In.length > 2)) {
             if (!a2In || (row[2] && norm(row[2]).startsWith(a2In))) {
               esCandidato = true;
             }
          }
       }
    }

    // Construcción de la opción para el dropdown si hubo coincidencia
    if (esCandidato) {
      const mailTxt = row[5] ? ` (${row[5]})` : '';
      const ape2Txt = row[2] ? ` ${row[2]}` : '';
      const sedeTxt = row[4] ? ` [📍${row[4]}]` : '';
      opciones.push(`${row[0]} ${row[1]}${ape2Txt}${mailTxt}${sedeTxt} [${row[3]}]`);
    }

    // Limitar resultados para mantener la fluidez de la interfaz
    if (opciones.length >= 50) break;
  }
  
  opciones.push('>>> CREAR NUEVO <<<');
  return opciones;
}


function obtenerDataCentralLigera() {
  const cache = CacheService.getScriptCache();
  // Se cambia a V3 para invalidar memorias que no contienen la columna RUT
  const CACHE_KEY = 'DIRECTORIO_LIGERO_V3'; 

  // 1. Caché de ejecución (RAM inmediata)
  if (this.dataMemoria) return this.dataMemoria;

  // 2. Caché de Script (Persistente 15 min)
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    try {
      this.dataMemoria = JSON.parse(cached);
      return this.dataMemoria;
    } catch (_) { cache.remove(CACHE_KEY); }
  }

  try {
    const ID_CENTRAL = '1uPMMLlhEhlr57cKkeezvK3KfhCmUCrZ7druHUm8IT2A';
    const ssCentral = SpreadsheetApp.openById(ID_CENTRAL);
    const shCentral = ssCentral.getSheetByName('DIRECTORIO');
    const data = shCentral.getDataRange().getValues(); 
    const map = getMap(shCentral);

    const idx = {
      nom: map['Nombre'] - 1,
      a1: map['Apellido1'] - 1,
      a2: map['Apellido2'] ? map['Apellido2'] - 1 : -1,
      id: map['ID_IP'] - 1,
      sede: map['Sede_Origen'] ? map['Sede_Origen'] - 1 : -1,
      mail: map['Correo'] ? map['Correo'] - 1 : -1,
      tel: map['Teléfono'] ? map['Teléfono'] - 1 : -1,
      rut: map['RUT'] ? map['RUT'] - 1 : -1 
    };

    const ligera = [];
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (!r[idx.id]) continue;
      
      ligera.push([
        r[idx.nom],                   // 0
        r[idx.a1],                    // 1
        idx.a2 > -1 ? r[idx.a2] : '', // 2
        r[idx.id],                    // 3
        idx.sede > -1 ? r[idx.sede] : '', // 4
        idx.mail > -1 ? r[idx.mail] : '', // 5
        idx.tel > -1 ? r[idx.tel] : '',   // 6
        idx.rut > -1 ? r[idx.rut] : ''    // 7
      ]);
    }

    this.dataMemoria = ligera;

    const jsonLigera = JSON.stringify(ligera);
    // Límite de 100kb para CacheService
    if (jsonLigera.length < 100000) {
      cache.put(CACHE_KEY, jsonLigera, 900);
    }

    return ligera;
  } catch (e) {
    console.error(`❌ Error crítico leyendo central: ${e.message}`, e.stack);
    return [];
  }
}


/**
 * Helper para detectar Verdadero en cualquier idioma o formato.
 */
function esVerdaderoUniversal(valor) {
  if (valor === true || valor === 1) return true;
  if (!valor) return false;
  const s = String(valor).trim().toUpperCase();
  return s === 'TRUE' || s === 'VERDADERO' || s === 'YES' || s === 'SI';
}
