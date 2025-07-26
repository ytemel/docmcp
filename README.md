# DocMCP Prototype - Documentation Crawler

A simple prototype that crawls documentation websites using Firecrawl MCP and saves raw output to a JavaScript file.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the crawling prototype:**
   ```bash
   npm start
   # or
   node prototype.js
   ```

3. **Convert to LLM-optimized Markdown:**
   ```bash
   npm run convert
   # or
   node convert-to-md.js
   ```

4. **Check the outputs:**
   - Raw crawled data: `output/output.js`
   - LLM-optimized Markdown: `output/chatgpt-output.js`

## 📁 Project Structure

```
/
├── .env                    # API keys (not tracked in git)
├── package.json            # Dependencies and scripts
├── prototype.js            # Main crawler script
├── convert-to-md.js        # ChatGPT conversion script
├── .gitignore             # Git ignore rules
└── output/                # Generated output directory
    ├── output.js          # Raw Firecrawl response
    └── chatgpt-output.js  # LLM-optimized Markdown
```

## ⚙️ Configuration

- **Documentation URL:** Currently hardcoded to `https://developers.trendyol.com/docs/intro`
- **API Keys:** Set in `.env` file (Firecrawl + OpenAI)
- **Crawl Limit:** 50 pages (configurable in `prototype.js`)
- **ChatGPT Model:** GPT-4o (configurable in `convert-to-md.js`)

## 📝 Output Formats

**Raw Crawl Output** (`output/output.js`):
```javascript
export const firecrawlOutput = {
  // Raw Firecrawl MCP response with all crawled pages
};
```

**LLM-Optimized Output** (`output/chatgpt-output.js`):
```javascript
export const chatgptMarkdownOutput = [
  {
    title: "Page Title",
    url: "https://...",
    originalContent: "Raw markdown...",
    markdown: "# Clean LLM-optimized markdown..."
  }
];
```

## 🔧 Customization

To crawl a different documentation site, modify the `DOCUMENTATION_URL` variable in `prototype.js`:

```javascript
const DOCUMENTATION_URL = 'https://your-docs-site.com';
```

## ⚡ Features

- ✅ Real-time crawling with Firecrawl MCP
- ✅ Progress tracking during crawl
- ✅ Raw output preservation
- ✅ Error handling and logging
- ✅ Web UI with Stripe design system
- ✅ ChatGPT integration for LLM optimization
- ✅ Complete end-to-end pipeline

## 🌐 Web Interface

**NEW**: A beautiful web interface is now available!

```bash
# Start the web UI
npm run ui
# Open http://localhost:3000
```

### Features:
- **Stripe-inspired design**: Professional, modern interface
- **Real-time processing**: Live updates during crawl and conversion
- **Interactive results**: View, copy, and download converted Markdown
- **Input validation**: URL verification and error handling
- **Responsive design**: Works on all devices 