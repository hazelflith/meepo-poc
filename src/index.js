require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Helper function to save base64 image
async function saveBase64Image(base64String, index) {
  try {
    // Create images directory if it doesn't exist
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `image_${timestamp}_${index}.png`;
    const filepath = path.join(imagesDir, filename);

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64String.split(',')[1], 'base64');
    fs.writeFileSync(filepath, imageBuffer);

    return filepath;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages
    });

    res.json(completion.choices[0].message);
  } catch (error) {
    console.error('Error in chat completion:', error);
    res.status(500).json({ 
      error: "Failed to get chat completion",
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = "1024x1024", n = 1 } = req.body;
    
    console.log('Generating image with prompt:', prompt);
    console.log('Size:', size);
    console.log('Number of images:', n);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: n,
      size: size,
      quality: "hd",
      response_format: "b64_json"
    });

    console.log('OpenAI Response:', JSON.stringify(response, null, 2));

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data in response');
    }

    const images = response.data.map(item => {
      if (!item.b64_json) {
        throw new Error('Missing b64_json in response data');
      }
      return `data:image/png;base64,${item.b64_json}`;
    });

    // Save images and get file paths
    const savedFiles = await Promise.all(
      images.map((base64Image, index) => saveBase64Image(base64Image, index))
    );

    res.json({ images, savedFiles });
  } catch (error) {
    console.error('Error in image generation:', error);
    res.status(500).json({ 
      error: "Failed to generate image",
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the Express API
module.exports = app; 