# Claude PDF Extractor - Vercel

Simple Vercel deployment for PDF extraction using Claude Vision API.

## Deploy to Vercel

1. **Fork/Clone this repo**
2. **Import to Vercel**
3. **Add environment variable:** `ANTHROPIC_API_KEY`
4. **Deploy!**

## Features

- 100% accuracy PDF extraction using Claude
- Drag & drop interface
- Serverless functions
- Minimal dependencies

## API

- `GET /` - Upload interface
- `POST /api/extract` - PDF extraction

## Environment Variables

- `ANTHROPIC_API_KEY` - Your Anthropic API key

## Tech Stack

- Vercel Serverless Functions
- Claude 3.5 Sonnet
- pdf-parse
- formidable