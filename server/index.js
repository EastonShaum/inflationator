require('dotenv').config();  // Load environment variables

const express = require('express');
const vision = require('@google-cloud/vision');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Initialize Google Cloud Vision client with credentials from .env
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,  // Use the path from the .env file
});

app.use(bodyParser.json({ limit: '10mb' }));

// Endpoint to receive image from frontend
app.post('/upload', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    const [result] = await client.textDetection({
      image: { content: imageBase64 },
    });

    const detections = result.textAnnotations;
    res.json(detections);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing the image.');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
