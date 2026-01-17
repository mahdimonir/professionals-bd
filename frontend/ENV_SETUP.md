# ProfessionalsBD Frontend - Environment Variables

Copy this file and create `.env.local` in the root directory with your actual API keys:

```env
# ProfessionalsBD Backend API URL
NEXT_PUBLIC_API_URL=https://server.professionalsbd.vercel.app/api/v1

# Stream.io Video SDK
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key_here

# Google Generative AI (Gemini)
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
```

## Getting API Keys

### Stream.io
1. Sign up at https://getstream.io/
2. Create a new app
3. Copy the API key from the dashboard

### Google Generative AI (Gemini)
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

### Cloudinary
1. Sign up at https://cloudinary.com/
2. Find your cloud name in the dashboard
