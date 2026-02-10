# Paladin Protocol - CRE Workflow

Chainlink Compute Runtime Environment workflow for autonomous exploit detection and response.

## Components

- **exploitDetector.js** - Monitors blockchain for anomalous transactions
- **aiAnalyzer.js** - Uses Claude AI to analyze exploits and extract patterns
- **portfolioScanner.js** - Scans DAO protocols for similar vulnerabilities
- **responseExecutor.js** - Executes emergency withdrawals via Guardian contract

## Setup

```bash
# Install dependencies
npm install

# Test individual components
npm run test:detector
npm run test:analyzer
npm run test:scanner
npm run test:executor

# Deploy CRE workflow
npm run deploy
```

## Configuration

Edit `config/portfolio.json` to add protocols to monitor.

## Structure

```
cre-workflow/
├── src/
│   ├── detection/
│   │   └── exploitDetector.js
│   ├── analysis/
│   │   └── aiAnalyzer.js
│   ├── scanner/
│   │   └── portfolioScanner.js
│   └── response/
│       └── responseExecutor.js
├── config/
│   └── portfolio.json
└── workflow.yaml
```
