# Vercel Deployment Guide for Biology Word Breaker

## Prerequisites

1. **GitHub Account**: Create a GitHub account if you don't have one
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account
3. **Gemini API Key**: Get your API key from [ai.google.dev](https://ai.google.dev)

## Step-by-Step Deployment

### 1. Push Code to GitHub

1. **Create a new repository** on GitHub:
   - Go to github.com and click "New repository"
   - Name it `biology-word-breaker`
   - Make it public
   - Don't initialize with README (we already have one)

2. **Upload your files** to GitHub:
   - Upload all files: `index.html`, `app.js`, `api/index.js`, `vercel.json`, `README.md`, `.gitignore`
   - Or use GitHub's web interface to drag and drop files

### 2. Deploy on Vercel

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Repository**:
   - Find your `biology-word-breaker` repository
   - Click "Import"

3. **Configure Project**:
   - Project Name: `biology-word-breaker`
   - Framework Preset: Other
   - Root Directory: `./` (leave default)
   - Click "Deploy"

### 3. Add Database

1. **In Vercel Dashboard**:
   - Go to your deployed project
   - Click "Storage" tab
   - Click "Create Database"
   - Choose "Postgres"
   - Name: `biology-word-breaker-db`
   - Click "Create"

2. **Run Database Setup**:
   - Go to the "Query" tab in your database
   - Run these commands one by one:

```sql
CREATE TABLE IF NOT EXISTS word_breakdowns (
  id SERIAL PRIMARY KEY,
  original_word TEXT NOT NULL,
  prefix TEXT,
  prefix_meaning TEXT,
  root TEXT,
  root_meaning TEXT,
  suffix TEXT,
  suffix_meaning TEXT,
  combined_meaning TEXT,
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  search_term TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS popular_terms (
  id SERIAL PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 4. Set Environment Variables

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" tab
   - Click "Environment Variables"

2. **Add these variables**:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Google AI API key
   - **Environment**: Production, Preview, Development

   - **Name**: `DATABASE_URL`
   - **Value**: (Auto-filled when you created the database)

### 5. Redeploy

1. **Trigger Redeploy**:
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Your app should now be live!

## Your Live URL

After deployment, Vercel will provide you with a URL like:
`https://biology-word-breaker-yourusername.vercel.app`

## Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

## Troubleshooting

### Common Issues:

1. **API Key Not Working**:
   - Double-check the environment variable name: `GEMINI_API_KEY`
   - Ensure the API key is valid and has sufficient quota

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is set correctly
   - Check database tables are created properly

3. **Popular Terms Not Showing**:
   - Search for a few terms first to populate the database
   - Check browser console for any JavaScript errors

### Checking Logs:

1. **In Vercel Dashboard**:
   - Go to "Functions" tab
   - Click on any function to see logs
   - Or go to "Deployments" → Click deployment → "View Logs"

## Updates

To update your app:
1. Make changes to your files on GitHub
2. Vercel will automatically redeploy
3. Changes go live in ~30 seconds

Your Biology Word Breaker is now live and accessible to everyone!
