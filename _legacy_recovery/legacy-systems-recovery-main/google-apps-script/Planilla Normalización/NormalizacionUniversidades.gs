/**
 * @fileoverview Normalización de Universidades mediante reglas Regex secuenciales.
 * Prioriza reglas específicas antes que generales para evitar falsos positivos.
 */

function normalizarUniversidades() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  
  if (range.getLastRow() < 2) return; // Validación de datos mínimos

  let values = range.getValues();
  const headers = values[0];

  // 1. Identificar Columna
  const colIndex = headers.indexOf("Universidad");
  if (colIndex === -1) {
    SpreadsheetApp.getUi().alert("Error: No se encontró la columna 'Universidad'.");
    return;
  }

  // 2. Procesamiento en Memoria (Batch Processing)
  // Iteramos sobre las filas de datos
  for (let i = 1; i < values.length; i++) {
    const raw = values[i][colIndex];
    if (!raw) continue; // Si está vacío, saltamos

    const cleanText = raw.toString().trim(); 
    
    // Aplicamos las reglas secuencialmente
    for (const rule of UNI_REGEX_RULES) {
      if (rule.regex.test(cleanText)) {
        values[i][colIndex] = rule.val;
        break; // Match encontrado, detenemos la búsqueda para esta fila
      }
    }
  }

  // 3. Escritura en Bloque
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
}

// --- CONFIGURACIÓN DE REGLAS (De Específico a General) ---
const UNI_REGEX_RULES = [
  // Casos Conflictivos / Específicos
  { regex: /cat[oó]lica\s+de\s+valpara[ií]so|pucv/i, val: "PUCV" },
  { regex: /cat[oó]lica\s+del\s+norte|ucn/i, val: "UCN" },
  { regex: /sant[ií]sima\s+concepci[oó]n|ucsc/i, val: "UCSC" },
  { regex: /cat[oó]lica\s+de\s+temuco|uct/i, val: "UCT" },
  { regex: /silva\s+henr[ií]quez|ucsh/i, val: "UCSH" },
  { regex: /cat[oó]lica\s+andr[eé]s\s+bello|ucab/i, val: "UCAB (Venezuela)" },
  { regex: /javeriana|puj/i, val: "PUJ (Colombia)" },
  { regex: /sciences\s?po/i, val: "ScPo" }, // Agregado de tu diccionario
  { regex: /armada/i, val: "Armada" },    // Agregado de tu diccionario

  // Universidades "Grandes" (Namespaces amplios)
  { regex: /puc|pontificia\s+universidad\s+cat[oó]lica|cat[oó]lica|^uc$/i, val: "PUC" },
  { regex: /andes|uandes/i, val: "UANDES" },
  { regex: /austral/i, val: "UACH" }, // Austral antes que Chile para evitar captura errónea
  { regex: /uchile|universidad\s+de\s+chile|^chile$|^uch$/i, val: "UCH" },
  
  // Privadas Tradicionales / Otras
  { regex: /del\s+desarrollo|udd/i, val: "UDD" },
  { regex: /adolfo|uai|ib[aá][ñn]ez/i, val: "UAI" },
  { regex: /santa\s+mar[ií]a|utfsm|usm/i, val: "UTFSM" },
  { regex: /portales|udp/i, val: "UDP" },
  { regex: /mayor|umayor/i, val: "UM" },
  { regex: /andr[eé]s\s+bello|unab/i, val: "UNAB" },
  { regex: /santiago\s+de\s+chile|usach/i, val: "USACH" },
  
  // Diccionario General
  { regex: /finis|uft/i, val: "UFT" },
  { regex: /central|ucen/i, val: "UCEN" },
  { regex: /santo\s+tom[aá]s|ust/i, val: "UST" },
  { regex: /san\s+sebasti[aá]n|uss/i, val: "USS" },
  { regex: /inacap/i, val: "Inacap" },
  { regex: /duoc/i, val: "DUOC" },
  { regex: /aut[oó]noma/i, val: "UA" },
  { regex: /serena|uls/i, val: "ULS" },
  { regex: /concepci[oó]n|udec/i, val: "UdeC" },
  { regex: /frontera|ufro/i, val: "UFRO" },
  { regex: /valpara[ií]so|uv/i, val: "UV" },
  { regex: /talca|utal/i, val: "UTAL" },
  { regex: /bio\s?bio|ubb/i, val: "UBB" },
  { regex: /uniacc/i, val: "UNIACC" },
  { regex: /humanismo\s+cristiano|uahc/i, val: "UAHC" },
  { regex: /alberto\s+hurtado|uah/i, val: "UAH" },
  { regex: /gabriela\s+mistral|ugm/i, val: "UGM" },
  { regex: /americas|udla/i, val: "UDLA" },
  { regex: /bernardo|ubo/i, val: "UBO" }
];
