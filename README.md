# AI Image Generator

A full-stack application for generating images using OpenAI's GPT Image model.

## Project Structure

- `src/` - Node.js backend service
- `frontend/` - Streamlit frontend application

## Backend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variables in Vercel:
- `OPENAI_API_KEY`: Your OpenAI API key

## Frontend Deployment (Streamlit Cloud)

1. Create a new repository for the frontend code
2. Push the `frontend/` directory to the new repository
3. Go to [Streamlit Cloud](https://streamlit.io/cloud)
4. Create a new app and connect it to your repository
5. Set environment variables:
- `API_URL`: Your Vercel deployment URL (e.g., https://your-app.vercel.app)

## Local Development

### Backend

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

3. Start the server:
```bash
npm run dev
```

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Streamlit app:
```bash
streamlit run app.py
```

## Environment Variables

### Backend
- `OPENAI_API_KEY`: Your OpenAI API key

### Frontend
- `API_URL`: URL of the backend service (default: http://localhost:3000)

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