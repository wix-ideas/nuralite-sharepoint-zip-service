import axios from 'axios';

const TENANT_ID = '6ecbe87a-bf55-407f-b022-cab8b9faff30';
const CLIENT_ID = '7a977f99-3397-4207-a81d-508c96dcc655';
const CLIENT_SECRET = 'jHY8Q~Aco0L81PBneYnSGLleWLx8eXot7fExkcpM';
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

export default async function handler(req, res) {
  // CORS headers must be set FIRST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Early return for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { encodedId } = req.body;
  if (!encodedId) return res.status(400).send('Missing encodedId');

  try {
    const token = await getGraphToken();
    const graphUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedId}/driveItem`;

    const response = await axios.get(graphUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const item = response.data;

    return res.status(200).json({
      name: item.name,
      itemId: item.id,
      driveId: item.parentReference?.driveId,
      siteId: item.parentReference?.siteId
    });
  } catch (err) {
    console.error('Resolve error:', err.response?.data || err.message);
    return res.status(500).send('Failed to resolve metadata');
  }
}

async function getGraphToken() {
  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return response.data.access_token;
}
