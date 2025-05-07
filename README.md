# OpenAI LLM Integration Service

This is a Node.js service that provides an API for integrating with OpenAI's LLM models.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns the service status

### Chat Completion
- **POST** `/api/chat`
- Request body:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ]
}
```
- Returns the AI model's response

### Image Generation
- **POST** `/api/generate-image`
- Request body:
```json
{
  "prompt": "A serene landscape with mountains and a lake",
  "n": 1,
  "size": "1024x1024"
}
```
- Parameters:
  - `prompt` (required): Description of the image you want to generate
  - `n` (optional): Number of images to generate (default: 1)
  - `size` (optional): Image size (default: "1024x1024", options: "1024x1024", "1024x1792", "1792x1024")
- Returns an array of image URLs

## Security Note
Make sure to:
1. Never commit your `.env` file
2. Keep your API key secure
3. Implement proper authentication in production 