# Nuralite SharePoint Zip Service

This is a serverless Node.js API designed to fetch multiple files from SharePoint URLs, bundle them into a single ZIP file, and return the zipped file for download.

## Features

- Fetch multiple files from given URLs (e.g., SharePoint files)
- Bundle files into a ZIP archive using `JSZip`
- Stream the ZIP file as a response for download
- Easily deployable on Vercel as a serverless function

## Requirements

- Node.js environment (handled by Vercel)
- Access to the SharePoint files with proper authentication
- `jszip` and `node-fetch` packages installed

## Setup & Deployment

1. Clone the repository or create a new Vercel project linked to this repo.
2. Ensure dependencies are installed (`jszip`, `node-fetch`).
3. Add SharePoint authentication tokens or credentials as environment variables in Vercel.
4. Deploy the project on Vercel.

## Usage

Send a POST request to `/api/zip-files` endpoint with the JSON payload:

```json
{
  "files": [
    { "name": "file1.pdf", "url": "https://sharepoint-site/file1.pdf" },
    { "name": "file2.docx", "url": "https://sharepoint-site/file2.docx" }
  ]
}
