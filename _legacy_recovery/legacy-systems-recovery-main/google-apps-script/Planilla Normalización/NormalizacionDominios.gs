/**
 * @fileoverview Normalización basada en diccionarios externos (Comunas, Carreras, Roles).
 * Utiliza Hash Maps para búsquedas O(1) y realiza una sola lectura/escritura en la hoja de destino.
 */

function normalizarDominiosBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getActiveSheet();
  
  // 1. Lectura de Datos Principales
  const range = sh.getDataRange();
  if (range.getLastRow() < 2) return;
  
  let values = range.getValues();
  const headers = values[0];
  
  // 2. Configuración de Columnas a Normalizar
  // Estructura: { 'NombreColumnaEnData': 'NombreHojaDiccionario' }
  const DOMINIOS_CONFIG = {
    'Comuna': 'DICCIONARIO_COMUNAS',
    'Carrera': 'DICCIONARIO_CARRERAS',
    'Rol': 'DICCIONARIO_ROLES'
  };

  // 3. Construcción de Mapas de Diccionarios (Pre-carga en memoria)
  // maps = { indiceColumnaData: Map { 'valor_sucio' => 'Valor Oficial' } }
  const maps = {}; 
  
  for (const [colName, sheetName] of Object.entries(DOMINIOS_CONFIG)) {
    const colIdx = headers.indexOf(colName);
    
    // Si la columna existe en la data y la hoja diccionario existe...
    if (colIdx > -1) {
      const map = buildDictionaryMap(ss, sheetName, colName);
      if (map.size > 0) {
        maps[colIdx] = map;
      }
    }
  }

  // Si no se encontraron columnas para procesar, salir.
  if (Object.keys(maps).length === 0) {
    console.log("No se encontraron columnas de dominio para normalizar.");
    return;
  }

  // 4. Procesamiento de Datos (Una sola pasada)
  let cambios = 0;
  
  for (let i = 1; i < values.length; i++) {
    // Iteramos solo sobre las columnas que tienen un diccionario asociado
    for (const [colIdx, map] of Object.entries(maps)) {
      const rawValue = values[i][colIdx];
      if (!rawValue) continue;
      
      const key = normalizeKey(rawValue);
      
      // Búsqueda O(1) - Instantánea
      if (map.has(key)) {
        const valorOficial = map.get(key);
        
        // Solo sobrescribimos si es diferente (evita ediciones fantasmas)
        if (values[i][colIdx] !== valorOficial) {
          values[i][colIdx] = valorOficial;
          cambios++;
        }
      }
    }
  }

  // 5. Escritura (Batch Write)
  if (cambios > 0) {
    sh.getRange(1, 1, values.length, values[0].length).setValues(values);
    console.log(`Se normalizaron ${cambios} valores de dominio.`);
  } else {
    console.log("No hubo cambios en los dominios.");
  }
}

/**
 * Construye un Map llave-valor desde una hoja diccionario.
 * Asume que el diccionario tiene una columna con el mismo nombre que la data.
 * @return {Map} Map { 'texto normalizado' => 'Texto Oficial' }
 */
function buildDictionaryMap(ss, sheetName, headerName) {
  const dicSheet = ss.getSheetByName(sheetName);
  if (!dicSheet) return new Map();

  const data = dicSheet.getDataRange().getValues();
  if (data.length < 2) return new Map();

  // Buscar columna en el diccionario
  const headers = data[0];
  const colIdx = headers.indexOf(headerName);
  if (colIdx === -1) return new Map();

  const map = new Map();
  
  for (let i = 1; i < data.length; i++) {
    const valorOficial = data[i][colIdx];
    if (valorOficial) {
      // Guardamos: clave "santiago" -> valor "Santiago"
      map.set(normalizeKey(valorOficial), valorOficial);
    }
  }
  return map;
}

/**
 * Helper estandarizado de normalización de texto para llaves.
 * Elimina acentos, pasa a minúsculas y quita espacios.
 */
function normalizeKey(str) {
  return str.toString().toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
