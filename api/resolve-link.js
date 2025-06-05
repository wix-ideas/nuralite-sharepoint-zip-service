import axios from 'axios';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const TENANT_ID = '6ecbe87a-bf55-407d-b022-cab8b9faff30';
const CLIENT_ID = '7a977f99-3397-4207-a81d-508c96dcc655';
const CLIENT_SECRET = 'jHY8Q~Aco0L81PBneYnSGLleWLx8eXot7fExkcpM';

const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

async function getGraphToken() {
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  const response = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data.access_token;
}

async function resolveSingleUrl(fullUrl, token) {
  const encodedUrl = base64UrlEncode(fullUrl);
  const graphUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem`;

  const response = await axios.get(graphUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const item = response.data;
  return {
    name: item.name,
    itemId: item.id,
    driveId: item.parentReference?.driveId,
    siteId: item.parentReference?.siteId
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { fullUrl, fullUrls } = req.body;

  if (!fullUrl && !fullUrls) {
    res.status(400).send('Missing fullUrl or fullUrls');
    return;
  }

  try {
    const token = await getGraphToken();

    if (fullUrl) {
      // SINGLE URL CASE
      const result = await resolveSingleUrl(fullUrl, token);
      res.status(200).json(result);
      return;
    }

    if (fullUrls && Array.isArray(fullUrls)) {
      // BATCH CASE
      const results = [];
      for (const url of fullUrls) {
        try {
          const metadata = await resolveSingleUrl(url, token);
          results.push(metadata);
        } catch (err) {
          // For failure, push null or an error object if you want
          results.push(null);
          console.error(`Failed to resolve ${url}`, err.message);
        }
      }
      res.status(200).json(results);
      return;
    }

    res.status(400).send('Invalid payload');

  } catch (error) {
    console.error('Error in resolve-link handler:', error.response?.data || error.message);
    res.status(500).send('Internal Server Error');
  }
}
