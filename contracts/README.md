# Paladin Protocol - Smart Contracts

Foundry-based Solidity smart contracts for autonomous DeFi defense.

## Contracts

- **Guardian.sol** - Executes emergency withdrawals when threats are detected
- **RiskRegistry.sol** - Immutable onchain audit trail of all detections and actions
- **VulnerableProtocol.sol** - Mock protocol with reentrancy vulnerability (for testing)

## Setup

```bash
# Install dependencies
forge install

# Build
forge build

# Test
forge test -vvv

# Deploy
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast --verify
```

## Structure

```
contracts/
├── src/
│   ├── Guardian.sol
│   ├── RiskRegistry.sol
│   └── mocks/
│       └── VulnerableProtocol.sol
├── script/
│   └── Deploy.s.sol
├── test/
│   ├── Guardian.t.sol               # 19 tests
│   ├── RiskRegistry.t.sol           # 14 tests
│   └── VulnerableProtocol.t.sol     # 8 tests (incl. reentrancy attack demo)
└── foundry.toml
```
