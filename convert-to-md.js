import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const INPUT_FILE = './output/output.js';
const OUTPUT_FILE = './output/chatgpt-output.js';

// System prompt template
const SYSTEM_PROMPT = `You are a technical documentation transformer. Convert structured documentation data into a clean, self-contained Markdown file. The output must be:

- Structured with headers
- Easy to parse by LLMs
- No external references
- Human-readable, instructionally clear

Use this Markdown format:

# {Title}

## Overview  
Explain the feature's purpose and use cases.

## Setup / Integration  
Step-by-step usage or integration instructions.

## Parameters / Configuration  
Explain available parameters, options, and flags.

## Code Examples  
Include clean code blocks and explain them.

## Gotchas / Tips  
Highlight common issues or optimisation tips.

## Source Info  
- Original URL: {source_url}
- Category: {tag}`;

class ChatGPTMarkdownConverter {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.results = [];
  }

  async loadFirecrawlOutput() {
    try {
      console.log('📂 Loading Firecrawl output...');
      
      // Import the firecrawl output dynamically
      const fileUrl = new URL(INPUT_FILE, import.meta.url);
      const { firecrawlOutput } = await import(fileUrl.href);
      
      console.log(`✅ Loaded data with ${firecrawlOutput.data?.length || 0} pages`);
      return firecrawlOutput;
      
    } catch (error) {
      console.error('❌ Error loading Firecrawl output:', error.message);
      throw error;
    }
  }

  createUserPrompt(pageData) {
    const prompt = `Transform this documentation page into clean, structured Markdown:

TITLE: ${pageData.metadata?.title || 'Untitled'}
URL: ${pageData.metadata?.sourceURL || pageData.url || 'Unknown'}
CONTENT: ${pageData.markdown || pageData.content || ''}

Please follow the exact format specified in the system prompt. Make sure to:
1. Extract the main purpose and use cases
2. Identify setup/integration steps
3. List parameters and configuration options
4. Include relevant code examples
5. Note any important tips or gotchas
6. Include source information

Return ONLY the formatted Markdown content, no additional commentary.`;

    return prompt;
  }

  async convertPageToMarkdown(pageData, index) {
    try {
      const userPrompt = this.createUserPrompt(pageData);
      
      console.log(`🤖 Converting page ${index + 1}: ${pageData.metadata?.title || 'Untitled'}`);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user", 
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1 // Low temperature for consistent formatting
      });

      const markdownContent = response.choices[0]?.message?.content;
      
      if (!markdownContent) {
        throw new Error('No content received from ChatGPT');
      }

      return {
        title: pageData.metadata?.title || 'Untitled',
        url: pageData.metadata?.sourceURL || pageData.url || 'Unknown',
        originalContent: pageData.markdown || pageData.content || '',
        markdown: markdownContent.trim()
      };

    } catch (error) {
      console.error(`❌ Error converting page ${index + 1}:`, error.message);
      
      // Return a fallback entry so we don't lose the page
      return {
        title: pageData.metadata?.title || 'Untitled',
        url: pageData.metadata?.sourceURL || pageData.url || 'Unknown',
        originalContent: pageData.markdown || pageData.content || '',
        markdown: `# ${pageData.metadata?.title || 'Untitled'}\n\n**Error:** Failed to convert this page with ChatGPT.\n\n**Original URL:** ${pageData.metadata?.sourceURL || pageData.url || 'Unknown'}`
      };
    }
  }

  async convertAllPages(firecrawlOutput) {
    console.log('🔄 Starting ChatGPT conversion process...');
    
    const pages = firecrawlOutput.data || [];
    
    if (pages.length === 0) {
      console.warn('⚠️ No pages found in Firecrawl output');
      return [];
    }

    console.log(`📄 Processing ${pages.length} pages...`);

    const results = [];
    
    // Process pages with a small delay to respect rate limits
    for (let i = 0; i < pages.length; i++) {
      const result = await this.convertPageToMarkdown(pages[i], i);
      results.push(result);
      
      // Add a small delay between requests (1 second)
      if (i < pages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Converted ${results.length} pages successfully`);
    return results;
  }

  async saveResults(results) {
    try {
      console.log('💾 Saving ChatGPT results...');
      
      // Create the output file content
      const fileContent = `// Generated by DocMCP ChatGPT Converter
// Conversion completed at: ${new Date().toISOString()}
// Total pages processed: ${results.length}

export const chatgptMarkdownOutput = ${JSON.stringify(results, null, 2)};
`;

      await fs.writeFile(OUTPUT_FILE, fileContent, 'utf8');
      
      console.log(`💾 ChatGPT results saved to: ${OUTPUT_FILE}`);
      console.log(`📊 Total conversions: ${results.length}`);
      
    } catch (error) {
      console.error('❌ Error saving results:', error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('🤖 DocMCP Prototype - ChatGPT Markdown Converter');
  console.log('=' .repeat(55));
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }

  const converter = new ChatGPTMarkdownConverter(OPENAI_API_KEY);
  
  try {
    // Load the Firecrawl output
    const firecrawlOutput = await converter.loadFirecrawlOutput();
    
    // Convert all pages using ChatGPT
    const results = await converter.convertAllPages(firecrawlOutput);
    
    // Save the results
    await converter.saveResults(results);
    
    console.log('🎉 ChatGPT conversion completed successfully!');
    console.log(`📁 Check the output: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('💥 Conversion failed:', error.message);
    process.exit(1);
  }
}

// Run the converter
main().catch(console.error); 