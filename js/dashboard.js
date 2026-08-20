/*!
 * js/dashboard.js — Dashboard de Métricas
 * Lee data/ga4-events.json y renderiza los gráficos
 */
(function () {
  'use strict';

  var LOG = '[MetricsDashboard]';

  // ====== Configuración ======
  var DATA_URL = 'data/ga4-events.json';

  // ====== Colores (misma paleta que la Bóveda) ======
  var COLORS = {
    primary: '#7bc2ff',
    success: '#a0ffc8',
    warning: '#ffd36b',
    danger: '#ff9d9d',
    purple: '#b19cd9',
    gold: '#f4c542',
    neutral: '#9aa2b8'
  };

  // ====== Utilidades ======
  function $(sel) { return document.querySelector(sel); }
  function fmtInt(n) { return Number(n || 0).toLocaleString('es-AR'); }
  function esc(s) { return String(s || '').replace(/[&<>]/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]); }); }

  // ====== Cargar datos ======
  async function loadData() {
    try {
      var res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.error(LOG, 'Error cargando datos:', e);
      return null;
    }
  }

  // ====== Render KPIs ======
  function renderKPIs(summary) {
    var host = $('#kpiGrid');
    if (!host || !summary) return;

    var kpis = [
      { label: 'Usuarios activos', value: summary.activeUsers, color: COLORS.primary },
      { label: 'Sesiones', value: summary.sessions, color: COLORS.success },
      { label: 'Vistas de página', value: summary.pageViews, color: COLORS.warning },
      { label: 'Tiempo promedio (min)', value: summary.avgSessionMinutes, color: COLORS.purple }
    ];

    host.innerHTML = kpis.map(function(kpi) {
      return '<div class="kpi-card" style="border-left:3px solid ' + kpi.color + ';">' +
        '<div class="kpi-value">' + fmtInt(kpi.value) + '</div>' +
        '<div class="kpi-label">' + esc(kpi.label) + '</div>' +
        '</div>';
    }).join('');
  }

  // ====== Render módulos ======
  function renderModules(modules) {
    var canvas = $('#modulesChart');
    if (!canvas || !modules || !modules.length) return;

    var labels = modules.map(function(m) { return m.label || m.name; });
    var values = modules.map(function(m) { return m.views || 0; });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Visitas',
          data: values,
          backgroundColor: COLORS.primary + 'cc',
          borderColor: COLORS.primary,
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#9aa2b8' },
            grid: { color: '#1a1c24' }
          },
          x: {
            ticks: { color: '#9aa2b8', autoSkip: false, maxRotation: 45, minRotation: 45 },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ====== Render eventos ======
  function renderEvents(events) {
    var canvas = $('#eventsChart');
    if (!canvas || !events) return;

    var entries = Object.entries(events).filter(function(e) { return e[1] > 0; });
    if (!entries.length) return;

    var labels = entries.map(function(e) {
      var names = {
        'add_api_key': 'Keys agregadas',
        'export_backup': 'Backups exportados',
        'import_backup': 'Backups importados',
        'open_account_wizard': 'Asistente abierto',
        'download_excel_template': 'Plantillas descargadas',
        'enrich_with_api': 'Enriquecimientos API',
        'encrypt_accounts_file': 'Archivos .enc creados',
        'force_reload_season': 'Recargas temporada',
        'open_api_keys_modal': 'Modal keys abierto',
        'delete_api_key': 'Keys eliminadas'
      };
      return names[e[0]] || e[0];
    });
    var values = entries.map(function(e) { return e[1]; });
    var colors = [
      COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger,
      COLORS.purple, COLORS.gold, COLORS.neutral, '#8ab4f8', '#c3e88d', '#ff8a80'
    ];

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, values.length),
          borderColor: '#0f1116',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9aa2b8', font: { size: 11 } }
          }
        }
      }
    });
  }

  // ====== Render geografía ======
  function renderGeography(geography) {
    var host = $('#geoList');
    if (!host || !geography || !geography.length) return;

    host.innerHTML = geography.map(function(g) {
      return '<div class="geo-item">' +
        '<span class="geo-name">' + esc(g.country) + '</span>' +
        '<span class="geo-count">' + fmtInt(g.users) + ' 👤</span>' +
        '</div>';
    }).join('');
  }

  // ====== Render dispositivos ======
  function renderDevices(devices) {
    var canvas = $('#devicesChart');
    if (!canvas || !devices) return;

    var data = [
      { label: 'Desktop', value: devices.desktop || 0, color: COLORS.primary },
      { label: 'Mobile', value: devices.mobile || 0, color: COLORS.success },
      { label: 'Tablet', value: devices.tablet || 0, color: COLORS.warning }
    ].filter(function(d) { return d.value > 0; });

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.map(function(d) { return d.label; }),
        datasets: [{
          data: data.map(function(d) { return d.value; }),
          backgroundColor: data.map(function(d) { return d.color; }),
          borderColor: '#0f1116',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9aa2b8', font: { size: 11 } }
          }
        }
      }
    });
  }

  // ====== Actualizar timestamp ======
  function renderTimestamp(lastUpdated) {
    var el = $('#lastUpdated');
    if (!el) return;
    if (lastUpdated) {
      var d = new Date(lastUpdated);
      el.textContent = 'Última actualización: ' + d.toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } else {
      el.textContent = '—';
    }
  }

  // ====== Init ======
  async function init() {
    console.log(LOG, 'Cargando dashboard...');
    var data = await loadData();
    if (!data) {
      $('#kpiGrid').innerHTML = '<p class="subtitle" style="text-align:center;padding:20px;">❌ No se pudieron cargar los datos.</p>';
      return;
    }

    renderTimestamp(data.lastUpdated);
    renderKPIs(data.summary);
    renderModules(data.modules);
    renderEvents(data.events);
    renderGeography(data.geography);
    renderDevices(data.devices);
    console.log(LOG, 'Dashboard renderizado');
  }

  // ====== Arrancar ======
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
