/* ==========================================================================
   🏛️ SISTEMA CENTRAL INTEGRADO V5.2: FULL STACK
   ========================================================================== */

// --- CONSTANTES GLOBALES Y CONFIGURACIÓN ---
const SHEET_DICC = 'Diccionario';

// Configuración Enjambre (Diccionarios)
const SHEET_CONFIG_REEMPLAZOS = 'CONFIG_REEMPLAZOS'; 

// ⚠️ RELACIONES (Corregidas: Rol es Padre, Explicación es Hijo)
const RELACIONES = {
  'Direcciones': 'Sigla_Dir', 
  'Universidad': 'Sigla_Uni',
};

// Configuración Directorio (Datos)
const SHEET_CONFIG_SEDES = 'CONFIG_SEDES'; 
const ORIGEN_DIR = 'DIRECTORIO_REGIONAL';
const ORIGEN_PART = 'PARTICIPACIÓN_REGIONAL';
const DESTINO_DIR = 'DIRECTORIO';
const DESTINO_PART = 'PARTICIPACIÓN';
const COL_CHECK_NAME = 'MATRIZ';

const SHEET_LOG = 'LOG_CAMBIOS';

/* ============================================================
   🟢 MENU DE INICIO
   ============================================================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Admin Central')
    .addItem('🔄 Sincronizar DATOS (Híbrido)', 'sincronizarTodoHibrido')
    .addSeparator()
    .addItem('👥 Solo Directorio (Full)', 'sincronizarDirectorioFull')
    .addItem('📅 Solo Participación (Incremental)', 'sincronizarParticipacionInc')
    .addSeparator()
    .addItem('🐝 Sincronizar Diccionarios (Enjambre)', 'SincronizarDiccionarios') 
    .addSeparator()
    .addItem('🛡️ Reglas en Planilla', 'aplicarEsquemaValidacion')
    .addToUi();
}

/* ============================================================
   MÓDULO 1: ENJAMBRE (DICCIONARIOS)
   ============================================================ */

function SincronizarDiccionarios() {
  const ssCentral = SpreadsheetApp.getActive();
  ssCentral.toast("Iniciando escaneo...", "🐝 Enjambre");
  console.time('Sincronización Diccionarios');

  const reglas = cargarReglas(ssCentral);
  let masterData = {};
  
  // 1. Cosecha
  const sedes = obtenerSedes(ssCentral); 
  const listaFuentes = [...sedes, {id: ssCentral.getId(), nombre: 'CENTRAL'}];

  listaFuentes.forEach(fuente => {
    try {
      procesarFuenteDiccionario(fuente, masterData, reglas);
    } catch (e) {
      console.warn(`⚠️ Error leyendo ${fuente.nombre}: ${e.message}`);
    }
  });

  // 2. Construcción de Matriz
  const headersFinales = Object.keys(masterData);
  const matrixObj = construirMatrizOrdenada(headersFinales, masterData);

  // 3. Difusión Rápida
  ssCentral.toast("Escribiendo en sedes...", "🐝 Enjambre");
  
  listaFuentes.forEach(destino => {
    try {
      const ss = SpreadsheetApp.openById(destino.id);
      let sheet = ss.getSheetByName(SHEET_DICC);
      if (!sheet) sheet = ss.insertSheet(SHEET_DICC);
      
      escribirDatosConEstilo(sheet, matrixObj.headers, matrixObj.matrix);
      console.log(`✅ ${destino.nombre} actualizado.`);
    } catch (e) {
      console.error(`❌ Error escribiendo en ${destino.nombre}: ${e.message}`);
    }
  });

  console.timeEnd('Sincronización Diccionarios');
  SpreadsheetApp.flush();
  ssCentral.toast("Sincronización completa y estilizada.", "🐝 Éxito", 5);
}

// --- FUNCIONES INTERNAS DEL ENJAMBRE (ESTAS FALTABAN) ---

function procesarFuenteDiccionario(fuente, masterData, reglas) {
  const ss = SpreadsheetApp.openById(fuente.id);
  const sheet = ss.getSheetByName(SHEET_DICC);
  if (!sheet || sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    headers.forEach((header, colIndex) => {
      // Si es hijo, ignorar (se procesa con el padre)
      if (Object.values(RELACIONES).includes(header)) return;

      if (header === 'Tipo_Actividad') return;

      if (!masterData[header]) masterData[header] = {};

      let valorPadre = String(fila[colIndex]).trim();
      
      // Si no hay padre (llave), saltamos
      if (!valorPadre) return;

      // Aplicar Reglas
      const keyRule = valorPadre.toUpperCase();
      if (reglas[keyRule]) {
        if (reglas[keyRule].accion === 'ELIMINAR') return;
        if (reglas[keyRule].accion === 'REEMPLAZAR') {
          valorPadre = reglas[keyRule].nuevoValor;
        }
      }

      // Buscar Hijo
      let valorHijo = ""; 
      if (RELACIONES[header]) {
        const headerHijo = RELACIONES[header];
        const indexHijo = headers.indexOf(headerHijo);
        if (indexHijo > -1) {
          const valRaw = fila[indexHijo];
          valorHijo = valRaw ? String(valRaw).trim() : ""; 
        }
      }
      masterData[header][valorPadre] = valorHijo;
    });
  }
}

function cargarReglas(ss) {
  const sh = ss.getSheetByName(SHEET_CONFIG_REEMPLAZOS); 
  const map = {};
  if (!sh) return map;
  
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return map;

  const data = sh.getRange(2, 1, lastRow - 1, 3).getValues();
  data.forEach(r => {
    const [origen, destino, accion] = r;
    if (origen) {
      map[String(origen).toUpperCase().trim()] = {
        accion: String(accion).toUpperCase().trim(),
        nuevoValor: String(destino).trim()
      };
    }
  });
  return map;
}

function construirMatrizOrdenada(headers, masterData) {
  let maxRows = 0;
  const columnasOrdenadas = {};

  headers.forEach(h => {
    const entradas = Object.entries(masterData[h]);
    entradas.sort((a, b) => a[0].localeCompare(b[0]));
    columnasOrdenadas[h] = entradas;
    if (entradas.length > maxRows) maxRows = entradas.length;
  });

  const headersOutput = [];
  headers.forEach(h => {
    headersOutput.push(h);
    if (RELACIONES[h]) headersOutput.push(RELACIONES[h]);
  });
  
  const matrix = [];
  for (let r = 0; r < maxRows; r++) {
    const fila = [];
    headers.forEach(h => {
      const par = columnasOrdenadas[h][r];
      fila.push(par ? par[0] : "");
      if (RELACIONES[h]) {
        fila.push(par ? par[1] : "");
      }
    });
    matrix.push(fila);
  }
  return { matrix: matrix, headers: headersOutput };
}

/* ============================================================
   🎨 GESTOR DE ESTILO (OPTIMIZADO)
   ============================================================ */

function escribirDatosConEstilo(sheet, headers, matrix) {
  if (matrix.length === 0) return;

  const totalRows = matrix.length;
  const totalCols = headers.length;

  sheet.clear();

  // 1. HEADER
  const headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setValues([headers])
             .setFontFamily("Playfair Display")
             .setFontSize(11)
             .setFontColor("#ffffff")
             .setBackground("#161233")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID);

  // 2. DATA
  const lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow > totalRows + 1) {
    sheet.getRange(totalRows + 2, 1, lastRow - (totalRows + 1), sheet.getLastColumn()).clearContent().setBackground("white");
  }

  const dataRange = sheet.getRange(2, 1, totalRows, totalCols);
  dataRange.setValues(matrix)
           .setFontFamily("Roboto Mono")
           .setFontSize(10)
           .setFontColor("#000000")
           .setBackground("#ffffff")
           .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID);

  // 3. AJUSTE
  sheet.autoResizeColumns(1, totalCols);
}
