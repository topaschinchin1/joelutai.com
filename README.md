# JoeLuT AI Website

AI Tools for Research & Food Science

**Live Site:** [joelutai.com](https://joelutai.com)

## 🚀 Quick Deploy

This site auto-deploys to Vercel when you push to `main` branch.

### Adding a New Tool

1. Create a new folder: `mkdir my-new-tool`
2. Add your `index.html` inside it
3. Commit and push:
   ```bash
   git add .
   git commit -m "Add my-new-tool"
   git push
   ```
4. ✅ Live at `joelutai.com/my-new-tool` in ~30 seconds

## 📁 Structure

```
joelutai.com/
├── index.html              ← Main landing page
├── foodcost-pro/
│   └── index.html          ← joelutai.com/foodcost-pro
├── fsma-checker/
│   └── index.html          ← joelutai.com/fsma-checker
├── dna-discovery/
│   └── index.html          ← joelutai.com/dna-discovery (if exists)
└── [new-tool]/
    └── index.html          ← joelutai.com/[new-tool]
```

## 🛠 Free Tools

| Tool | Path | Description |
|------|------|-------------|
| FoodCost Pro | `/foodcost-pro` | Product cost calculator for food manufacturers |
| FSMA Checker | `/fsma-checker` | FDA Food Traceability Rule compliance checker |
| Microglia Analyzer | External | Cell morphology analysis tool |

## 🔧 Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/joelutai.com.git
cd joelutai.com

# Open in browser (no build needed - it's just HTML!)
open index.html

# Or use a local server
npx serve .
```

## 📝 Notes

- No build process needed - just static HTML/CSS/JS
- Each folder becomes a route automatically
- Vercel handles SSL, CDN, and caching
- Free tier is more than enough for this site

## 👩‍💻 Owner

**Chioma Odo** - JoeLuT AI Solutions, Houston TX
- Email: info@joelutai.com
- Calendly: [Book a Call](https://calendly.com/chiomaodo/intro-call)
