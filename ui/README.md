# DocMCP Web UI

A beautiful web interface for the LLM-Optimized Documentation Converter built with the Stripe design system.

## 🚀 Quick Start

### From the main project directory:

```bash
# Install UI dependencies
npm run ui:install

# Start the UI server
npm run ui
```

### From the ui directory:

```bash
# Install dependencies
npm install

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

## 🌐 Usage

1. **Open your browser** to `http://localhost:3000`
2. **Enter a documentation URL** in the input field
3. **Click "Go!"** to start the conversion process
4. **View results** - Each converted page includes:
   - Page title and source URL
   - View/Hide Markdown toggle
   - Copy to clipboard button
   - Download .md file button

## 🏗️ Architecture

### Frontend
- **Vanilla JavaScript** for simplicity and performance
- **Stripe-inspired design system** with precise color palettes and typography
- **Responsive design** that works on all devices
- **Real-time UI updates** during processing

### Backend
- **Express.js** server handling API requests
- **Integrated Firecrawl MCP** for documentation crawling
- **ChatGPT API integration** for markdown conversion
- **RESTful API** design with proper error handling

### API Endpoints

- `GET /` - Serves the main HTML interface
- `POST /api/crawl-and-convert` - Processes documentation URLs
- `GET /api/health` - Health check endpoint

## 🎨 Design System

The UI follows the Stripe design system patterns:

### Colors
- **Primary**: `#6772E5` (Stripe violet)
- **Secondary**: `#00D4AA` (Teal accent)
- **Neutral**: Gray scale from `#F7FAFC` to `#171923`
- **Success**: `#48BB78`
- **Error**: `#F56565`

### Typography
- **Font**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Hierarchy**: H1 (4rem) → H2 (3rem) → H3 (1.5rem) → Body (1rem)
- **Colors**: Dark headers, medium gray body text

### Components
- **Input fields**: Clean white background with focus states
- **Buttons**: Gradient backgrounds with hover animations
- **Cards**: Subtle shadows with hover elevation
- **Loading states**: Animated spinners with smooth transitions

## 🔧 Customization

### Change Documentation URL Processing
Edit `ui/server.js` to modify the crawling parameters:

```javascript
// In the DocumentationCrawler.startCrawl call
const crawlId = await crawler.startCrawl(url, {
  limit: 50,  // Change crawl limit
  scrapeOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: true
  }
});
```

### Modify UI Styling
Update `ui/public/styles.css` to change visual appearance:

```css
/* Example: Change primary color */
.convert-button {
  background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR_DARK 100%);
}
```

### Add New Features
Extend `ui/public/app.js` for additional functionality:

```javascript
// Example: Add bulk download feature
function downloadAllMarkdown() {
  // Implementation here
}
```

## 📁 Project Structure

```
ui/
├── public/
│   ├── index.html      # Main HTML interface
│   ├── styles.css      # Stripe design system styling  
│   └── app.js          # Frontend JavaScript logic
├── api/
│   └── converter.js    # ChatGPT conversion logic
├── server.js           # Express server
├── package.json        # Dependencies and scripts
└── README.md           # This documentation
```

## 🔍 API Request Format

### Crawl and Convert Endpoint

**POST** `/api/crawl-and-convert`

```json
{
  "url": "https://docs.example.com"
}
```

**Response:**
```json
{
  "success": true,
  "totalPages": 5,
  "results": [
    {
      "title": "Page Title",
      "url": "https://docs.example.com/page1",
      "originalContent": "Raw markdown...",
      "markdown": "# Clean LLM-optimized markdown..."
    }
  ]
}
```

## 🚫 Error Handling

The UI gracefully handles various error scenarios:

- **Invalid URLs**: Client-side validation with user feedback
- **Network errors**: Server connection issues with retry options
- **API failures**: Firecrawl or ChatGPT API problems with error messages
- **Processing timeouts**: Long-running conversions with status updates

## 🔐 Security

- **API key protection**: Environment variables, not exposed to frontend
- **URL validation**: Both client and server-side validation
- **Rate limiting**: Built-in delays between API requests
- **CORS enabled**: Secure cross-origin request handling

## 🎯 Features

### ✅ Current Features
- URL input with validation
- Real-time conversion progress
- Markdown preview and download
- Copy to clipboard functionality
- Responsive design
- Error handling and recovery

### 🔮 Future Enhancements
- Batch URL processing
- Export as ZIP archive
- Custom prompt templates
- Conversion history
- User preferences
- API usage analytics

Perfect for transforming any documentation into LLM-friendly format with a beautiful, intuitive interface! 🚀 