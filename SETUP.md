# Paladin Protocol - Setup Guide

Complete setup instructions for running the Paladin Protocol autonomous defense system.

## � Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| Guardian | [`0xa80f97675ff16407464b688cce4554f35a5a9214`](https://sepolia.arbiscan.io/address/0xa80f97675ff16407464b688cce4554f35a5a9214) |
| RiskRegistry | [`0x0988e36849863504d1db1e88eef5aef866ea3d79`](https://sepolia.arbiscan.io/address/0x0988e36849863504d1db1e88eef5aef866ea3d79) |
| VulnerableProtocol | [`0x67cd4c8051f7d38b1acf7ad09318dc8909c2644a`](https://sepolia.arbiscan.io/address/0x67cd4c8051f7d38b1acf7ad09318dc8909c2644a) |

> Chain ID: 421614 — Deployer wallet needs Arbitrum Sepolia ETH from the [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)

---

## �🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Foundry (for smart contracts)
- Ollama (for local AI analysis)
- Git

### Installation Steps

#### 1. Clone and Install Dependencies

```bash
# Root dependencies
npm install

# Smart contracts
cd contracts
forge install
cd ..

# CRE Workflow
cd cre-workflow
npm install
cd ..

# Dashboard
cd dashboard
npm install
cd ..
```

#### 2. Configure Environment Variables

```bash
# Copy environment templates
cp .env.example .env
cp contracts/.env.example contracts/.env
cp cre-workflow/.env.example cre-workflow/.env
cp dashboard/.env.example dashboard/.env
```

#### 3. Setup Ollama and Get API Keys

**Install and Configure Ollama (Required for AI Analysis):**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the AI model
ollama pull llama3.1:8b

# Start Ollama server (run in separate terminal)
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

**Get Other API Keys:**

**Required:**
- **Alchemy** (Blockchain RPC): [dashboard.alchemy.com](https://dashboard.alchemy.com)
- **WalletConnect** (Dashboard): [cloud.walletconnect.com](https://cloud.walletconnect.com)

**Optional:**
- **Etherscan/Arbiscan** (Contract verification): [etherscan.io](https://etherscan.io), [arbiscan.io](https://arbiscan.io)

#### 4. Generate Wallets

```bash
# Generate deployer wallet
cast wallet new

# Generate CRE workflow wallet
cast wallet new
```

Save the private keys and addresses to your `.env` files.

#### 5. Fund Wallets with Testnet ETH

Get Arbitrum Sepolia testnet ETH from:
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/)

#### 6. Deploy Smart Contracts

```bash
cd contracts

# Compile contracts
forge build

# Run tests
forge test -vvv

# Deploy to Arbitrum Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify

# Copy deployed addresses to all .env files
```

#### 7. Update Configuration Files

**Update `cre-workflow/config/portfolio.json`:**
```json
{
  "portfolios": [
    {
      "daoName": "Your DAO",
      "daoAddress": "0xYourDaoAddress",
      "protocols": [
        {
          "name": "Your Protocol",
          "address": "0xYourProtocolAddress",
          "chain": "arbitrum-sepolia",
          "tvl": "1000000",
          "criticality": "high",
          "withdrawalAddress": "0xYourSafeAddress"
        }
      ]
    }
  ]
}
```

**Update all `.env` files with deployed addresses:**
- `GUARDIAN_ADDRESS`
- `RISK_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_GUARDIAN_ADDRESS`
- `NEXT_PUBLIC_RISK_REGISTRY_ADDRESS`

#### 8. Grant Roles

```bash
# Grant CRE_WORKFLOW_ROLE to your CRE workflow address
cast send $GUARDIAN_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "CRE_WORKFLOW_ROLE") \
  $CRE_WORKFLOW_ADDRESS \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# Grant GUARDIAN_ROLE on RiskRegistry so Guardian can write events
cast send $RISK_REGISTRY_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "GUARDIAN_ROLE") \
  $GUARDIAN_ADDRESS \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

#### 9. Test Individual Components

```bash
# Make sure Ollama is running first!
ollama serve  # In separate terminal

# Test exploit detector
cd cre-workflow
npm run test:detector

# Test AI analyzer (requires Ollama running)
npm run test:analyzer

# Test portfolio scanner
npm run test:scanner

# Test response executor
npm run test:executor
```

#### 10. Start Dashboard

```bash
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Configuration Guide

### Smart Contracts Configuration

**`contracts/.env`:**
```bash
ARBITRUM_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0x...
SAFE_ADDRESS=0x... # Where rescued funds go
```

### CRE Workflow Configuration

**`cre-workflow/.env`:**
```bash
ARBITRUM_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
GUARDIAN_ADDRESS=0x...
RISK_REGISTRY_ADDRESS=0x...
CRE_WORKFLOW_PRIVATE_KEY=0x... # Account with CRE_WORKFLOW_ROLE
```

**`cre-workflow/config/portfolio.json`:**
Configure protocols to monitor in this file.

### Dashboard Configuration

**`dashboard/.env`:**
```bash
NEXT_PUBLIC_GUARDIAN_ADDRESS=0x...
NEXT_PUBLIC_RISK_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
forge test

# Run with detailed output
forge test -vvv

# Run specific test
forge test --match-test testEmergencyWithdraw

# Check coverage
forge coverage
```

### CRE Workflow Tests

```bash
cd cre-workflow

# Test each component
npm run test:detector  # Blockchain monitoring
npm run test:analyzer  # AI analysis (requires Ollama running: ollama serve)
npm run test:scanner   # Portfolio scanning
npm run test:executor  # Emergency response
```

---

## 🚀 Deployment

### Deploy to Arbitrum Sepolia (Testnet)

```bash
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY
```

### Deploy CRE Workflow (Chainlink)

```bash
cd cre-workflow
cre deploy workflow.yaml --network arbitrum-sepolia
```

### Deploy Dashboard (Vercel)

```bash
cd dashboard

# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod
```

---

## 🐛 Troubleshooting

### "forge not found"

Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### "Ollama Connection Error"

Make sure Ollama is running:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# If not, start it
ollama serve

# Make sure model is installed
ollama list
ollama pull llama3.1:8b
```

### "Insufficient funds for gas"

Fund your wallet with testnet ETH from:
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/)

### "AccessControl: account ... is missing role"

Grant the required role:
```bash
cast send $GUARDIAN_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "CRE_WORKFLOW_ROLE") \
  $YOUR_ACCOUNT \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Dashboard not connecting to wallet

1. Check WalletConnect Project ID is set
2. Clear browser cache
3. Try different wallet (MetaMask, Rainbow, etc.)

---

## 📚 Architecture Overview

### Smart Contracts (Solidity + Foundry)
- **Guardian.sol**: Executes emergency withdrawals
- **RiskRegistry.sol**: Records all threats onchain
- **VulnerableProtocol.sol**: Mock contract for testing

### CRE Workflow (Node.js + Chainlink)
- **exploitDetector.js**: Monitors blockchain for anomalies
- **aiAnalyzer.js**: Uses local Ollama AI to analyze exploits
- **portfolioScanner.js**: Scans DAO portfolios for vulnerabilities
- **responseExecutor.js**: Executes emergency responses via Guardian

### Dashboard (Next.js + TypeScript + wagmi)
- Real-time monitoring interface
- Protocol health cards
- Risk timeline (The Chronicle)
- Alert center
- Wallet connection via RainbowKit

---

## 🔐 Security Notes

1. **Never commit private keys** to version control
2. **Use different wallets** for deployer and CRE workflow
3. **Test on testnet first** before mainnet deployment
4. **Rotate API keys regularly**
5. **Set appropriate withdrawal limits** in Guardian contract
6. **Use multisig for admin operations** in production

---

## 📞 Support

For issues or questions:
1. Check [CLAUDE_CONTEXT.md](./CLAUDE_CONTEXT.md) for project details
2. Review this setup guide
3. Check contract tests for examples
4. Review CRE workflow logs

---

**⚔️ Paladin Protocol — The shield that never sleeps**
