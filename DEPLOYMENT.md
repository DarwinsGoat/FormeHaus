# FormeHaus Website - Deployment Guide

## Overview
This website is set up for deployment on Netlify with serverless functions for the quote form.

## Prerequisites
- A Netlify account (free tier works fine)
- An email service for sending quote notifications (Gmail, SendGrid, Mailgun, etc.)

## Deployment Steps

### 1. Push to Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GIT_REPO_URL
git push -u origin main
```

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard
1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command:** Leave empty (no build needed)
   - **Publish directory:** `.` (root directory)
   - **Functions directory:** `netlify/functions`
5. Click "Deploy site"

#### Option B: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 3. Configure Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

#### For Gmail (Recommended for testing):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OWNER_EMAIL=your-email@gmail.com
```

**Note:** For Gmail, you need to create an App Password:
1. Go to your Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use this password for `SMTP_PASS`

#### For SendGrid (Recommended for production):
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
OWNER_EMAIL=your-email@example.com
```

### 4. Test the Quote Form

1. Visit your deployed site
2. Navigate to the "Get a Quote" section
3. Fill out the form with test data
4. Upload a small .stl or .obj file
5. Submit and verify you receive both emails:
   - Confirmation email to the customer
   - Quote request notification to your business email

## Local Testing

### Install Netlify Dev
```bash
npm install -g netlify-cli
```

### Create .env file
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### Run locally
```bash
netlify dev
```

The site will be available at `http://localhost:8888`

## Troubleshooting

### Form submission fails
- Check browser console for errors
- Verify environment variables are set correctly in Netlify
- Check Netlify Functions logs in the dashboard

### Emails not sending
- Verify SMTP credentials are correct
- For Gmail, ensure "Less secure app access" is enabled or use App Password
- Check spam folder
- Review Netlify Functions logs for detailed errors

### File upload fails
- Ensure file is .stl or .obj format
- Check file size is under 250MB
- Verify browser supports File API

## Custom Domain

To use a custom domain:

1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow Netlify's instructions to configure DNS

## Support

For issues with:
- Netlify deployment: https://docs.netlify.com
- Email configuration: Check your email provider's SMTP documentation
- Website bugs: Contact the developer
