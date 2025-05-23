require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to convert base64 to File object
async function toFile(base64String) {
  const buffer = Buffer.from(base64String.split(',')[1], 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });
  return new File([blob], 'image.png', { type: 'image/png' });
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    const { prompt, size = "1024x1024", n = 1, quality = "high", transparent = false, reference_images = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "Prompt is required"
      });
    }

    // Validate size parameter
    const validSizes = ["1024x1024", "1536x1024", "1024x1536"];
    if (!validSizes.includes(size)) {
      return res.status(400).json({
        error: "Invalid size parameter",
        details: "Size must be one of: 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait)"
      });
    }

    // Validate quality parameter
    if (!["low", "medium", "high"].includes(quality)) {
      return res.status(400).json({
        error: "Invalid quality parameter",
        details: "Quality must be one of: low, medium, high"
      });
    }

    // Validate reference images if provided
    if (reference_images.length > 0) {
      for (const image of reference_images) {
        if (!image.startsWith('data:image/')) {
          return res.status(400).json({
            error: "Invalid reference image",
            details: "All reference images must be valid base64 encoded images"
          });
        }
      }
    }
    
    console.log('Generating image with prompt:', prompt);
    console.log('Size:', size);
    console.log('Number of images:', n);
    console.log('Quality:', quality);
    console.log('Transparent:', transparent);
    console.log('Number of reference images:', reference_images.length);

    try {
      let response;
      if (reference_images.length > 0) {
        // Convert base64 images to File objects
        const imageFiles = await Promise.all(
          reference_images.map(async (base64Image) => {
            return await toFile(base64Image);
          })
        );

        // Use edit endpoint for reference images
        response = await openai.images.edit({
          model: "gpt-image-1",
          image: imageFiles[0], // Use only the first image for now
          prompt: prompt,
          n: n,
          size: size,
          quality: quality,
          ...(transparent && { background: "transparent" })
        });
      } else {
        // Use generate endpoint for no reference images
        response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt,
          n: n,
          size: size,
          quality: quality,
          ...(transparent && { background: "transparent" })
        });
      }

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

      // Return only the base64 images without saving to disk
      return res.json({ images });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return res.status(500).json({
        error: "OpenAI API Error",
        details: openaiError.message,
        type: openaiError.type,
        code: openaiError.code
      });
    }
  } catch (error) {
    console.error('Error in image generation:', error);
    return res.status(500).json({ 
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