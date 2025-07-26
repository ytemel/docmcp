// DOM Elements
const docUrlInput = document.getElementById('docUrl');
const convertBtn = document.getElementById('convertBtn');
const urlError = document.getElementById('urlError');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const statusMessage = document.getElementById('statusMessage');
const emptyState = document.getElementById('emptyState');
const resultsContent = document.getElementById('resultsContent');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCount = document.getElementById('resultsCount');
const resultsGrid = document.getElementById('resultsGrid');

// State Management
let isProcessing = false;
let currentResults = [];
let retryCount = 0;
let lastUrl = '';

// Error Alert Banner
let errorBanner = null;

// Initialize Theme
function initTheme() {
    const savedTheme = localStorage.getItem('docmcp-theme') || 'light';
    document.body.className = savedTheme + '-theme';
    updateThemeIcon(savedTheme);
}

// Update Theme Icon
function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
}

// Toggle Theme
function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.className = newTheme + '-theme';
    localStorage.setItem('docmcp-theme', newTheme);
    updateThemeIcon(newTheme);
}

// Error Banner Management
function showErrorBanner(message, showRetry = false) {
    hideErrorBanner(); // Remove any existing banner
    
    errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.innerHTML = `
        <div class="error-content">
            <span class="error-icon">❌</span>
            <span class="error-message">${message}</span>
            ${showRetry ? '<button class="retry-button" onclick="retryConversion()">Retry</button>' : ''}
            <button class="close-banner" onclick="hideErrorBanner()">✕</button>
        </div>
    `;
    
    document.body.insertBefore(errorBanner, document.body.firstChild);
}

function hideErrorBanner() {
    if (errorBanner) {
        errorBanner.remove();
        errorBanner = null;
    }
}

// Enhanced Error Handling
function handleError(error, stage = 'conversion') {
    console.error(`Error during ${stage}:`, error);
    
    let errorMessage = 'Something went wrong. Please try again.';
    let showRetry = true;
    
    // Handle structured error responses from backend
    if (error.response && error.response.category) {
        const { category, message, stage: errorStage } = error.response;
        
        switch (category) {
            case 'validation':
                errorMessage = message || 'Invalid input. Please check your URL.';
                showRetry = false;
                break;
            case 'timeout':
                errorMessage = message || 'Request timed out. The site might be too large.';
                break;
            case 'not_found':
                errorMessage = message || 'Website not found. Please check the URL.';
                showRetry = false;
                break;
            case 'forbidden':
                errorMessage = message || 'Access denied. The website blocks crawling.';
                showRetry = false;
                break;
            case 'network':
                errorMessage = message || 'Network error. Check your connection.';
                break;
            case 'rate_limit':
                errorMessage = message || 'Rate limit exceeded. Please try again later.';
                showRetry = false;
                break;
            case 'no_content':
                errorMessage = message || 'No content found on this website.';
                showRetry = false;
                break;
            case 'llm':
            case 'auth':
            case 'quota':
            case 'content_policy':
                errorMessage = message || 'AI service error. Please try again.';
                break;
            case 'no_results':
                errorMessage = message || 'Conversion completed but generated no results.';
                break;
            case 'connection':
                errorMessage = message || 'Cannot connect to services. Check internet connection.';
                break;
            case 'memory':
                errorMessage = message || 'Website too large to process.';
                showRetry = false;
                break;
            default:
                errorMessage = message || 'An unexpected error occurred.';
        }
        
        // Update stage for status message
        if (errorStage) {
            stage = errorStage;
        }
    } else {
        // Fallback to legacy error categorization
        if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Check your connection and try again.';
        } else if (error.message.includes('crawl') || stage === 'crawl') {
            errorMessage = 'Failed during website crawling. The site might be unavailable.';
        } else if (error.message.includes('LLM') || error.message.includes('OpenAI') || stage === 'conversion') {
            errorMessage = 'Failed during LLM transformation. Please try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. The site might be too large.';
        }
    }
    
    // Show different message for second retry attempt
    if (retryCount >= 1) {
        errorMessage = 'Still not working. Try again later or check the URL.';
        showRetry = false;
    }
    
    showErrorBanner(errorMessage, showRetry);
    updateStatus(`Error: ${errorMessage}`, 'error');
    showEmptyState();
}

// Retry Mechanism
function retryConversion() {
    retryCount++;
    hideErrorBanner();
    
    if (lastUrl) {
        // Reset state and retry with the same URL
        docUrlInput.value = lastUrl;
        handleConversion();
    }
}

// Reset retry count on successful operation
function resetRetryState() {
    retryCount = 0;
    hideErrorBanner();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    themeToggle.addEventListener('click', toggleTheme);
    convertBtn.addEventListener('click', handleConversion);
    docUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !convertBtn.disabled) {
            handleConversion();
        }
    });
    docUrlInput.addEventListener('input', handleInputChange);
    updateButtonState(); // Initial button state
});

// Validation Functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Clear input errors
function clearError() {
    docUrlInput.classList.remove('error');
    urlError.style.display = 'none';
    hideErrorBanner();
}

// Show input error
function showError(message) {
    docUrlInput.classList.add('error');
    urlError.textContent = message;
    urlError.style.display = 'block';
}

// Handle input changes
function handleInputChange() {
    clearError();
    updateButtonState();
}

// Update button state based on input and processing
function updateButtonState() {
    const hasValue = docUrlInput.value.trim().length > 0;
    convertBtn.disabled = !hasValue || isProcessing;
}

// Update status message
function updateStatus(message, type = 'default') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Update button loading state
function updateButtonLoading(loading) {
    const buttonText = convertBtn.querySelector('.button-text');
    const buttonSpinner = convertBtn.querySelector('.button-spinner');
    
    if (loading) {
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'flex';
    } else {
        buttonText.style.display = 'block';
        buttonSpinner.style.display = 'none';
    }
}

// Show empty state
function showEmptyState() {
    emptyState.style.display = 'flex';
    resultsContent.style.display = 'none';
}

// Show results
function showResults() {
    emptyState.style.display = 'none';
    resultsContent.style.display = 'block';
}

// Enhanced conversion handler with better error handling
async function handleConversion() {
    const url = docUrlInput.value.trim();
    
    // Validate input
    if (!url) {
        showError('Please enter a documentation URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL');
        return;
    }
    
    // Store URL for retry mechanism
    lastUrl = url;
    
    // Start processing
    isProcessing = true;
    clearError();
    updateButtonState();
    updateButtonLoading(true);
    updateStatus('Crawling website and converting to LLM-friendly format...', 'processing');
    
    try {
        // Make API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
        
        const response = await fetch('/api/crawl-and-convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.message || 'Conversion failed');
            error.response = errorData; // Attach structured error data
            throw error;
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Conversion was not successful');
        }
        
        // Success - reset retry state and show results
        resetRetryState();
        currentResults = data.results;
        displayResults(data);
        updateStatus(`Successfully converted ${data.totalPages} page${data.totalPages !== 1 ? 's' : ''}`, 'success');
        
    } catch (error) {
        if (error.name === 'AbortError') {
            handleError(new Error('Request timed out'), 'timeout');
        } else {
            handleError(error, 'conversion');
        }
    } finally {
        isProcessing = false;
        updateButtonState();
        updateButtonLoading(false);
    }
}

// Display results with zip download option
function displayResults(data) {
    showResults();
    
    resultsTitle.textContent = 'Conversion Results';
    resultsCount.textContent = `${data.totalPages} page${data.totalPages !== 1 ? 's' : ''}`;
    
    // Add zip download button to results header
    addZipDownloadButton(data.totalPages);
    
    // Clear previous results
    resultsGrid.innerHTML = '';
    
    // Populate results
    data.results.forEach((result, index) => {
        const resultCard = createResultCard(result, index);
        resultsGrid.appendChild(resultCard);
    });
}

// Add zip download button to results header
function addZipDownloadButton(totalPages) {
    // Remove existing zip button if present
    const existingZipButton = document.querySelector('.zip-download-button');
    if (existingZipButton) {
        existingZipButton.remove();
    }
    
    const zipButton = document.createElement('button');
    zipButton.className = 'zip-download-button';
    zipButton.innerHTML = `
        <span class="zip-text">Download All (.zip)</span>
        <div class="zip-spinner" style="display: none;">
            <svg class="spinner" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10"/>
            </svg>
        </div>
    `;
    
    zipButton.addEventListener('click', () => downloadAllAsZip());
    
    // Insert after the results count
    resultsCount.parentNode.insertBefore(zipButton, resultsCount.nextSibling);
}

// Download all results as ZIP
async function downloadAllAsZip() {
    if (!currentResults || currentResults.length === 0) {
        showErrorBanner('No results to download');
        return;
    }
    
    const zipButton = document.querySelector('.zip-download-button');
    const zipText = zipButton.querySelector('.zip-text');
    const zipSpinner = zipButton.querySelector('.zip-spinner');
    
    try {
        // Show loading state
        zipText.style.display = 'none';
        zipSpinner.style.display = 'flex';
        zipButton.disabled = true;
        
        // Dynamically import JSZip
        const { default: JSZip } = await import('/node_modules/jszip/dist/jszip.min.js');
        
        const zip = new JSZip();
        
        // Create README.md with summary
        const readme = createReadmeContent();
        zip.file('README.md', readme);
        
        // Add each result as a markdown file
        currentResults.forEach((result, index) => {
            const filename = sanitizeFilename(`${String(index + 1).padStart(2, '0')}_${result.title}.md`);
            
            const fileContent = `# ${result.title}

**Source URL:** ${result.url}
**Generated:** ${new Date().toISOString()}

---

${result.markdown}

---

*Generated by DocMCP - LLM Documentation Converter*`;
            
            zip.file(filename, fileContent);
        });
        
        // Generate and download the zip
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `docmcp-results-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        // Show success feedback
        updateStatus(`Successfully downloaded ${currentResults.length} files as ZIP`, 'success');
        
    } catch (error) {
        console.error('Zip download error:', error);
        showErrorBanner('Failed to create ZIP file. Please try again.');
    } finally {
        // Reset button state
        zipText.style.display = 'block';
        zipSpinner.style.display = 'none';
        zipButton.disabled = false;
    }
}

// Create README content for ZIP
function createReadmeContent() {
    const now = new Date().toISOString();
    const totalPages = currentResults.length;
    const sourceUrl = lastUrl;
    
    return `# DocMCP Conversion Results

**Generated:** ${now}
**Source URL:** ${sourceUrl}
**Total Pages:** ${totalPages}

## Overview

This ZIP archive contains ${totalPages} Markdown files converted from the documentation website using DocMCP's LLM-optimized transformation process.

## File Structure

- \`README.md\` - This overview file
- \`01_[title].md\` - Individual documentation pages (numbered sequentially)

## About the Conversion

Each Markdown file has been processed through:
1. **Firecrawl crawling** - Extracted structured content from the web
2. **LLM transformation** - Converted to clean, LLM-friendly format
3. **Quality optimization** - Structured for better AI comprehension

## File Contents

Each file includes:
- Original page title and URL
- Generation timestamp
- Clean, structured Markdown content
- Optimized formatting for LLM consumption

---

*Generated by DocMCP - LLM Documentation Converter*
*https://github.com/your-repo/docmcp*
`;
}

// Create individual result cards
function createResultCard(result, index) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    card.innerHTML = `
        <div class="result-header">
            <div class="result-info">
                <h4 class="result-title">${escapeHtml(result.title)}</h4>
                <a href="${result.url}" target="_blank" class="result-url">${result.url}</a>
            </div>
            <div class="result-actions">
                <button class="action-button" onclick="copyMarkdown(${index})">Copy</button>
                <button class="action-button" onclick="downloadMarkdown(${index})">Download</button>
                <button class="action-button primary" onclick="toggleMarkdown(${index})">Preview</button>
            </div>
        </div>
        <div class="markdown-preview" id="preview-${index}">
            <button class="markdown-toggle" onclick="toggleMarkdown(${index})">
                <span>Show Markdown Content</span>
                <span class="toggle-icon">▼</span>
            </button>
            <div class="markdown-content" id="content-${index}">
                ${escapeHtml(result.markdown)}
            </div>
        </div>
    `;
    
    return card;
}

// Toggle markdown preview
function toggleMarkdown(index) {
    const preview = document.getElementById(`preview-${index}`);
    const content = document.getElementById(`content-${index}`);
    const toggle = preview.querySelector('.markdown-toggle span:first-child');
    const icon = preview.querySelector('.toggle-icon');
    
    const isExpanded = preview.classList.contains('expanded');
    
    if (isExpanded) {
        preview.classList.remove('expanded');
        toggle.textContent = 'Show Markdown Content';
        icon.textContent = '▼';
    } else {
        preview.classList.add('expanded');
        toggle.textContent = 'Hide Markdown Content';
        icon.textContent = '▲';
    }
}

// Copy markdown to clipboard
async function copyMarkdown(index) {
    const result = currentResults[index];
    if (!result) return;
    
    try {
        await navigator.clipboard.writeText(result.markdown);
        updateStatus('Markdown copied to clipboard!', 'success');
        
        // Brief visual feedback
        setTimeout(() => {
            if (statusMessage.classList.contains('success')) {
                updateStatus('Ready to convert documentation', 'default');
            }
        }, 2000);
    } catch (error) {
        showErrorBanner('Failed to copy to clipboard');
    }
}

// Download individual markdown file
function downloadMarkdown(index) {
    const result = currentResults[index];
    if (!result) return;
    
    const filename = sanitizeFilename(`${result.title}.md`);
    const content = `# ${result.title}

**Source URL:** ${result.url}
**Generated:** ${new Date().toISOString()}

---

${result.markdown}

---

*Generated by DocMCP - LLM Documentation Converter*`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sanitize filename for download
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-z0-9\-_\.]/gi, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 100); // Limit length
}

// Reset form (for error retry)
function resetForm() {
    docUrlInput.value = '';
    clearError();
    showEmptyState();
    updateButtonState();
    resetRetryState();
}

// Global functions for onclick handlers
window.toggleMarkdown = toggleMarkdown;
window.copyMarkdown = copyMarkdown;
window.downloadMarkdown = downloadMarkdown;
window.resetForm = resetForm;
window.retryConversion = retryConversion;
window.hideErrorBanner = hideErrorBanner; 