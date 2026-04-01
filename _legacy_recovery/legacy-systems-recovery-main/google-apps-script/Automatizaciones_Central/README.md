# Cerebro Central (Sincronizador)

**Estado:** Crítico / Producción
**Google Sheet ID:** 1uPMMLlhEhlr57cKkeezvK3KfhCmUCrZ7druHUm8IT2A

## ⚠️ Configuración de Activadores (Triggers)
Este script NO funciona solo con guardar el código. Requiere un activador de tiempo configurado manualmente:

* **Función a ejecutar:** `automataPorHora`
* **Tipo de evento:** Basado en el tiempo (Time-driven)
* **Frecuencia:** Temporizador por hora (Every hour)
* **Hora:** Cada hora a los **25 minutos** (o cada 1 hora).

> **Nota Técnica:** Este script orquesta la sincronización global. Si este trigger se detiene, los datos dejarán de fluir desde las regiones.
