function asignarSexo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  let values = range.getValues();
  const headers = values[0];

  // 1. Configuración de Columnas
  // Ajusta estos nombres si tus encabezados son distintos
  const colNombreIndex = headers.indexOf("Nombre"); 
  const colSexoIndex = headers.indexOf("Sexo"); // Si no existe, la crearemos

  // Si no encuentra la columna Nombre, avisa
  if (colNombreIndex === -1) {
    SpreadsheetApp.getUi().alert("No encontré la columna 'Nombre'.");
    return;
  }

  // Si no existe columna Sexo, definimos que escribiremos en la última columna disponible + 1
  // O puedes definir un índice fijo si prefieres.
  let targetColIndex = colSexoIndex;
  if (targetColIndex === -1) {
    targetColIndex = values[0].length; // Nueva columna al final
    values[0][targetColIndex] = "Sexo"; // Crear encabezado
  }

  // 2. Diccionario de Nombres (Basado en tu lista)
  // 1 = Masculino, 2 = Femenino
  const genderMap = {
    // Femeninos
    "abbigail": 2, "abril": 2, "adela": 2, "agustina": 2, "ailing": 2, "alejandra": 2, 
    "alejndra": 2, "alexandra": 2, "amaia": 2, "amalia": 2, "amanda": 2, "amparo": 2, 
    "ana": 2, "andrea": 2, "angela": 2, "angeles": 2, "angi": 2, "anita": 2, 
    "annelore": 2, "antonella": 2, "antonia": 2, "antonieta": 2, "arantxa": 2, 
    "arantza": 2, "barbara": 2, "beatriz": 2, "begoña": 2, "belen": 2, "bernardita": 2, 
    "bessy": 2, "blanca": 2, "camila": 2, "carla": 2, "carmely": 2, "carmen": 2, 
    "carolina": 2, "cata": 2, "catalina": 2, "caterina": 2, "cecilia": 2, "christel": 2, 
    "clara": 2, "clarita": 2, "claudia": 2, "coca": 2, "colomba": 2, "constanza": 2, 
    "consuelo": 2, "cote": 2, "danae": 2, "daniela": 2, "daphnne": 2, "delfina": 2, 
    "denisse": 2, "dominga": 2, "dominique": 2, "elenea": 2, "elisa": 2, "elnita": 2, 
    "ema": 2, "emili": 2, "emilia": 2, "estefania": 2, "estela": 2, "eva": 2, 
    "fernanda": 2, "florencia": 2, "fracisca": 2, "fran": 2, "francesca": 2, 
    "francisca": 2, "gabriela": 2, "gbriela": 2, "giselle": 2, "gracia": 2, 
    "ignacia": 2, "ines": 2, "isa": 2, "isabel": 2, "isabela": 2, "isidora": 2, 
    "ivania": 2, "jacinta": 2, "javi": 2, "javiera": 2, "jessy": 2, "jimena": 2, 
    "joan": 2, "josefa": 2, "josefina": 2, "juanita": 2, "julia": 2, "karime": 2, 
    "karina": 2, "karol": 2, "katherine": 2, "kathy": 2, "kika": 2, "laura": 2, 
    "laurencia": 2, "loreto": 2, "lorraine": 2, "lourdes": 2, "lucia": 2, "luz": 2, 
    "macarena": 2, "magdalena": 2, "maida": 2, "maitte": 2, "manena": 2, "manuela": 2, 
    "marcela": 2, "margarita": 2, "maria": 2, "marias": 2, "mariana": 2, "marie": 2, 
    "mariela": 2, "marilian": 2, "matilde": 2, "maureen": 2, "melissa": 2, 
    "mercedes": 2, "micaela": 2, "michelle": 2, "milena": 2, "monica": 2, 
    "monserrat": 2, "morin": 2, "naomi": 2, "natalia": 2, "nataly": 2, "nathalie": 2, 
    "nicole": 2, "nicoletta": 2, "olga": 2, "paloma": 2, "pamela": 2, "patricia": 2, 
    "paula": 2, "paulinas": 2, "paulina": 2, "paz": 2, "pia": 2, "pilar": 2, 
    "renata": 2, "roberta": 2, "rocio": 2, "romina": 2, "rosa": 2, "rosario": 2, 
    "rosita": 2, "sara": 2, "sharon": 2, "silvana": 2, "simona": 2, "sofia": 2, 
    "soledad": 2, "stefania": 2, "stephanie": 2, "susana": 2, "tamara": 2, "tania": 2, 
    "tatiana": 2, "teresa": 2, "teresita": 2, "trini": 2, "trinidad": 2, "vale": 2, 
    "valentina": 2, "valeria": 2, "vania": 2, "veronica": 2, "victoria": 2, 
    "violeta": 2, "virginia": 2, "vladiana": 2, "yareth": 2, "zunilda": 2,

    // Masculinos
    "abraham": 1, "adolfo": 1, "agustin": 1, "alberto": 1, "ale": 1, "alejandro": 1, 
    "alexander": 1, "alexis": 1, "alfredo": 1, "alonso": 1, "alvaro": 1, "ambrosio": 1, 
    "andres": 1, "anibal": 1, "antonio": 1, "antono": 1, "arturo": 1, "augusto": 1, 
    "axel": 1, "bastian": 1, "benedikt": 1, "benito": 1, "benjamin": 1, "camilo": 1, 
    "carlo": 1, "carlos": 1, "cesar": 1, "christopher": 1, "claudio": 1, "clemente": 1, 
    "crescente": 1, "cristian": 1, "cristobal": 1, "daniel": 1, "danilo": 1, "david": 1, 
    "demetrio": 1, "diego": 1, "domingo": 1, "edgar": 1, "edgardo": 1, "eduardo": 1, 
    "emil": 1, "emilio": 1, "enrique": 1, "ernesto": 1, "espir": 1, "esteban": 1, 
    "eugenio": 1, "exequiel": 1, "federico": 1, "felipe": 1, "fernando": 1, 
    "francesco": 1, "francisco": 1, "franco": 1, "gabriel": 1, "gaston": 1, 
    "gerak": 1, "gerardo": 1, "gianfranco": 1, "gonzalo": 1, "guillermo": 1, 
    "gustavo": 1, "hans": 1, "hector": 1, "hernan": 1, "hervy": 1, "hugo": 1, 
    "ian": 1, "igacio": 1, "ignacio": 1, "inigo": 1, "iñigo": 1, "ismael": 1, 
    "italo": 1, "ivo": 1, "jaime": 1, "javier": 1, "jean": 1, "joaquin": 1, 
    "john": 1, "jorge": 1, "jose": 1, "josue": 1, "joyce": 1, "juan": 1, 
    "julian": 1, "julio": 1, "keanu": 1, "klaus": 1, "leon": 1, "leonardo": 1, 
    "lothar": 1, "luca": 1, "lucas": 1, "lucho": 1, "luciano": 1, "luis": 1, 
    "lukas": 1, "manuel": 1, "marcelo": 1, "marcos": 1, "mario": 1, "martin": 1, 
    "massimiliano": 1, "matias": 1, "mauricio": 1, "max": 1, "maximiliano": 1, 
    "michael": 1, "miguel": 1, "moises": 1, "nacho": 1, "nader": 1, "nicolas": 1, 
    "norman": 1, "octavio": 1, "oliver": 1, "oscar": 1, "osvaldo": 1, "pablo": 1, 
    "patricio": 1, "paul": 1, "paulo": 1, "pedro": 1, "percy": 1, "peyo": 1, 
    "phillip": 1, "pietro": 1, "radoslav": 1, "rafa": 1, "rafael": 1, "raimundo": 1, 
    "raul": 1, "renato": 1, "renzo": 1, "ricardo": 1, "roberto": 1, "rodrigo": 1, 
    "ronald": 1, "samuel": 1, "santiago": 1, "sean": 1, "sebastian": 1, "sergio": 1, 
    "sharif": 1, "simon": 1, "stefano": 1, "takeo": 1, "tomas": 1, "vicente": 1, 
    "victor": 1, "wenceslao": 1, "yves": 1
  };

  // 3. Procesar Filas
  for (let i = 1; i < values.length; i++) {
    let rawName = values[i][colNombreIndex];
    if (!rawName) continue; // Si está vacío, saltar

    // Limpieza: "María Paz" -> "maria"
    let firstName = rawName.toString().trim().split(" ")[0].toLowerCase();
    
    // Quitar tildes (á -> a)
    firstName = firstName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Buscar en diccionario
    let result = "⚠️ Revisar";
    if (genderMap[firstName] === 1) result = "Masculino";
    if (genderMap[firstName] === 2) result = "Femenino";
    
    // Casos especiales ambiguos comunes
    if (firstName === "jose" && rawName.toString().toLowerCase().includes("maria")) {
        // "Jose Maria" -> Masculino (ya cubierto por Jose=M, pero por si acaso)
    }
    if (firstName === "maria" && rawName.toString().toLowerCase().includes("jose")) {
        // "Maria Jose" -> Femenino (ya cubierto por Maria=F)
    }

    // Escribir resultado en la matriz
    values[i][targetColIndex] = result;
  }

  // 4. Pegar resultados en la hoja (incluyendo el encabezado si era nuevo)
  // Usamos un rango que cubra todas las filas y columnas hasta la nueva
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
}
