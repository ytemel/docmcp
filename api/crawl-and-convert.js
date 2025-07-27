// Main API route for crawl and convert  
import { DocumentationCrawler } from '../ui/crawler.js';
import { ChatGPTMarkdownConverter } from '../ui/converter.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    console.log('Starting conversion for:', url);
    
    const crawler = new DocumentationCrawler(process.env.FIRECRAWL_API_KEY);
    const converter = new ChatGPTMarkdownConverter(process.env.OPENAI_API_KEY);

    const crawlResult = await crawler.scrapeSingle(url);
    const markdownResults = await converter.processPages(crawlResult.data);

    res.status(200).json({
      success: true,
      totalPages: markdownResults.length,
      results: markdownResults,
      sourceUrl: url,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Conversion failed', message: error.message });
  }
}
