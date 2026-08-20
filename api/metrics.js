/*!
 * api/metrics.js — Endpoint de métricas GA4 para Vercel Functions
 * v4 — Diagnóstico detallado
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
    res.status(500).json({ 
      error: e.message || 'Internal error',
      stack: e.stack,
      details: e.details || null
    });
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
  
  // Test 1: Query mínima — solo activeUsers
  console.log('[Test] Iniciando query mínima...');
  
  const testResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    metrics: [{ name: 'activeUsers' }]
  });
  
  console.log('[Test] Query mínima devolvió:', JSON.stringify(testResponse));

  // Test 2: Query de eventos
  console.log('[Test] Iniciando query de eventos...');
  
  const eventsResponse = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    limit: 10
  });
  
  console.log('[Test] Query de eventos devolvió:', JSON.stringify(eventsResponse));

  return {
    lastUpdated: new Date().toISOString(),
    testResponse: testResponse,
    eventsResponse: eventsResponse,
    propertyId: propertyId
  };
}
