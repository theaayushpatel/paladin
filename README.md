# ⚔️ Paladin Protocol

**Autonomous AI-powered DeFi defense system**

Paladin Protocol monitors blockchains for DeFi exploits, uses local Ollama AI to analyze vulnerability patterns, scans entire protocol portfolios for similar weaknesses, and automatically withdraws funds from vulnerable protocols in under 30 seconds—all before copycat attacks occur.

## 🏗️ Architecture

### Smart Contracts (`contracts/`)
- **Guardian.sol** - Executes emergency withdrawals when CRE detects threats
- **RiskRegistry.sol** - Immutable onchain record of all detections and actions
- **VulnerableProtocol.sol** - Mock protocol with intentional reentrancy bug (for demo)

### CRE Workflow (`cre-workflow/`)
- **exploitDetector.js** - Monitors blockchain, scores transactions for anomalies
- **aiAnalyzer.js** - Calls local Ollama AI to analyze exploits and extract patterns
- **portfolioScanner.js** - Checks all DAO protocols for similar vulnerabilities
- **responseExecutor.js** - Executes emergency withdrawals via Guardian contract

### Dashboard (`dashboard/`)
- **Next.js 14 app** - Real-time protocol health monitoring and risk timeline
- **wagmi + viem** - Blockchain interactions
- **Tailwind CSS** - Paladin-themed UI (navy blue, silver, gold)

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Ollama](https://ollama.com) for local AI analysis
- Testnet ETH on Arbitrum Sepolia

### 1. Environment Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b
ollama serve  # Run in separate terminal

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys:
# - ALCHEMY_API_KEY
# - ETHERSCAN_API_KEY (optional)
# - ARBISCAN_API_KEY (optional)
# - DEPLOYER_PRIVATE_KEY
```

### 2. Install Foundry Dependencies

```bash
cd contracts
forge install
cd ..
```

### 3. Install Node Dependencies

```bash
# Install all workspace dependencies
npm run install:all
```

### 4. Build & Test Contracts

```bash
npm run build:contracts
npm run test:contracts
```

### 5. Deploy Contracts

```bash
npm run deploy:contracts
```

After deployment, update `.env` with deployed contract addresses.

### 6. Run Dashboard

```bash
npm run dev:dashboard
```

Visit http://localhost:3000

## 📁 Project Structure

```
paladin-protocol/
├── .env                          # Environment variables (create from .env.example)
├── .env.example                  # Environment template
├── package.json                  # Root workspace config
├── CLAUDE_CONTEXT.md            # AI assistant context guide
│
├── contracts/                    # Foundry smart contracts
│   ├── foundry.toml             # Foundry configuration
│   ├── remappings.txt           # Import remappings
│   ├── src/
│   │   ├── Guardian.sol         # Emergency withdrawal executor
│   │   ├── RiskRegistry.sol     # Onchain audit trail
│   │   └── mocks/
│   │       └── VulnerableProtocol.sol
│   ├── script/
│   │   └── Deploy.s.sol         # Deployment script
│   └── test/
│       ├── Guardian.t.sol           # Guardian tests (19 tests)
│       ├── RiskRegistry.t.sol       # RiskRegistry tests (14 tests)
│       └── VulnerableProtocol.t.sol # VulnerableProtocol tests (8 tests)
│
├── cre-workflow/                # Chainlink CRE workflow
│   ├── package.json
│   ├── workflow.yaml            # CRE orchestration config
│   ├── config/
│   │   └── portfolio.json       # DAO protocol portfolio
│   └── src/
│       ├── detection/
│       │   └── exploitDetector.js
│       ├── analysis/
│       │   └── aiAnalyzer.js
│       ├── scanner/
│       │   └── portfolioScanner.js
│       └── response/
│           └── responseExecutor.js
│
└── dashboard/                   # Next.js 14 frontend
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── Header.tsx           # Navigation + wallet connection
    │   ├── ProtocolCard.tsx     # Protocol health card with risk score
    │   ├── RiskTimeline.tsx     # The Chronicle — onchain event timeline
    │   ├── AlertCenter.tsx      # Active alert aggregation
    │   └── ManualScan.tsx       # Manual protocol scan + threat recording
    └── lib/
        ├── wagmi.ts             # Wallet config
        └── contracts.ts         # Contract ABIs
```

## 🎨 Paladin Theme

The Paladin theme uses medieval protector metaphors:

- **The Vigil** - Monitoring system (never sleeps)
- **Divine Sight** - AI analysis (sees through deception)
- **The Oath** - Automated response rules
- **The Crusade** - Active defense mechanisms
- **The Chronicle** - Audit trail (Risk Registry)

### Colors

- Paladin Blue: `#1a2742` (primary background)
- Paladin Silver: `#c0c5ce` (text)
- Paladin Gold: `#d4af37` (accents, highlights)

## 🛠️ Development Commands

```bash
# Root commands
npm run install:all              # Install all dependencies
npm run build:contracts          # Build smart contracts
npm run test:contracts           # Run contract tests
npm run deploy:contracts         # Deploy to Arbitrum Sepolia
npm run dev:dashboard            # Start dashboard dev server

# Contract commands (from contracts/)
forge build                      # Compile contracts
forge test -vvv                  # Run tests (verbose)
forge coverage                   # Test coverage report
forge script script/Deploy.s.sol # Deploy contracts

# CRE commands (from cre-workflow/)
npm run test:detector            # Test exploit detector
npm run test:analyzer            # Test AI analyzer
npm run test:scanner             # Test portfolio scanner
npm run test:executor            # Test response executor
npm run deploy                   # Deploy CRE workflow

# Dashboard commands (from dashboard/)
npm run dev                      # Dev server
npm run build                    # Production build
npm run start                    # Start production server
npm run lint                     # Lint code
```

## 🔐 Security

- All emergency withdrawals require CRE workflow authorization
- Cooldown periods prevent spam (5 minutes default)
- Maximum withdrawal limits enforced per protocol
- All actions emit events and logged to RiskRegistry
- Custom errors for gas-efficient reverts

## 📖 Documentation

- [CLAUDE_CONTEXT.md](./CLAUDE_CONTEXT.md) - Comprehensive guide for AI-assisted development
- [contracts/README.md](./contracts/README.md) - Smart contract documentation
- [cre-workflow/README.md](./cre-workflow/README.md) - CRE workflow guide
- [dashboard/README.md](./dashboard/README.md) - Frontend documentation

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
forge test -vvv                  # Verbose test output
forge coverage                   # Coverage report
```

### CRE Components
```bash
cd cre-workflow
npm run test:detector            # Test individual modules
npm run test:analyzer
```

## 🚢 Deployment

1. **Deploy Contracts**
   ```bash
   npm run deploy:contracts
   ```

2. **Update Environment**
   - Copy deployed addresses to `.env`
   - Update `cre-workflow/config/portfolio.json`

3. **Deploy CRE Workflow**
   ```bash
   cd cre-workflow
   npm run deploy
   ```

4. **Deploy Dashboard**
   ```bash
   cd dashboard
   npm run build
   npm run start
   ```

**Built with:** Solidity • Foundry • Chainlink CRE • Claude AI • Next.js 14 • TypeScript • Tailwind CSS

**The shield that never sleeps** ⚔️