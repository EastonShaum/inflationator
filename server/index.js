require('dotenv').config();
const express = require('express');
const vision = require('@google-cloud/vision');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('Error connecting to MongoDB:', err));

// Initialize Google Cloud Vision
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));

// Schema (no imageBase64)
const visionDataSchema = new mongoose.Schema({
  textAnnotations: [String],
  restaurantName: [String],
  timestamp: { type: Date, default: Date.now },
});

const VisionData = mongoose.model('VisionData', visionDataSchema);

// POST /upload
app.post('/upload', async (req, res) => {
  try {
    const { imageBase64, restaurantName } = req.body;
    console.log('Image received from client.');

    const [result] = await client.textDetection({
      image: { content: imageBase64 },
    });

    const detections = result.textAnnotations;
    const textAnnotations = detections.map((annotation) => annotation.description);

    const visionData = new VisionData({
      textAnnotations,
      restaurantName: [restaurantName], // Placeholder if you're not extracting this yet
    });

    await visionData.save();

    res.json({ detections: textAnnotations, message: 'Data saved to MongoDB' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing the image.');
  }
});

// GET /menus (exclude imageBase64)
app.get('/menus', async (req, res) => {
  try {
    const data = await VisionData.find({}, '-imageBase64').sort({ timestamp: -1 }).lean();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data from MongoDB.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});