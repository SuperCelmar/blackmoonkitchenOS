<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sQa-TDEv230gqRmQ67fZZuUfWe6YWckl

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

This project is configured for easy deployment to Vercel.

### Quick Deploy

1. **Push your code to GitHub** (if not already done)

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the Vite configuration

3. **Configure Environment Variables:**
   - In Vercel project settings, go to "Environment Variables"
   - Add `GEMINI_API_KEY` with your Gemini API key value
   - Apply to all environments (Production, Preview, Development)

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Manual Deploy via Vercel CLI

Alternatively, you can deploy using the Vercel CLI:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### Environment Variables

Make sure to set the following environment variable in Vercel:
- `GEMINI_API_KEY`: Your Google Gemini API key

The app will be available at a URL like: `https://your-project-name.vercel.app`
