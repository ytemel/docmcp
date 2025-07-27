import OpenAI from 'openai';

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

export class ChatGPTMarkdownConverter {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
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
        temperature: 0.1
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
} 