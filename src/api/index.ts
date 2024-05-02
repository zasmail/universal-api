import express from 'express';
import request from 'request';
import fs from 'fs';
import path from 'path'; // Import the path module to handle file paths

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import { token } from 'morgan';

const router = express.Router();

// ------------------------------
// ------------------------------
// 
// ENDPONTS
// 
// ------------------------------
// ------------------------------
router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);

// router.get<{}, MessageResponse>('/', (req, res) => {
router.get('/downloadDoc', (req, res) => {
  const { workflowId, documentId } = req.query;
  const token = "B9NMNxRzOx9XQdMlKd9OGXuDNP2l6rpzhaPc7N_eD34g";

  downloadDocument(workflowId as string, documentId as string, token as string)
    .then((filePath: string) => {
      res.download(filePath, 'downloaded_document.docx');
    })
    .catch((error: Error) => {
      console.error(error);
      res.status(500).json({ error: 'Failed to download document' });
    });
});

router.put('/pushDoc/:versionId', async (req, res) => {
  const versionId = req.params.versionId;
  const fileName = 'downloaded_document.docx';
  const filePath = path.join(__dirname, '..', 'downloads', fileName);

  try {
    await pushDocument(versionId, filePath);
    res.status(200).json({ message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Failed to upload document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// ------------------------------
// ------------------------------
// 
// Functionality 
// 
// ------------------------------
// ------------------------------
function downloadDocument(workflowId: string, documentId: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://demo.ironcladapp.com/public/api/v1/workflows/${workflowId}/document/${documentId}/download`;

    const fileName = 'downloaded_document.docx';
    const savePath = path.join(__dirname, '..', 'downloads', fileName);

    const fileStream = fs.createWriteStream(savePath, { encoding: 'binary' });

    const options = {
      method: 'GET',
      url: url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': 'connect.sid=s%3ABJWPEG7MVUmh3Ib155bq6Y0g5vuYslf_.XP1uSqw4STObsJTErwOKnbpqibTsjbDNLvgBSSMgdEE'
      }
    };

    request(options)
      .on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download document: ${response.statusCode} - ${response.statusMessage}`));
        }
      })
      .on('error', (error) => {
        console.error('Failed to download document:', error);
        reject(error);
      })
      .pipe(fileStream)
      .on('finish', () => {
        console.log('Document saved successfully');
        resolve(savePath);
      })
      .on('error', (error) => {
        console.error('Failed to save document:', error);
        reject(error);
      });
  });
}

function pushDocument(versionId: string, filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);

    const formData = {
      'file': {
        'value': fs.createReadStream(filePath),
        'options': {
          'filename': fileName,
          'contentType': null
        }
      },
      'type': 'html'
    };

    const options = {
      method: 'PUT',
      url: `https://api.demo.pactsafe.com/v1.1/versions/${versionId}/upload`,
      headers: {
        'Authorization': 'Bearer rbWWjlZMbsYOJ45mjZgxn~aI0fwlbD12KaC1uYLEhm4_'
      },
      formData: formData
    };

    request(options, (error, response) => {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }
      console.log(response.body);
      resolve(response);
    });
  });
}

export default router;
