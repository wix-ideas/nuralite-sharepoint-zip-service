import JSZip from 'jszip';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // ALLOW ONLY POST REQUESTS
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed, use POST' });
    return;
  }

  try {
    const { files } = req.body; 
    // files expected: [{ name: 'filename.pdf', url: 'https://...' }, ...]

    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }

    const zip = new JSZip();

    // FETCH ALL FILES IN PARALLEL
    await Promise.all(
      files.map(async (file) => {
        const response = await fetch(file.url, {
          headers: {
            // Add any authorization headers SharePoint needs here
            // 'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${file.url} - Status ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        zip.file(file.name, buffer);
      })
    );

    // GENERATE ZIP CONTENT
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    // SET RESPONSE HEADERS TO TRIGGER DOWNLOAD
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
    res.setHeader('Content-Length', zipContent.length);

    res.status(200).send(zipContent);

  } catch (error) {
    console.error('Error in zip-files:', error);
    res.status(500).json({ error: error.message });
  }
}
