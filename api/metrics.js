/*!
 * api/metrics.js — Endpoint de métricas GA4 para Vercel Functions
 * v6 — Modules con dimensión custom module_name
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const metrics = await fetchGA4Metrics();
    res.status(200).json(metrics);
  } catch (e) {
    console.error('[Metrics] Error:', e);
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}

function extractRows(response) {
  if (!response || !Array.isArray(response)) return [];
  const first = response[0];
  if (!first || !first.rows || !Array.isArray(first.rows)) return [];
  return first.rows;
}

async function fetchGA4Metrics() {
  const { BetaAnalyticsDataClient } = await import('@google-analytics/data');

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_CLIENT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });

  const propertyId = process.env.GA4_PROPERTY_ID;

  // Query 1: Summary general
  const summaryResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'eventCount' }
    ]
  });

  // Query 2: Eventos
  const eventsResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    limit: 50
  });

  // Query 3: Páginas
  const pagesResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    limit: 10
  });

  // Query 4: Geografía
  const geoResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    limit: 15
  });

  // Query 5: Dispositivos
  const devicesResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }]
  });

  // ====== Parsear con extractRows ======
  
  // Summary
  const summary = {
    activeUsers: 0,
    newUsers: 0,
    sessions: 0,
    pageViews: 0,
    avgSessionMinutes: 0,
    totalEvents: 0
  };
  
  const summaryRows = extractRows(summaryResponse);
  if (summaryRows.length > 0) {
    const row = summaryRows[0];
    const vals = row.metricValues || [];
    summary.activeUsers = parseInt(vals[0]?.value || '0', 10);
    summary.newUsers = parseInt(vals[1]?.value || '0', 10);
    summary.sessions = parseInt(vals[2]?.value || '0', 10);
    summary.pageViews = parseInt(vals[3]?.value || '0', 10);
    summary.avgSessionMinutes = Math.round((parseFloat(vals[4]?.value || '0') / 60) * 10) / 10;
    summary.totalEvents = parseInt(vals[5]?.value || '0', 10);
  }

  // Events
  const events = {};
  extractRows(eventsResponse).forEach(function(row) {
    const name = row.dimensionValues && row.dimensionValues[0] ? row.dimensionValues[0].value : '';
    const count = parseInt(row.metricValues && row.metricValues[0] ? row.metricValues[0].value : '0', 10);
    if (name) events[name] = count;
  });

  // Pages
  const pages = extractRows(pagesResponse).map(function(row) {
    return {
      title: row.dimensionValues && row.dimensionValues[0] ? row.dimensionValues[0].value : '',
      views: parseInt(row.metricValues && row.metricValues[0] ? row.metricValues[0].value : '0', 10)
    };
  }).sort(function(a, b) { return b.views - a.views; });

  // Geography
  const geography = extractRows(geoResponse).map(function(row) {
    return {
      country: row.dimensionValues && row.dimensionValues[0] ? row.dimensionValues[0].value : 'Desconocido',
      users: parseInt(row.metricValues && row.metricValues[0] ? row.metricValues[0].value : '0', 10)
    };
  }).sort(function(a, b) { return b.users - a.users; });

  // Devices
  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  extractRows(devicesResponse).forEach(function(row) {
    const cat = row.dimensionValues && row.dimensionValues[0] ? row.dimensionValues[0].value : '';
    const users = parseInt(row.metricValues && row.metricValues[0] ? row.metricValues[0].value : '0', 10);
    if (cat === 'desktop') devices.desktop = users;
    else if (cat === 'mobile') devices.mobile = users;
    else if (cat === 'tablet') devices.tablet = users;
  });

  // Modules — usar la dimensión custom module_name
  const modules = [];
  const moduleLabels = {
    wallet: 'Cartera',
    meta_events: 'Meta & Eventos',
    achievements: 'Logros',
    wizards_vault: 'Cámara del Brujo',
    activities: 'Actividades',
    inventory: 'Inventario',
    raids: 'Raids',
    strikes: 'Strikes',
    accounts: 'Cuentas',
    welcome: 'Bienvenida',
    wallet_dashboard: 'Dashboard Cartera',
    inventory_dashboard: 'Dashboard Inventario',
    wv_objectives_dashboard: 'Dashboard Objetivos'
  };

  const modulesResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'customEvent:module_name' }],
    metrics: [{ name: 'eventCount' }],
    limit: 20
  }).catch(function() { return null; });

  if (modulesResponse && Array.isArray(modulesResponse)) {
    extractRows(modulesResponse).forEach(function(row) {
      const name = row.dimensionValues && row.dimensionValues[0] ? row.dimensionValues[0].value : '';
      const count = parseInt(row.metricValues && row.metricValues[0] ? row.metricValues[0].value : '0', 10);
      if (name && count > 0) {
        modules.push({
          name: name,
          label: moduleLabels[name] || name,
          views: count
        });
      }
    });
  }
  modules.sort(function(a, b) { return b.views - a.views; });

  return {
    lastUpdated: new Date().toISOString(),
    summary: summary,
    events: events,
    pages: pages,
    geography: geography,
    devices: devices,
    modules: modules
  };
}
