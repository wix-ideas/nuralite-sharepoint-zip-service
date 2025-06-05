import JSZip from 'jszip';
import axios from 'axios';
import FormData from 'form-data';

const TENANT_ID = '6ecbe87a-bf55-407f-b022-cab8b9faff30';
const CLIENT_ID = '7a977f99-3397-4207-a81d-508c96dcc655';
const CLIENT_SECRET = 'jHY8Q~Aco0L81PBneYnSGLleWLx8eXot7fExkcpM';

const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  const { files } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Missing files' });
  }

  try {
    const token = await getGraphToken();

    const zip = new JSZip();

    for (const file of files) {
      const fileUrl = `https://graph.microsoft.com/v1.0/sites/${file.siteId}/drives/${file.driveId}/items/${file.itemId}/content`;

      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${token}` }
      });

      zip.file(file.name, response.data);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const link = await uploadToFileIO(zipBuffer);
    return res.status(200).json({ zipUrl: link });

  } catch (err) {
    console.error('ZIP/UPLOAD ERROR:', err);
    return res.status(500).json({ error: 'Failed to zip and upload files' });
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

async function uploadToFileIO(zipBuffer) {
  const form = new FormData();
  form.append('file', zipBuffer, 'documents.zip');

  const response = await axios.post('https://file.io/', form, {
    headers: form.getHeaders()
  });

  if (!response.data.success) throw new Error('File.io upload failed');
  return response.data.link;
}
