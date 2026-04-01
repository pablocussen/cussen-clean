# CLAUDIA Quick Start Guide

**Version:** 7.1.0
**Last Updated:** 2025-10-24

## 🚀 Getting Started (5 minutes)

### For Users

**Access CLAUDIA:**
1. Open https://claudia-i8bxh.web.app
2. Start creating your construction project
3. Add activities and materials
4. Get instant cost estimates

**No installation needed!** It's a Progressive Web App.

---

### For Developers

**Clone & Setup:**
```bash
git clone [repository]
cd claudia_bot
npm install  # Install dependencies
```

**Run Tests:**
```bash
cd tests
npm install
npm test
```

**Build:**
```bash
cd scripts
npm install
npm run build
```

**Deploy:**
```bash
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
claudia_bot/
├── web_app/              # Frontend application
│   ├── js/              # JavaScript modules
│   │   ├── claudia.bundle.min.js    # Core bundle
│   │   ├── claudia-sentry.js        # Error tracking
│   │   ├── claudia-lazy-pro.js      # Lazy loader
│   │   └── claudia-*.js             # Other modules
│   ├── css/             # Stylesheets
│   └── index.html       # Main HTML
├── claudia_modules/     # Python backend
│   ├── ai_core.py       # AI integration
│   ├── telegram_api.py  # Telegram bot
│   └── config.py        # Configuration
├── tests/               # Unit tests
│   ├── utils.test.js
│   ├── compression.test.js
│   └── indexeddb.test.js
├── scripts/             # Build tools
│   ├── build-optimized.js
│   ├── analyze-bundle.js
│   └── check-budgets.js
├── docs/                # Documentation
│   ├── versions/        # Version-specific docs
│   ├── sessions/        # Session summaries
│   └── archive/         # Historical docs
└── firebase.json        # Firebase config
```

---

## 🛠️ Common Tasks

### Run Tests
```bash
cd tests
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Build Bundle
```bash
cd scripts
npm run build          # Create bundle
npm run minify:js      # Minify
npm run check-budgets  # Check sizes
```

### Lint & Format
```bash
npx eslint web_app/js/*.js       # Lint
npx prettier --write web_app/    # Format
```

### Deploy
```bash
firebase deploy --only hosting           # Deploy web
gcloud functions deploy claudia_handler  # Deploy backend
```

---

## 📚 Key Modules

### Core Utilities
- **claudia-utils.js** - Formatting, dates, money
- **claudia-indexeddb.js** - Offline storage
- **claudia-compression.js** - Data compression
- **claudia-performance.js** - Performance monitoring

### New in v7.1
- **claudia-sentry.js** - Error tracking
- **claudia-lazy-pro.js** - Lazy loading

### Pro Features
- **claudia-pro.js** - Advanced features (87 KB, lazy-loaded)
- **claudia-export-pro.js** - Excel/PDF export
- **claudia-smart-shopping.js** - Price optimization

---

## 🧪 Testing

### Run Specific Test
```bash
npm test utils.test.js
```

### Coverage Report
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html
```

### Debug Tests
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🐛 Debugging

### View Errors
```javascript
// In browser console
ClaudiaSentry.getStoredErrors()
```

### Check Performance
```javascript
ClaudiaPerformance.getMetrics()
```

### Clear Cache
```javascript
ClaudiaDB.clearAll()
localStorage.clear()
```

---

## 📊 Monitoring

### Production Errors
Check browser console or Firebase Analytics

### Bundle Size
```bash
cd scripts
npm run analyze
```

### Performance
Chrome DevTools → Lighthouse → Run audit

---

## 🔑 Key Commands

```bash
# Development
npm test                      # Run tests
npm run build                 # Build bundle
firebase serve               # Local server

# Production
firebase deploy              # Deploy app
npm run check-budgets        # Verify sizes
git push                     # Push changes

# Maintenance
npm audit                    # Security check
npm outdated                 # Update check
```

---

## 🆘 Troubleshooting

### Tests Failing
```bash
cd tests
rm -rf node_modules
npm install
npm test
```

### Build Errors
```bash
cd scripts
npm install
node build-optimized.js
```

### Deploy Issues
```bash
firebase login
firebase use claudia-i8bxh
firebase deploy --only hosting
```

---

## 📖 More Documentation

- [Testing Summary](CLAUDIA_v7.0_TESTING_SUMMARY.md)
- [Release Notes](CLAUDIA_v7.1_RELEASE_NOTES.md)
- [Changelog](../CHANGELOG.md)
- [Roadmap](CLAUDIA_ROADMAP_v7.0+.md)

---

## 💡 Tips

1. **Use lazy loading** for heavy features
2. **Run tests** before deploying
3. **Check budgets** to avoid bundle bloat
4. **Monitor errors** via Sentry
5. **Keep docs updated** when adding features

---

**Need Help?**
- Check [docs/](.)
- Run `npm test` to verify setup
- Review recent commits for examples

**Ready to contribute?**
1. Create a feature branch
2. Write tests first
3. Implement feature
4. Run `npm test` and `npm run build`
5. Submit PR

🚀 **Happy coding!**
