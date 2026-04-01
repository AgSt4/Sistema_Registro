/**
 * RUTINA DE MONITOREO NOCTURNO (APP FLOTANTE - STANDALONE)
 * Versión con autolimpieza de alertas y manejo de cuotas.
 */
const ID_REGISTRO_CENTRAL = '1uPMMLlhEhlr57cKkeezvK3KfhCmUCrZ7druHUm8IT2A'; 

function marcarFaltantesNocturno() {
  Logger.log('=== INICIANDO AUDITORÍA GLOBAL DE SEDES (DINÁMICA) ===');

  try {
    // 1. Conexión al Central (Igual que en tu ejemplo)
    const ssCentral = SpreadsheetApp.openById(ID_REGISTRO_CENTRAL);
    const sheetConfig = ssCentral.getSheetByName('CONFIG_SEDES');
    
    // 2. Obtener toda la tabla de sedes
    // Asumimos según tu código anterior: Col A = SEDE, Col C = ID
    const data = sheetConfig.getDataRange().getValues();

    // 3. Recorremos la tabla (Saltando la fila 0 de encabezados)
    for (let i = 1; i < data.length; i++) {
      
      const sede = String(data[i][0]).trim(); // Columna A (Nombre Sede)
      const id = String(data[i][2]).trim();   // Columna C (ID Spreadsheet)

      // Validación: Si la fila está vacía o falta ID, la saltamos
      if (!id || !sede) continue;

      // 4. Ejecutamos la revisión para esa sede encontrada
      try {
        Logger.log(`>> Procesando: ${sede}`);
        ejecutarRevisionVisual(id, sede); 
      } catch (e) {
        Logger.log(`[CRITICAL] Error procesando sede ${sede}: ${e.toString()}`);
      }
    }

  } catch (e) {
    Logger.log("❌ Error fatal conectando con Registro Central: " + e.message);
  }

  Logger.log('=== AUDITORÍA FINALIZADA ===');
}

function ejecutarRevisionVisual(spreadsheetId, sedeNombre) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const shPart = ss.getSheetByName('PARTICIPACIÓN_REGIONAL');
  const shDir  = ss.getSheetByName('DIRECTORIO_REGIONAL');

  if (!shPart || !shDir) {
    throw new Error(`Hojas no encontradas en sede ${sedeNombre}.`);
  }

  const mapPart = getMap(shPart);
  const mapDir  = getMap(shDir);
  const colID_Part = mapPart['ID_IP'];
  const colID_Dir  = mapDir['ID_IP'];

  if (!colID_Part || !colID_Dir) {
    throw new Error('Columna ID_IP no definida.');
  }

  const dataPart = shPart.getDataRange().getValues();
  const dataDir  = shDir.getDataRange().getValues();

  // 1. SET DEL DIRECTORIO (Normalizado para evitar errores de case-sensitive)
  const setDirectorio = new Set(
    dataDir.slice(1)
      .map(r => String(r[colID_Dir - 1] || '').trim().toUpperCase())
      .filter(Boolean)
  );

  const numRows = dataPart.length;
  if (numRows <= 1) return; // Hoja vacía o solo encabezado

  const numCols = dataPart[0].length;
  
  // 2. OBTENER COLORES ACTUALES
  const range = shPart.getRange(1, 1, numRows, numCols);
  const colorMatrix = range.getBackgrounds();

  let contFaltantes = 0;

  // 3. LOGICA DE REVISIÓN CON AUTOLIMPIEZA
  for (let i = 1; i < numRows; i++) {
    const idValue = String(dataPart[i][colID_Part - 1] || '').trim().toUpperCase();
    
    const esInvalido = idValue.length <= 3 || idValue.includes('CREAR NUEVO');
    
    if (esInvalido) {
      colorMatrix[i] = Array(numCols).fill('#ffffff'); // Limpiar filas de basura/instrucciones
      continue;
    }

    if (!setDirectorio.has(idValue)) {
      colorMatrix[i] = Array(numCols).fill('#ea9999'); // Rojo claro si falta
      contFaltantes++;
    } else {
      colorMatrix[i] = Array(numCols).fill('#ffffff'); // VOLVER A BLANCO si ya existe (CLAVE)
    }
  }

  // 4. ESCRITURA ÚNICA Y FORZADO DE CACHÉ
  range.setBackgrounds(colorMatrix);
  SpreadsheetApp.flush(); // Asegura que los cambios se guarden antes de pasar a la siguiente sede

  Logger.log(`Sede ${sedeNombre}: ${contFaltantes} faltantes marcados.`);
}
