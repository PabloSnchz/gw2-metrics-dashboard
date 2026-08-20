# 📊 GW2 Metrics Dashboard

Panel de métricas para la **Bóveda del Gato Negro** — visualización de eventos GA4, usuarios activos, módulos más usados y geografía.

## ✨ Características

- 📈 KPIs de usuarios activos, sesiones y vistas
- 🧩 Módulos más visitados con total de vistas
- 🔑 Eventos clave (keys agregadas, backups, asistentes)
- 🌍 Geografía con banderas, % de usuarios y vistas
- 📱 Dispositivos (desktop vs mobile)
- 🎨 Diseño consistente con la Bóveda

## 🚀 Demo

🔗 [Ver panel en vivo](https://pablosnchz.github.io/gw2-metrics-dashboard/)

## 📁 Estructura

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Dashboard principal |
| `css/styles.css` | Estilos (misma piel que la Bóveda) |
| `js/dashboard.js` | Render de gráficos |
| `api/metrics.js` | Endpoint Vercel que consulta GA4 |
| `data/historical-modules.json` | Ponderación histórica de módulos |
| `package.json` | Dependencia `@google-analytics/data` |

## 🔧 Arquitectura

| Paso | Componente | Qué hace |
|------|------------|----------|
| 1 | **Webapp (Bóveda)** | Genera eventos (`view_module`, `add_api_key`, etc.) |
| 2 | **Google Analytics 4** | Almacena y procesa los eventos |
| 3 | **API de Analytics Data** | Permite consultar los datos programáticamente |
| 4 | **Vercel Function** (`api/metrics.js`) | Consulta GA4 y devuelve JSON |
| 5 | **Panel de métricas** (GitHub Pages) | Renderiza los datos visualmente |

## 📊 Fuente de datos

- **Google Analytics 4** — propiedad `530839820`
- **Eventos trackeados:**

| Evento | Qué mide |
|--------|----------|
| `view_module` | Navegación entre módulos (con dimensión `module_name`) |
| `page_view` | Vistas de página |
| `session_start` | Sesiones iniciadas |
| `scroll` | Scroll del usuario |
| `user_engagement` | Interacción general |
| `click` | Clicks en la webapp |
| `open_api_keys_modal` | Aperturas del modal de keys |
| `add_api_key` | Keys agregadas |
| `delete_api_key` | Keys eliminadas |
| `export_backup` | Backups exportados |
| `import_backup` | Backups importados |
| `open_account_wizard` | Asistente de cuentas abierto |
| `download_excel_template` | Plantillas Excel descargadas |
| `enrich_with_api` | Enriquecimientos con API |
| `encrypt_accounts_file` | Archivos .enc creados |
| `force_reload_season` | Recargas forzadas de temporada |

## 🧩 Módulos trackeados

| Módulo | module_name |
|--------|-------------|
| Cartera | `wallet` |
| Meta & Eventos | `meta_events` |
| Logros | `achievements` |
| Cámara del Brujo | `wizards_vault` |
| Actividades | `activities` |
| Inventario y Personajes | `inventory` |
| Raids | `raids` |
| Strikes | `strikes` |
| Cuentas | `accounts` |
| Bienvenida | `welcome` |
| Dashboard Cartera | `wallet_dashboard` |
| Dashboard Inventario | `inventory_dashboard` |
| Dashboard Objetivos | `wv_objectives_dashboard` |

## 📈 Ponderación histórica

Los datos de `view_module` anteriores al registro de la dimensión `module_name` (agosto 2026) se muestran mediante una **ponderación estimada**:

| Módulo | % estimado |
|--------|------------|
| Cartera | 35% |
| Meta & Eventos | 15% |
| Cámara del Brujo | 15% |
| Logros | 8% |
| Actividades | 7% |
| Inventario y Personajes | 7% |
| Cuentas | 5% |
| Raids y Strikes | 4% |
| Dashboards | 3% |
| Bienvenida | 1% |

**Total histórico:** 5.722 eventos `view_module`

A partir del 20/08/2026, cada `view_module` nuevo incluye el parámetro `module_name` real. Los datos nuevos se **suman** a la ponderación histórica.

## 🔐 Seguridad

| Componente | Protección |
|------------|------------|
| Service account | Rol de lectura en GA4 |
| Credenciales | Variables de entorno en Vercel |
| Frontend | Nunca ve las credenciales |
| Acceso | Limitado a la propiedad de la Bóveda |

## ⚙️ Configuración

### Variables de entorno (Vercel)

| Variable | Descripción |
|----------|-------------|
| `GA4_PROPERTY_ID` | ID de la propiedad de GA4 |
| `GA4_CLIENT_EMAIL` | Email de la service account |
| `GA4_PRIVATE_KEY` | Clave privada de la service account |

### GA4

| Configuración | Valor |
|---------------|-------|
| Retención de datos | 14 meses |
| Dimensión custom | `module_name` (ámbito: Evento) |

## 🛠️ Stack

| Componente | Tecnología |
|------------|------------|
| Frontend | HTML + CSS + JS vanilla |
| Gráficos | Chart.js (CDN) |
| Backend | Vercel Functions |
| API | Google Analytics Data API |
| Hosting | GitHub Pages |

## 📄 Licencia

MIT — mismo que la Bóveda del Gato Negro

---

Desarrollado con 🐈‍⬛ por [PabloSnchz](https://github.com/PabloSnchz)
