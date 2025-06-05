// File: /api/zip-files.js

import axios from 'axios';
import archiver from 'archiver';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

const TENANT_ID = '6ecbe87a-bf55-407f-b022-cab8b9faff30';
const CLIENT_ID = '7a977f99-3397-4207-a81d-508c96dcc655';
const CLIENT_SECRET = 'jHY8Q~Aco0L81PBneYnSGLleWLx8eXot7fExkcpM';

const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { files } = req.body;
  if (!files || !Array.isArray(files)) return res.status(400).send('Missing files array');

  try {
    const token = await getGraphToken();
    const archive = archiver('zip', { zlib: { level: 9 } });

    const zipStream = new stream.PassThrough();
    const chunks = [];

    zipStream.on('data', (chunk) => chunks.push(chunk));
    zipStream.on('end', async () => {
      const zipBuffer = Buffer.concat(chunks);

      // Upload logic needed here (e.g., S3, Firebase)
      const zipUrl = await uploadToStorage(zipBuffer); // Replace with your own logic

      res.status(200).json({ zipUrl });
    });

    archive.pipe(zipStream);

    for (const file of files) {
      const { siteId, driveId, itemId, name } = file;

      const downloadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}/content`;

      const response = await axios.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'stream'
      });

      archive.append(response.data, { name: name || `${itemId}.file` });
    }

    archive.finalize();
  } catch (err) {
    console.error('Zipping error:', err.response?.data || err.message);
    res.status(500).send('Failed to zip and send files');
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
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  return response.data.access_token;
}

// STUB: Replace this with actual upload logic to a CDN or cloud host
async function uploadToStorage(zipBuffer) {
  // Placeholder: You must implement your own zip file hosting logic
  // e.g., upload to S3, Vercel Blob, Firebase Storage, etc.
  throw new Error('uploadToStorage() is not implemented yet');
}
