/**
 * @fileoverview Script unificado de normalización de datos.
 * Optimizado para realizar una sola lectura y escritura en la hoja (Batch Operations).
 */

// --- CONFIGURACIÓN ACTUALIZADA CON TUS NUEVAS COLUMNAS ---
const COL_CONFIG = {
  'Nombre': 'titleCase',
  'Apellido1': 'titleCase',
  'Apellido2': 'titleCase',
  'Colegio': 'titleCase',
  'Carrera': 'titleCase', // Fallback si no está en el diccionario
  'Proyecto': 'titleCase',
  'Actividad': 'titleCase',
  'Sesión': 'titleCase',
  'Comuna': 'titleCase',  // Fallback
  
  // Datos de contacto
  'Rut': 'rut',
  'Teléfono': 'phone',
  'Correo': 'email',
  
  // Redes Sociales
  'X': 'twitter',       
  'Instagram': 'instagram',
  'Tiktok': 'instagram', // Tiktok usa lógica similar (@usuario)
  'Linkedin': 'linkedin' // NUEVA LÓGICA
};

function normalizarBaseCompleta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // 1. Lectura en bloque (Batch Read)
  const range = sheet.getDataRange();
  
  // Validación de seguridad: Si la hoja está vacía, detener.
  if (range.getLastRow() < 2) return; 
  
  let values = range.getValues();
  const headers = values[0];
  
  // 2. Crear mapa de índices (O(k) donde k es n° columnas)
  // Identificamos en qué índice numérico está cada columna configurada.
  const colIndices = {};
  for (const [headerName, type] of Object.entries(COL_CONFIG)) {
    const index = headers.indexOf(headerName);
    if (index > -1) {
      colIndices[index] = type; // Ej: { 0: 'titleCase', 4: 'rut' }
    }
  }

  // 3. Procesamiento de datos (O(n*m))
  // Iteramos desde la fila 1 (datos) hasta el final
  for (let i = 1; i < values.length; i++) {
    let row = values[i];
    
    // Solo iteramos sobre las columnas que existen en el mapa (ahorro de ciclos)
    for (const [colIdx, type] of Object.entries(colIndices)) {
      const val = row[colIdx];
      
      try {
        switch (type) {
          case 'titleCase':
            row[colIdx] = toTitleCase(val);
            break;
          case 'rut':
            row[colIdx] = formatRutSimple(val);
            break;
          case 'phone':
            row[colIdx] = formatTelefono(val);
            break;
          case 'twitter':
            row[colIdx] = formatSocialHandle(val, true); // true = filtro estricto (si/no)
            break;
          case 'instagram':
            row[colIdx] = formatSocialHandle(val, false); // false = solo agregar @
            break;
          case 'email':
            if (val) row[colIdx] = val.toString().toLowerCase().trim();
            break;
        }
      } catch (e) {
        console.error(`Error en fila ${i + 1}, columna ${colIdx}: ${e.message}`);
        // En caso de error, dejamos el valor original para no perder datos.
      }
    }
    values[i] = row;
  }

  // 4. Escritura en bloque (Batch Write)
  try {
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    SpreadsheetApp.flush(); // Asegurar escritura inmediata
    console.log("Normalización completada con éxito.");
  } catch (e) {
    SpreadsheetApp.getUi().alert("Error al escribir los datos: " + e.message);
  }
}

// --- FUNCIONES AUXILIARES (HELPERS) ---

function toTitleCase(str) {
  if (!str) return "";
  return str.toString().toLowerCase().trim().replace(/(?:^|\s|-)\S/g, function(letra) { 
    return letra.toUpperCase(); 
  });
}

function formatRutSimple(rut) {
  if (!rut) return "";
  const clean = rut.toString().replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return rut;
  
  const dv = clean.slice(-1);
  const cuerpo = clean.slice(0, -1);
  return `${cuerpo}-${dv}`;
}

function formatTelefono(fono) {
  if (!fono) return "";
  let num = fono.toString().replace(/\D/g, ""); // Solo números
  
  // Lógica: quitar prefijo 56 si sobra, agregar 9 si falta
  if (num.startsWith("56") && num.length >= 10) {
    num = num.substring(2);
  }
  if (num.length === 8) {
    num = "9" + num;
  }
  return num;
}

/**
 * Normaliza usuarios de redes sociales (Twitter/Instagram)
 * @param {string|number} handle - El usuario sucio
 * @param {boolean} strictFilter - Si es true, borra "si", "no", "n/a" (para Twitter)
 */
function formatSocialHandle(handle, strictFilter) {
  if (!handle) return "";
  let text = handle.toString().trim();
  
  if (strictFilter) {
    // Regex para detectar respuestas inválidas comunes en encuestas
    if (/^(si|no|sí|n\/a|ninguno)$/i.test(text)) return "";
  }
  
  // Agregar @ si no existe y no está vacío
  if (text.length > 0 && !text.startsWith("@")) {
    text = "@" + text;
  }
  
  return text.toLowerCase(); // Redes sociales suelen manejarse en minúsculas en URL
}

/**
 * Limpia URLs de LinkedIn y deja solo el slug del perfil.
 * Ej: https://www.linkedin.com/in/juan-perez-123/ -> juan-perez-123
 */
function formatLinkedin(url) {
  if (!url) return "";
  let text = url.toString().trim();
  
  // Si ya es un slug simple sin barras, lo devolvemos limpio
  if (!text.includes("/")) return text;

  // Extraer lo que está después de /in/
  // Soporta casos con slash final o parámetros de query (?...)
  const match = text.match(/in\/([^/?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  return text; // Si no calza con el patrón, devuelve original por seguridad
}
