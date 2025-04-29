require('dotenv').config();  // Load environment variables
const express = require('express');
const vision = require('@google-cloud/vision');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Initialize Express app
const app = express();
const port = 3000;

// MongoDB connection
const mongoURI = process.env.MONGO_URI; // MongoDB URI from .env
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Initialize Google Cloud Vision client with credentials from .env
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,  // Use the path from the .env file
});

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));

// MongoDB Schema for storing Vision data
const visionDataSchema = new mongoose.Schema({
  imageBase64: String,
  textAnnotations: [String],
  restaurantName: [String],
  timestamp: { type: Date, default: Date.now },
});

const VisionData = mongoose.model('VisionData', visionDataSchema);

// Endpoint to receive image from frontend and process using Google Vision API
app.post('/upload', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    console.log(req.body);

    // Send the image data to Google Vision API for text detection
    const [result] = await client.textDetection({
      image: { content: imageBase64 },
    });

    const detections = result.textAnnotations;
    const textAnnotations = detections.map((annotation) => annotation.description);

    // Save the Vision data to MongoDB
    const visionData = new VisionData({
      imageBase64,
      textAnnotations,
      restaurantName,
    });

    await visionData.save();

    // Return the detected text as a response
    res.json({ detections: textAnnotations, message: 'Data saved to MongoDB' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing the image.');
  }
});

// Endpoint to get all stored Vision data
app.get('/menus', async (req, res) => {
  try {
    const data = await VisionData.find(); // Fetch all documents from VisionData collection
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data from MongoDB.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
