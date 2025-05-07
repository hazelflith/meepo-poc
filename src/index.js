require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    res.json(completion.choices[0].message);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Helper function to save base64 image to file
function saveBase64Image(base64String, filename) {
  try {
    // Remove the data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create images directory if it doesn't exist
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir);
    }

    // Save the image
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    console.log(`Image saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, n = 1, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating image with prompt:', prompt);
    console.log('Using model: gpt-image-1');

    // Using the correct API format for gpt-image-1
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: n,
      size: size,
      quality: "high",
    });

    console.log('Raw OpenAI response:', JSON.stringify(response, null, 2));

    if (!response.data) {
      console.error('No data in response:', response);
      throw new Error('No data in response from OpenAI');
    }

    if (!Array.isArray(response.data)) {
      console.error('Response data is not an array:', response.data);
      throw new Error('Invalid response format from OpenAI');
    }

    // Process and save each image
    const savedImages = await Promise.all(response.data.map(async (image, index) => {
      if (!image.b64_json) {
        console.error('Image object missing base64 data:', image);
        throw new Error('Base64 image data is missing in the response');
      }

      const base64String = `data:image/png;base64,${image.b64_json}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `image_${timestamp}_${index + 1}.png`;
      
      const filePath = saveBase64Image(base64String, filename);
      return {
        base64: base64String,
        filePath: filePath
      };
    }));

    console.log('Successfully processed and saved images');
    res.json({ 
      images: savedImages.map(img => img.base64),
      savedFiles: savedImages.map(img => img.filePath)
    });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 