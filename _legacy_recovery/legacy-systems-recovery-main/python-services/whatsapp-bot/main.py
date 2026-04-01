import os
import time
import io
import random
import pandas as pd
from PIL import Image
import win32clipboard

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIGURACIÓN ---
ARCHIVO_XLSX = "lista.xlsx"
ARCHIVO_IMG = "imagen.jpg"

MENSAJE = """¡Hola {Nombre}! Te quiero contar sobre *Futuro Público*.\n\nEs un programa intensivo de capacitación de jóvenes profesionales de hasta 35 años con vocación de servicio, orientado a fortalecer capacidades reales para aportar al país desde el Gobierno. Buscamos personas comprometidas con Chile, interesadas en trabajar desde el servicio público con probidad, responsabilidad y sentido de urgencia. El programa combina formación práctica, expositores con experiencia en gestión pública y acompañamiento de mentores, y formar parte de una *red de profesionales disponibles para el próximo gobierno*\n\n📍 *Modalidad*: Presencial (Providencia)\n📅 *Fechas*: 16 y 17 de enero\n📝 *Postulaciones abiertas hasta*: 4 de enero\n\nSi te interesa poner tus capacidades al servicio del país y contribuir a un Estado que funcione mejor *¡Te invitamos a postular a esta beca!*\n\n👉 www.futuropublico.cl"""

# --- FUNCIONES ---
def copiar_imagen_al_portapapeles(ruta):
    imagen = Image.open(ruta)
    output = io.BytesIO()
    imagen.convert("RGB").save(output, "BMP")
    data = output.getvalue()[14:]
    output.close()
    win32clipboard.OpenClipboard()
    win32clipboard.EmptyClipboard()
    win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
    win32clipboard.CloseClipboard()

def pausa_humana(min_s, max_s):
    time.sleep(random.uniform(min_s, max_s))

def normalizar_fono(valor):
    fono = "".join(filter(str.isdigit, str(valor)))
    if len(fono) == 9 and fono.startswith("9"):
        fono = "56" + fono
    return fono if len(fono) >= 11 else None

# --- INICIO ---
ruta_img = os.path.abspath(ARCHIVO_IMG)

print("🚀 Abriendo navegador...")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("https://web.whatsapp.com")

input("📲 Escanea el QR y presiona ENTER aquí para comenzar >> ")

# LEER XLSX
try:
    df = pd.read_excel(ARCHIVO_XLSX)
    if not {"Nombre", "Teléfono"}.issubset(df.columns):
        raise ValueError("El XLSX debe contener las columnas: Nombre y Teléfono")
except Exception as e:
    print(f"❌ Error leyendo XLSX: {e}")
    exit()

wait = WebDriverWait(driver, 40)

print(f"📋 Procesando {len(df)} contactos...")

for index, row in df.iterrows():
    nombre = str(row["Nombre"]).strip()
    fono = normalizar_fono(row["Teléfono"])

    if not fono:
        print(f"⚠️ Teléfono inválido para {nombre}")
        continue

    try:
        driver.get(f"https://web.whatsapp.com/send?phone={fono}")

        caja_chat = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//footer//div[@contenteditable='true']"))
        )
        caja_chat.click()

        copiar_imagen_al_portapapeles(ruta_img)
        ActionChains(driver).key_down(Keys.CONTROL).send_keys('v').key_up(Keys.CONTROL).perform()

        pausa_humana(4.5, 6.5)

        nombre_corto = nombre.split()[0] if nombre else ""
        texto_final = MENSAJE.replace("{Nombre}", nombre_corto)

        lineas = texto_final.split('\n')
        for i, linea in enumerate(lineas):
            ActionChains(driver).send_keys(linea).perform()
            pausa_humana(0.15, 0.35)
            if i < len(lineas) - 1:
                ActionChains(driver)\
                    .key_down(Keys.SHIFT)\
                    .send_keys(Keys.ENTER)\
                    .key_up(Keys.SHIFT)\
                    .perform()
                pausa_humana(0.1, 0.25)

        pausa_humana(1.5, 2.5)
        ActionChains(driver).send_keys(Keys.ENTER).perform()

        print(f"✅ Enviado a {nombre}")

        pausa_humana(7.5, 11.5)

    except Exception as e:
        print(f"❌ Error con {nombre}: {e}")
        pausa_humana(10, 15)

print("🏁 Fin.")
