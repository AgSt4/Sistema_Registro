# 🛡️ Ideapaís Automation Systems | Disaster Recovery Archive

**Snapshot Date:** December 2025
**Maintainer:** Agustín Sandoval (Former Consultant)
**Status:** Frozen / Maintenance Mode

> **⚠️ AVISO LEGAL Y DE CONFIDENCIALIDAD**
> Este repositorio contiene **Código Fuente Propietario** de Fundación Ideapaís. Su propósito es servir como **Respaldo de Recuperación ante Desastres (Disaster Recovery)** para garantizar la continuidad operativa.
>
> * Prohibida su distribución pública.
> * Prohibido su uso comercial sin autorización escrita.
> * Consulte el archivo `LEGAL_NOTICE.md` para más detalles.

---

## 🎯 Objetivo del Repositorio

Este archivo no es el entorno de producción. Es un **búnker de seguridad** que contiene:
1.  El código fuente de todos los sistemas de automatización (Google Sheets + Python).
2.  Documentación de la arquitectura lógica.
3.  Guías de restauración en caso de corrupción o pérdida de datos en la nube de la organización.

---

## 📂 Estructura del Archivo

El sistema se divide en tres áreas principales. Navegue a la carpeta correspondiente según su necesidad:

### 1. [`/google-apps-script`](./google-apps-script) (El Núcleo)
Contiene todo el código que vive dentro de **Google Sheets**. Si las planillas dejan de funcionar, el código para repararlas está aquí.
* **RegionalCore:** Librería maestra (Lógica de negocio).
* **Automatizacion_Central:** Sincronización de datos.
* **Automatizacion_Satelite:** Conexión de planillas regionales.
* **ETL:** Herramientas de limpieza de datos.

### 2. [`/python-services`](./python-services) (Bots Externos)
Contiene los servicios que corren fuera de Google (Servidores/Local).
* **Bot WhatsApp:** Scripts de Python para mensajería automatizada.
* *Nota: Requiere configuración de entorno virtual y variables de entorno.*

### 3. [`/docs`](./docs) (Documentación y Llaves)
Información sensible y diagramas para humanos.
* Diagramas de flujo de datos.
* **Credenciales:** Las contraseñas y llaves de API están encriptadas o protegidas en archivos `.zip` con contraseña en esta carpeta.

---

## 🆘 Protocolo de Emergencia

Si el sistema ha colapsado ("System Failure"), siga estos pasos:

1.  **No entre en pánico.** El código está seguro aquí.
2.  **Identifique la falla:**
    * ¿Es un error en las planillas? -> Vaya a `google-apps-script/README.md`.
    * ¿El bot de WhatsApp no responde? -> Vaya a `python-services/whatsapp-bot/README.md`.
3.  **Revise las Credenciales:** Si cambiaron contraseñas, verifique la carpeta `/docs`.
4.  **Contacte al Mantenedor:** Si el equipo interno no puede restaurar el servicio siguiendo las guías de las sub-carpetas, contacte al desarrollador original para soporte de consultoría externo.

---

## 🛠️ Requisitos Técnicos

Para manipular este repositorio se recomienda:
* **Git** (para control de versiones).
* **Python 3.9+** (para los bots).
* **Acceso Administrador** a la suite de Google Workspace de Ideapaís.
