import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import our existing logic
import { DocumentationCrawler } from '../prototype.js';
import { ChatGPTMarkdownConverter } from './api/converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Production security headers
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  
  // Remove powered by header
  app.disable('x-powered-by');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static file serving with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProduction ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// Serve node_modules for development (stagewise toolbar access)
if (!isProduction) {
  app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
}

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced API endpoint with better error categorization
app.post('/api/crawl-and-convert', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        category: 'validation',
        message: 'Please provide a valid documentation URL'
      });
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      // Check if URL uses HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        category: 'validation',
        message: 'Please enter a valid HTTP or HTTPS URL'
      });
    }

    console.log(`🚀 Starting crawl and convert for: ${url}`);

    // Step 1: Crawl with Firecrawl
    let crawler, crawlId, firecrawlResult;
    
    try {
      crawler = new DocumentationCrawler(process.env.FIRECRAWL_API_KEY);
      
      // Start crawl with timeout handling
      const crawlPromise = crawler.startCrawl(url);
      crawlId = await Promise.race([
        crawlPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Crawl initiation timeout')), 30000)
        )
      ]);
      
      console.log(`📋 Crawl initiated: ${crawlId}`);
      
      // Wait for completion with timeout
      const completionPromise = crawler.waitForCrawlCompletion(crawlId);
      firecrawlResult = await Promise.race([
        completionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Crawl completion timeout')), 300000)
        )
      ]);
      
    } catch (error) {
      console.error('❌ Crawl error:', error.message);
      
      let errorMessage = 'Failed to crawl website';
      let category = 'crawl';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Crawl request timed out. The website might be too large or slow.';
        category = 'timeout';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'Website not found. Please check the URL.';
        category = 'not_found';
      } else if (error.message.includes('403') || error.message.includes('forbidden')) {
        errorMessage = 'Access denied. The website blocks automated crawling.';
        category = 'forbidden';
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Network error. Please check your connection and the URL.';
        category = 'network';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        category = 'rate_limit';
      }
      
      return res.status(500).json({
        error: 'Crawl failed',
        category,
        message: errorMessage,
        stage: 'crawl'
      });
    }

    console.log(`✅ Crawl completed: ${firecrawlResult.data?.length || 0} pages`);

    if (!firecrawlResult.data || firecrawlResult.data.length === 0) {
      return res.status(422).json({
        error: 'No content found',
        category: 'no_content',
        message: 'No pages could be crawled from this website. It might be empty or protected.',
        stage: 'crawl'
      });
    }

    // Step 2: Convert with ChatGPT
    let markdownResults;
    
    try {
      const converter = new ChatGPTMarkdownConverter(process.env.OPENAI_API_KEY);
      
      // Convert with timeout handling
      const conversionPromise = converter.convertAllPages(firecrawlResult);
      markdownResults = await Promise.race([
        conversionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LLM conversion timeout')), 600000)
        )
      ]);
      
    } catch (error) {
      console.error('❌ Conversion error:', error.message);
      
      let errorMessage = 'Failed during LLM transformation';
      let category = 'llm';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'LLM conversion timed out. Too many pages to process.';
        category = 'timeout';
      } else if (error.message.includes('API key') || error.message.includes('unauthorized')) {
        errorMessage = 'AI service authentication failed. Please try again.';
        category = 'auth';
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'AI service quota exceeded. Please try again later.';
        category = 'quota';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'AI service rate limit exceeded. Please try again later.';
        category = 'rate_limit';
      } else if (error.message.includes('content policy')) {
        errorMessage = 'Content violates AI service policies.';
        category = 'content_policy';
      }
      
      return res.status(500).json({
        error: 'LLM conversion failed',
        category,
        message: errorMessage,
        stage: 'conversion'
      });
    }
    
    console.log(`✅ Conversion completed: ${markdownResults.length} pages`);

    // Validate results
    if (!markdownResults || markdownResults.length === 0) {
      return res.status(422).json({
        error: 'No results generated',
        category: 'no_results',
        message: 'LLM conversion completed but generated no results.',
        stage: 'conversion'
      });
    }

    // Return the results
    res.json({
      success: true,
      totalPages: markdownResults.length,
      results: markdownResults,
      sourceUrl: url,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error in crawl-and-convert:', error.message);
    
    // Handle unexpected errors
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let category = 'unexpected';
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      errorMessage = 'Cannot connect to external services. Check your internet connection.';
      category = 'connection';
    } else if (error.message.includes('Memory') || error.message.includes('heap')) {
      errorMessage = 'Server ran out of memory. The website might be too large.';
      category = 'memory';
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      category,
      message: errorMessage,
      stage: 'server'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'Something went wrong' : err.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🎯 DocMCP UI Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Export for Vercel
export default app; 