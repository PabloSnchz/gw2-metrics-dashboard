/*!
 * api/metrics.js — Endpoint de métricas GA4 para Vercel Functions
 */

export default async function handler(req, res) {
  // CORS
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

async function fetchGA4Metrics() {
  const { BetaAnalyticsDataClient } = await import('@google-analytics/data');

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_CLIENT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });

  const propertyId = process.env.GA4_PROPERTY_ID;

  // Query 1: Resumen general
  const summaryResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' }
    ]
  });

  // Query 2: Módulos más visitados
  const modulesResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'customEvent:module_name' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'view_module' }
      }
    }
  });

  // Query 3: Eventos clave
  const eventsResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    limit: 25
  });

  // Query 4: Geografía
  const geoResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    limit: 10
  });

  // Query 5: Dispositivos
  const devicesResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }]
  });

  // ====== Parsear respuestas ======
  
  // Summary
  const summary = {};
  if (summaryResponse.rows && summaryResponse.rows.length) {
    const row = summaryResponse.rows[0];
    summary.activeUsers = parseInt(row.metricValues[0]?.value || '0');
    summary.sessions = parseInt(row.metricValues[1]?.value || '0');
    summary.pageViews = parseInt(row.metricValues[2]?.value || '0');
    summary.avgSessionMinutes = Math.round((parseFloat(row.metricValues[3]?.value || '0') / 60) * 10) / 10;
  }

  // Modules
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

  const modules = (modulesResponse.rows || []).map(function(row) {
    const name = row.dimensionValues[0]?.value || 'unknown';
    return {
      name: name,
      label: moduleLabels[name] || name,
      views: parseInt(row.metricValues[0]?.value || '0')
    };
  }).sort(function(a, b) { return b.views - a.views; });

  // Events
  const events = {};
  (eventsResponse.rows || []).forEach(function(row) {
    const name = row.dimensionValues[0]?.value || '';
    const count = parseInt(row.metricValues[0]?.value || '0');
    if (name && count > 0) {
      events[name] = count;
    }
  });

  // Geography
  const geography = (geoResponse.rows || []).map(function(row) {
    return {
      country: row.dimensionValues[0]?.value || 'Desconocido',
      users: parseInt(row.metricValues[0]?.value || '0')
    };
  }).sort(function(a, b) { return b.users - a.users; });

  // Devices
  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  (devicesResponse.rows || []).forEach(function(row) {
    const cat = row.dimensionValues[0]?.value || '';
    const users = parseInt(row.metricValues[0]?.value || '0');
    if (cat === 'desktop') devices.desktop = users;
    else if (cat === 'mobile') devices.mobile = users;
    else if (cat === 'tablet') devices.tablet = users;
  });

  return {
    lastUpdated: new Date().toISOString(),
    summary: summary,
    modules: modules,
    events: events,
    geography: geography,
    devices: devices
  };
}
