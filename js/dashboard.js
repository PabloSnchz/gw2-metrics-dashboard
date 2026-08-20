/*!
 * js/dashboard.js — Dashboard de Métricas
 * v3 — Sin distinción estimado/real, total en gráfico, banderas
 */
(function () {
  'use strict';

  var LOG = '[MetricsDashboard]';

  // ====== Configuración ======
  var HISTORICAL_URL = 'data/historical-modules.json';
  var DATA_URL = 'https://gw2-metrics-dashboard.vercel.app/api/metrics';

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
  async function loadHistorical() {
    try {
      var res = await fetch(HISTORICAL_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn(LOG, 'Error cargando histórico:', e);
      return { modules: [] };
    }
  }

  async function loadLive() {
    try {
      var res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn(LOG, 'Error cargando datos en vivo:', e);
      return null;
    }
  }

  async function loadAllData() {
    var historical = await loadHistorical();
    var live = await loadLive();

    if (!live) {
      return {
        summary: { activeUsers: 0, newUsers: 0, sessions: 0, pageViews: 0, avgSessionMinutes: 0 },
        events: {},
        geography: [],
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        modules: historical.modules || []
      };
    }

    // Combinar módulos históricos + módulos nuevos
    var combinedModules = (historical.modules || []).slice();
    
    if (live.modules && live.modules.length) {
      live.modules.forEach(function(liveModule) {
        var existing = combinedModules.find(function(hm) { return hm.name === liveModule.name; });
        if (existing) {
          existing.views += liveModule.views;
        } else {
          combinedModules.push({
            name: liveModule.name,
            label: liveModule.label || liveModule.name,
            views: liveModule.views
          });
        }
      });
    }

    // Filtrar módulos "No definidos" (los ponderamos en el JSON histórico)
    combinedModules = combinedModules.filter(function(m) { return m.name !== 'not_set'; });

    combinedModules.sort(function(a, b) { return b.views - a.views; });

    return {
      summary: live.summary || { activeUsers: 0, newUsers: 0, sessions: 0, pageViews: 0, avgSessionMinutes: 0 },
      events: live.events || {},
      geography: live.geography || [],
      devices: live.devices || { desktop: 0, mobile: 0, tablet: 0 },
      modules: combinedModules
    };
  }

  // ====== Render KPIs ======
  function renderKPIs(summary) {
    var host = $('#kpiGrid');
    if (!host || !summary) return;

    var kpis = [
      { label: 'Usuarios activos', value: summary.activeUsers || 0, color: COLORS.primary },
      { label: 'Sesiones', value: summary.sessions || 0, color: COLORS.success },
      { label: 'Vistas de página', value: summary.pageViews || 0, color: COLORS.warning },
      { label: 'Tiempo promedio (min)', value: summary.avgSessionMinutes || 0, color: COLORS.purple }
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
    var total = values.reduce(function(a, b) { return a + b; }, 0);

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
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function() {
                return 'Total: ' + total.toLocaleString('es-AR') + ' vistas';
              }
            }
          },
          title: {
            display: true,
            text: 'Total: ' + total.toLocaleString('es-AR') + ' vistas',
            color: '#9aa2b8',
            font: { size: 12, weight: '600' },
            padding: { bottom: 10 }
          }
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

    var eventLabels = {
      'view_module': 'Navegación entre módulos',
      'page_view': 'Vistas de página',
      'scroll': 'Scroll',
      'user_engagement': 'Interacción',
      'session_start': 'Sesiones iniciadas',
      'open_api_keys_modal': 'Modal de keys',
      'click': 'Clicks',
      'first_visit': 'Primeras visitas',
      'add_api_key': 'Keys agregadas',
      'form_start': 'Formularios iniciados',
      'export_backup': 'Backups exportados',
      'import_backup': 'Backups importados',
      'open_account_wizard': 'Asistente abierto',
      'delete_api_key': 'Keys eliminadas',
      'download_excel_template': 'Plantillas descargadas',
      'force_reload_season': 'Recargas temporada'
    };

    var entries = Object.entries(events).filter(function(e) { return e[1] > 0; });
    if (!entries.length) return;

    var labels = entries.map(function(e) { return eventLabels[e[0]] || e[0]; });
    var values = entries.map(function(e) { return e[1]; });
    var colors = [
      COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger,
      COLORS.purple, COLORS.gold, COLORS.neutral, '#8ab4f8',
      '#c3e88d', '#ff8a80', '#c5cae9', '#ffcc80',
      '#80cbc4', '#f48fb1', '#b39ddb', '#ffe082'
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
            labels: { color: '#9aa2b8', font: { size: 10 } }
          }
        }
      }
    });
  }

  // ====== Banderas por país ======
  function getCountryFlag(country) {
    var flags = {
      'Argentina': '🇦🇷',
      'United States': '🇺🇸',
      'Colombia': '🇨🇴',
      'Mexico': '🇲🇽',
      'Peru': '🇵🇪',
      'Spain': '🇪🇸',
      'Chile': '🇨🇱',
      'Singapore': '🇸🇬',
      'Brazil': '🇧🇷',
      'Uruguay': '🇺🇾',
      'Venezuela': '🇻🇪',
      'Ecuador': '🇪🇨',
      'Bolivia': '🇧🇴',
      'Paraguay': '🇵🇾',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹'
    };
    return flags[country] || '🌍';
  }

  // ====== Render geografía ======
  function renderGeography(geography) {
    var host = $('#geoList');
    if (!host || !geography || !geography.length) return;

    host.innerHTML = geography.map(function(g) {
      var flag = getCountryFlag(g.country);
      return '<div class="geo-item">' +
        '<span class="geo-name">' + flag + ' ' + esc(g.country) + '</span>' +
        '<span class="geo-count">' + fmtInt(g.users) + ' 👤 · ' + fmtInt(g.views) + ' vistas</span>' +
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

    if (!data.length) return;

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
    var data = await loadAllData();
    if (!data) {
      $('#kpiGrid').innerHTML = '<p class="subtitle" style="text-align:center;padding:20px;">❌ No se pudieron cargar los datos.</p>';
      return;
    }

    renderTimestamp(data.lastUpdated || new Date().toISOString());
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
