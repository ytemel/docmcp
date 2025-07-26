# DocMCP Deployment Guide 🚀

Complete guide to deploy your DocMCP application to a custom domain with various hosting providers.

---

## 🎯 **Recommended Deployment Options**

### **Option 1: Vercel (Recommended - Easy & Free)** ⭐
**Best for**: Quick deployment, excellent performance, generous free tier

### **Option 2: Railway (Simple Node.js hosting)** 🚂
**Best for**: Simple setup, fair pricing, great for Node.js apps

### **Option 3: Render (Free tier available)** 🎨
**Best for**: Cost-conscious deployment with good features

### **Option 4: DigitalOcean App Platform** 🌊
**Best for**: Production applications, more control

---

## 🔧 **Pre-Deployment Setup**

### **1. Production Optimizations**

Create a production-ready server configuration:

```javascript
// ui/server.js - Add these optimizations
const isProduction = process.env.NODE_ENV === 'production';

// Remove development-only features in production
if (!isProduction) {
  app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
}

// Add security headers for production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}
```

### **2. Environment Variables Setup**

You'll need these environment variables:

```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
PORT=3000
```

### **3. Package.json Scripts** 

Update your `ui/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'Build complete'",
    "postinstall": "echo 'Dependencies installed'"
  }
}
```

---

## 🚀 **Option 1: Vercel Deployment (Recommended)**

### **Why Vercel?**
- ✅ Excellent Node.js support
- ✅ Automatic HTTPS with custom domains
- ✅ Global CDN
- ✅ Generous free tier
- ✅ Easy GitHub integration

### **Step-by-Step Deployment:**

1. **Prepare for Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Create vercel.json in project root
```

2. **Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "ui/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "ui/public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "ui/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "ui/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy:**
```bash
# From project root
vercel

# Follow prompts to:
# - Link to GitHub (optional)
# - Set project name
# - Choose settings
```

4. **Set Environment Variables:**
```bash
# Add your API keys
vercel env add FIRECRAWL_API_KEY
vercel env add OPENAI_API_KEY
vercel env add NODE_ENV

# Redeploy with new env vars
vercel --prod
```

5. **Custom Domain:**
```bash
# Add your domain
vercel domains add yourdomain.com
vercel alias your-app.vercel.app yourdomain.com
```

---

## 🚂 **Option 2: Railway Deployment**

### **Why Railway?**
- ✅ Simple Node.js deployment
- ✅ Fair pricing ($5/month after free credits)
- ✅ Good performance
- ✅ Easy domain setup

### **Step-by-Step Deployment:**

1. **Prepare Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

2. **Create `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd ui && npm start",
    "healthcheckPath": "/api/health"
  }
}
```

3. **Deploy:**
```bash
# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set FIRECRAWL_API_KEY=your_key
railway variables set OPENAI_API_KEY=your_key
railway variables set NODE_ENV=production
```

4. **Custom Domain:**
```bash
# Add domain in Railway dashboard
# Or via CLI:
railway domain yourdomain.com
```

---

## 🎨 **Option 3: Render Deployment**

### **Why Render?**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Good for small projects
- ✅ Simple setup

### **Step-by-Step Deployment:**

1. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: docmcp
    env: node
    buildCommand: cd ui && npm install
    startCommand: cd ui && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: FIRECRAWL_API_KEY
        fromDatabase:
          name: api-keys
          property: firecrawl_key
      - key: OPENAI_API_KEY
        fromDatabase:
          name: api-keys
          property: openai_key
```

2. **Deploy:**
- Connect GitHub repository to Render
- Add environment variables in dashboard
- Deploy automatically on git push

3. **Custom Domain:**
- Add domain in Render dashboard
- Update DNS records as instructed

---

## 🌊 **Option 4: DigitalOcean App Platform**

### **Why DigitalOcean?**
- ✅ More control and features
- ✅ Reasonable pricing
- ✅ Good for production apps
- ✅ Excellent documentation

### **Step-by-Step Deployment:**

1. **Create `.do/app.yaml`:**
```yaml
name: docmcp
services:
- environment_slug: node-js
  github:
    branch: main
    deploy_on_push: true
    repo: your-username/your-repo
  health_check:
    http_path: /api/health
  http_port: 3000
  instance_count: 1
  instance_size_slug: basic-xxs
  name: web
  run_command: cd ui && npm start
  source_dir: /
  envs:
  - key: NODE_ENV
    value: production
  - key: FIRECRAWL_API_KEY
    value: your_firecrawl_key
    type: SECRET
  - key: OPENAI_API_KEY
    value: your_openai_key
    type: SECRET
```

2. **Deploy:**
- Create app in DigitalOcean dashboard
- Connect GitHub repository
- Configure environment variables
- Deploy

---

## 🔐 **Security & Production Considerations**

### **Environment Variables Security:**
```bash
# Never commit API keys to git
echo "FIRECRAWL_API_KEY=*" >> .gitignore
echo "OPENAI_API_KEY=*" >> .gitignore
echo ".env*" >> .gitignore
```

### **Production Server Enhancements:**

Create `ui/middleware/production.js`:
```javascript
export function productionMiddleware(app) {
  if (process.env.NODE_ENV === 'production') {
    // Rate limiting
    const rateLimit = require('express-rate-limit');
    app.use('/api/', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }));

    // Security headers
    app.use((req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });

    // Remove powered by header
    app.disable('x-powered-by');
  }
}
```

### **Performance Optimizations:**

```javascript
// ui/server.js additions
import compression from 'compression';

// Enable gzip compression
app.use(compression());

// Static file caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));
```

---

## 🌐 **Domain Configuration**

### **DNS Setup (for all providers):**

1. **A Record Setup:**
```
Type: A
Name: @
Value: [Your hosting provider's IP]
TTL: 3600
```

2. **CNAME Setup:**
```
Type: CNAME
Name: www
Value: yourdomain.com
TTL: 3600
```

3. **SSL Certificate:**
Most providers handle this automatically, but verify HTTPS is working.

---

## 💰 **Cost Comparison**

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Vercel** | 100GB bandwidth, 10GB storage | $20/month team plan | Most projects |
| **Railway** | $5 credit monthly | $5/month + usage | Simple deployment |
| **Render** | 750 hours/month | $7/month static, $25/month web | Budget projects |
| **DigitalOcean** | $200 credit (60 days) | $5/month basic | Production apps |

---

## 🎯 **Quick Start Recommendation**

**For immediate deployment:**

1. **Choose Vercel** (easiest and most reliable)
2. **Run these commands:**
```bash
npm i -g vercel
cd /path/to/your/docmcp
vercel
# Follow prompts
vercel env add FIRECRAWL_API_KEY
vercel env add OPENAI_API_KEY
vercel --prod
```

3. **Add your domain:**
```bash
vercel domains add yourdomain.com
vercel alias your-project.vercel.app yourdomain.com
```

4. **Update DNS:**
   - Point your domain to Vercel (they'll give you instructions)
   - Wait for propagation (usually 24-48 hours)

---

## ✅ **Post-Deployment Checklist**

- [ ] Environment variables configured
- [ ] HTTPS working
- [ ] Custom domain pointing correctly
- [ ] Health check endpoint responding
- [ ] Error handling working
- [ ] Zip download functionality working
- [ ] Stagewise toolbar disabled in production
- [ ] API rate limiting configured
- [ ] Monitoring/logging set up

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Module not found" errors:**
   - Ensure all dependencies are in `package.json`
   - Run `npm install` before deployment

2. **Environment variables not working:**
   - Check variable names match exactly
   - Verify they're set in hosting dashboard
   - Restart application after adding variables

3. **Domain not resolving:**
   - Check DNS propagation (use dnschecker.org)
   - Verify SSL certificate is active
   - Clear browser cache

4. **API timeouts in production:**
   - Increase timeout limits in hosting settings
   - Optimize API calls for production

---

## 🎉 **Success!**

Once deployed, your DocMCP will be accessible at your custom domain with:
- ✅ Professional HTTPS encryption
- ✅ Global CDN for fast loading
- ✅ Automatic scaling
- ✅ Error handling and monitoring
- ✅ Enterprise-grade reliability

**Your documentation converter is now live and ready for the world!** 🌍✨ 