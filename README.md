# 📊 GW2 Metrics Dashboard

Panel de métricas para la **Bóveda del Gato Negro** — visualización de eventos GA4, usuarios activos, módulos más usados y geografía.

## ✨ Características

- 📈 KPIs de usuarios activos, sesiones y vistas
- 🧩 Módulos más visitados (eventos `view_module`)
- 🔑 Eventos clave (keys agregadas, backups, asistentes)
- 🌍 Geografía de usuarios
- 📱 Dispositivos (desktop vs móvil)
- 🎨 Diseño consistente con la Bóveda

## 🚀 Demo

🔗 [Ver panel en vivo](https://pablosnchz.github.io/gw2-metrics-dashboard/)

## 📁 Estructura

\`\`\`
gw2-metrics-dashboard/
├── index.html          # Dashboard principal
├── data/
│   └── ga4-events.json # Datos exportados de GA4
├── css/
│   └── styles.css      # Estilos (misma piel que la Bóveda)
└── js/
    └── dashboard.js    # Render de gráficos
\`\`\`

## 🔧 Cómo actualizar los datos

1. Exportar datos de GA4 (CSV o JSON)
2. Convertir a `ga4-events.json`
3. Commit y push al repo
4. El panel se actualiza automáticamente en GitHub Pages

## 📊 Fuente de datos

- **Google Analytics 4** — eventos personalizados de la Bóveda
- **Módulos trackeados:** wallet, meta, achievements, wizards_vault, activities, inventory, raids, strikes, accounts

## 🛠️ Stack

- HTML + CSS + JS vanilla (sin frameworks)
- Chart.js para gráficos (CDN)
- GitHub Pages para hosting

## 📄 Licencia

MIT — mismo que la Bóveda del Gato Negro

---

Desarrollado con 🐈‍⬛ por [PabloSnchz](https://github.com/PabloSnchz)
