# DocMCP Single-Page UI - Quick Usage Guide

## 🚀 Getting Started

### 1. Start the Server
```bash
# Kill any existing server (if running)
pkill -f "node server.js"

# Start the UI server
npm run ui
```

### 2. Open in Browser
Navigate to: **http://localhost:3000**

---

## 💡 UI Overview

The new single-page interface fits perfectly in your browser window (100vh) with no scrolling:

### **Layout Structure:**
- **Header (15%)** - Logo + URL input + Go button
- **Theme Toggle** - Fixed top-right corner (☀️/🌙)
- **Status (10%)** - Processing messages and progress
- **Results (75%)** - Scrollable results panel

---

## 🎨 Features

### **Theme Toggle**
- **Light Mode**: ☀️ Clean, bright interface
- **Dark Mode**: 🌙 Dark, professional look
- **Persistent**: Theme choice saves automatically

### **Smart Input**
- **URL Validation**: Real-time validation feedback
- **Go Button**: Only enabled when valid URL entered
- **Enter Key**: Submit with keyboard shortcut

### **Real-Time Processing**
- **Live Status**: Watch crawling and conversion progress
- **Loading Animations**: Visual feedback during processing
- **Error Handling**: Clear error messages with retry options

### **Interactive Results**
- **Collapsible Cards**: Click to expand/collapse Markdown preview
- **Copy to Clipboard**: One-click copying with visual feedback
- **Download Files**: Save individual .md files
- **Scrollable Content**: Long results scroll within the results panel

---

## 🔧 How to Use

### **Convert Documentation:**

1. **Enter URL** in the input field
   - Example: `https://docs.stripe.com`
   - Real-time validation shows errors

2. **Click "Go!"** (or press Enter)
   - Button shows loading spinner
   - Status updates show progress

3. **View Results**
   - Each page appears as a card
   - Click "View" to expand Markdown preview
   - Use "Copy" or "Download" for each page

### **Theme Switching:**
- Click the ☀️/🌙 button in top-right corner
- Theme persists across browser sessions

### **Error Recovery:**
- Errors show in the status area
- Click "Go!" again to retry
- Input validation prevents common issues

---

## 🎯 Design System

### **Colors** (Auto-switching based on theme)
- **Light Theme**: Clean whites and grays with purple accents
- **Dark Theme**: Deep grays with bright text for readability

### **Typography**
- **System Fonts**: Fast loading, platform-native
- **Clear Hierarchy**: Different sizes for different content types
- **Monospace Code**: Markdown content in developer-friendly fonts

### **Interactions**
- **Hover Effects**: Subtle animations on interactive elements
- **Loading States**: Spinners and status updates
- **Focus States**: Clear keyboard navigation support

---

## 🚀 Benefits

### **Single-Page Design**
- ✅ **No Scrolling**: Everything fits in one screen
- ✅ **Fast Navigation**: No page reloads or routing
- ✅ **Responsive**: Works on all screen sizes

### **Professional UI**
- ✅ **Stripe-Inspired**: Clean, modern design language
- ✅ **Dark/Light Modes**: Comfortable viewing in any environment
- ✅ **Consistent Styling**: Design system ensures visual cohesion

### **Developer Experience**
- ✅ **Fast Processing**: Real-time status updates
- ✅ **Easy Export**: Copy or download converted Markdown
- ✅ **Error Handling**: Clear feedback and recovery options

---

## 🛠️ Customization

### **Change Colors**
Edit `ui/public/styles.css`:
```css
:root {
  --color-primary: #YOUR_COLOR; /* Change primary color */
}
```

### **Modify Layout Heights**
Update CSS variables:
```css
.header-section { height: 15vh; }     /* Header height */
.processing-section { height: 10vh; } /* Status height */
.results-section { height: 75vh; }    /* Results height */
```

### **Add Features**
Extend `ui/public/app.js`:
```javascript
// Example: Add bulk download
function downloadAllMarkdown() {
  // Your implementation
}
```

---

## 🎉 Perfect For

- **Quick Conversions**: Fast, one-screen workflow
- **Development**: Testing and iterating on documentation
- **Content Creation**: Converting docs for AI consumption
- **Team Use**: Professional interface for shared use

**Enjoy your LLM-optimized documentation converter!** 🚀 