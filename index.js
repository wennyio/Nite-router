require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(async (req, res, next) => {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  if (!subdomain || subdomain === 'www') {
    return res.status(400).json({ error: 'No subdomain provided' });
  }

  const { data, error } = await supabase
    .from('customers')
    .select('container_url, status')
    .eq('subdomain', subdomain)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'App not found' });
  }

  if (data.status !== 'active') {
    return res.status(402).send('This account is inactive. Please renew your subscription.');
  }

  createProxyMiddleware({
    target: data.container_url,
    changeOrigin: true
  })(req, res, next);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Router running on port ${PORT}`));
