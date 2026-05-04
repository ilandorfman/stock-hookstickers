export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, x-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = req.headers['x-user-id'];
  const token = req.headers['x-token'];
  if (!userId || !token) return res.status(400).json({ error: 'Faltan credenciales' });

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const since = threeMonthsAgo.toISOString().split('T')[0];

  try {
    let page = 1, all = [];
    while (true) {
      const url = `https://api.tiendanube.com/v1/${userId}/orders?per_page=200&page=${page}&created_at_min=${since}&status=paid,closed`;
      const r = await fetch(url, {
        headers: { 'Authentication': `bearer ${token}`, 'User-Agent': 'StockHook/1.0' }
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      if (!data.length) break;
      all = all.concat(data);
      if (data.length < 200) break;
      page++;
    }
    res.status(200).json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
