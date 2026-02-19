# Project Context: Paladin Protocol

You are helping me build **Paladin Protocol**, an autonomous AI-powered defense system that detects DeFi exploits and protects entire protocol portfolios before copycat attacks occur.

## Project Overview

**What it does:**
- Monitors multiple blockchains (Ethereum, Arbitrum, Base) for exploit transactions
- Uses Claude AI to analyze exploit patterns and understand vulnerabilities
- Scans a DAO's entire protocol portfolio for similar weaknesses
- Automatically withdraws funds from vulnerable protocols in <30 seconds
- Records everything onchain for transparency

**Tech Stack:**
- Smart Contracts: Solidity + Foundry
- Orchestration: Chainlink CRE (Compute Runtime Environment)
- AI Analysis: Local Ollama (llama3.1:8b or similar)
- Frontend: Next.js 14 + TypeScript + Tailwind + wagmi
- Blockchain: Arbitrum Sepolia testnet

## Architecture Components

### 1. Smart Contracts (`contracts/`)
- **Guardian.sol**: Executes emergency withdrawals when CRE detects threats
- **RiskRegistry.sol**: Immutable onchain record of all detections and actions
- **VulnerableProtocol.sol**: Mock protocol with intentional reentrancy bug (for demo)

### 2. CRE Workflow (`cre-workflow/`)
- **exploitDetector.js**: Monitors blockchain, scores transactions for anomalies
- **aiAnalyzer.js**: Calls local Ollama AI to analyze exploits and extract patterns
- **portfolioScanner.js**: Checks all DAO protocols for similar vulnerabilities
- **responseExecutor.js**: Executes emergency withdrawals via Guardian contract
- **workflow.yaml**: Chainlink CRE configuration orchestrating all components

### 3. Dashboard (`dashboard/`)
- **Next.js app** showing live protocol health, risk timeline, and alerts
- **wagmi + viem** for blockchain interactions
- **Tailwind CSS** with custom Paladin theme (navy blue, silver, gold)

## Key Design Patterns

### Paladin Theme
- **The Vigil**: Monitoring system (never sleeps)
- **Divine Sight**: AI analysis (sees through deception)
- **The Oath**: Automated response rules
- **The Crusade**: Active defense mechanisms
- **The Chronicle**: Audit trail (Risk Registry)

### Colors
- Paladin Blue: `#1a2742` (primary)
- Paladin Silver: `#c0c5ce` (text)
- Paladin Gold: `#d4af37` (accents)

### Risk Levels
- **9-10 (CRITICAL)**: Emergency withdrawal of 100% funds
- **7-8 (HIGH)**: Partial withdrawal of 80% funds
- **5-6 (MEDIUM)**: Create alert + governance proposal
- **3-4 (LOW)**: Enhanced monitoring only

## File Structure

```
paladin-protocol/
├── contracts/
│   ├── src/
│   │   ├── Guardian.sol
│   │   ├── RiskRegistry.sol
│   │   └── mocks/VulnerableProtocol.sol
│   ├── script/Deploy.s.sol
│   └── test/
│       ├── Guardian.t.sol
│       └── RiskRegistry.t.sol
├── cre-workflow/
│   ├── src/
│   │   ├── detection/exploitDetector.js
│   │   ├── analysis/aiAnalyzer.js
│   │   ├── scanner/portfolioScanner.js
│   │   └── response/responseExecutor.js
│   ├── config/portfolio.json
│   └── workflow.yaml
└── dashboard/
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   └── providers.tsx
    ├── components/
    │   ├── Header.tsx
    │   ├── ProtocolCard.tsx
    │   ├── RiskTimeline.tsx
    │   └── AlertCenter.tsx
    └── lib/
        ├── wagmi.ts
        └── contracts.ts
```

## Environment Variables

```bash
# .env (in root directory)
ALCHEMY_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
ETHERSCAN_API_KEY=
ARBISCAN_API_KEY=
DEPLOYER_PRIVATE_KEY=
GUARDIAN_ADDRESS=
RISK_REGISTRY_ADDRESS=
ARBITRUM_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}
```

## Common Development Tasks

### When I ask you to create a new file:
1. Always create the full file path
2. Include all necessary imports
3. Add helpful comments explaining key sections
4. Follow the Paladin naming conventions
5. Use TypeScript for frontend, ES6 modules for backend

### When writing Solidity:
- Use Solidity 0.8.20
- Include NatSpec comments with Paladin-themed descriptions
- Always use OpenZeppelin contracts for security
- Write corresponding tests in Foundry
- Use custom errors instead of require strings

### When writing JavaScript/TypeScript:
- Use ES6 modules (`import/export`)
- Use `ethers` v6 for blockchain interactions
- Always handle errors with try-catch
- Log progress with descriptive console messages
- Use async/await (no callbacks)

### When writing React/Next.js:
- Use TypeScript with proper types
- Functional components only (no class components)
- Use wagmi hooks for blockchain reads
- Follow Tailwind utility-first approach
- Use Paladin color scheme consistently

## Code Style Preferences

### Naming Conventions:
- **Solidity**: PascalCase for contracts, camelCase for functions
- **JavaScript**: camelCase for functions/variables, PascalCase for classes
- **React**: PascalCase for components, camelCase for hooks
- **Files**: kebab-case for file names

### Comments:
- **Smart contracts**: NatSpec format with `@notice`, `@param`, `@return`
- **JavaScript**: JSDoc format for functions
- **Inline**: Explain "why" not "what"

### Error Handling:
- **Solidity**: Custom errors with descriptive names
- **JavaScript**: Try-catch with specific error messages
- **Frontend**: User-friendly error messages in UI

## Testing Requirements

### Foundry Tests:
```solidity
// Test naming: test<FunctionName><Scenario>
function testEmergencyWithdrawSuccess() public { }
function testEmergencyWithdrawRevertsWhenUnauthorized() public { }
```

### Coverage Goals:
- Smart contracts: 100% line coverage
- Critical functions: Test happy path + all revert conditions
- Always test access control

## Common Requests & Expected Responses

### "Create a new component"
You should:
1. Ask what the component should display/do
2. Create the file with full implementation
3. Include proper TypeScript types
4. Use Paladin theme colors
5. Add to parent component if I specify

### "Fix this error"
You should:
1. Analyze the error message
2. Identify root cause
3. Provide fixed code with explanation
4. Suggest how to prevent similar errors

### "Add a new feature"
You should:
1. Confirm requirements
2. Identify which files need changes
3. Provide complete updated code for each file
4. Explain how components interact

### "Write tests for X"
You should:
1. Create comprehensive test file
2. Test happy path and edge cases
3. Test access control and permissions
4. Include setup/teardown as needed

## Important Implementation Details

### Guardian Contract:
- Only CRE workflow can call emergency functions
- Cooldown period prevents spam (configurable per protocol)
- Maximum withdrawal limits enforced
- All actions emit events

### AI Analyzer:
- Sends transaction data + source code to local Ollama
- Expects JSON response with specific schema
- Confidence threshold: only act if >80%
- Handles API failures gracefully
- Runs completely locally (no API costs)

### Portfolio Scanner:
- Fetches source code from Etherscan API
- Calculates code similarity (0-1 scale)
- If similarity >70%, does AI deep dive
- Risk score combines: AI confidence + similarity + exposure

### CRE Workflow:
- Triggers on new blocks (Arbitrum Sepolia)
- Steps execute sequentially with conditions
- Each step has retry logic (3 attempts)
- State persists across executions

### Dashboard:
- Polls Risk Registry every 30 seconds for new events
- WebSocket connection for real-time updates (future)
- Mobile responsive with Tailwind breakpoints
- Dark mode only (Paladin theme)

## Dependencies to Install

### Contracts:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### CRE Workflow:
```bash
npm install ethers@6 axios dotenv
```

### Ollama Setup:
```bash
# Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3.1:8b

# Start Ollama server
ollama serve
```

### Dashboard:
```bash
npm install next@14 react react-dom wagmi viem @tanstack/react-query
npm install @rainbow-me/rainbowkit recharts lucide-react
npm install -D typescript @types/react @types/node tailwindcss
```

## How to Interact With Me

### ✅ DO say:
- "Create [filename] with [functionality]"
- "Add [feature] to [component]"
- "Fix the error in [file]"
- "Write tests for [function]"
- "Explain why [code] works this way"
- "What's the best way to [implement X]"

### ❌ DON'T say:
- "Make it better" (be specific)
- "Fix everything" (one issue at a time)
- Commands without context

### When you need me to clarify:
Ask specific questions like:
- "Should this function be public or external?"
- "What risk level should trigger this action?"
- "Where should I import this component?"

## Current Project State

**Status**: Starting from scratch / In development / Debugging phase
**Priority**: [What you're working on now]
**Blockers**: [Any issues preventing progress]

## Build Instructions

### Smart Contracts:
```bash
cd contracts
forge install
forge test
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast
```

### CRE Workflow:
```bash
cd cre-workflow
npm install
node src/detection/exploitDetector.js  # Test individual modules
cre deploy workflow.yaml --network arbitrum-sepolia
```

### Dashboard:
```bash
cd dashboard
npm install
npm run dev  # Local development
npm run build  # Production build
```

## Debugging Helpers

### Common Errors:

**"Custom error (Could not decode)"**
→ Wrong function signature or parameters

**"Nonce too low"**
→ Transaction already mined, wait for confirmation

**"Insufficient funds"**
→ Need testnet ETH from faucet

**"Module not found"**
→ Check imports use correct paths and extensions (.js for ES modules)

**"Cannot find name"**
→ Missing TypeScript type import

## Quick Reference

### Foundry Commands:
- `forge build` - Compile contracts
- `forge test -vvv` - Run tests (verbose)
- `forge coverage` - Check coverage
- `forge script` - Deploy contracts
- `cast call` - Read contract
- `cast send` - Write to contract

### Git Workflow:
```bash
git add .
git commit -m "feat: add [feature]" # or "fix:", "docs:", "test:"
git push origin main
```

---

## Your First Task

I'm ready to start building Paladin Protocol. I'll begin by:

[Tell me what you want to work on first, e.g.:]
- Creating the Guardian.sol smart contract
- Setting up the CRE workflow structure
- Building the dashboard layout
- Writing tests for existing code
- Debugging a specific error

Please be specific about:
1. What you want me to create/fix
2. Any specific requirements or constraints
3. Which files are affected

Let's build your Paladin! ⚔️



## Task-Specific Prompts

### For Creating New Files:
```
Context: I'm building Paladin Protocol (details in CLAUDE_CONTEXT.md)

Task: Create [filename] that [does X]

Requirements:
- [Specific requirement 1]
- [Specific requirement 2]

Please provide the complete file with:
- All necessary imports
- Proper error handling
- Paladin theme naming
- Comments explaining key logic
```

### For Debugging:
```
Context: Paladin Protocol (see CLAUDE_CONTEXT.md)

Error: [paste error message]

File: [filename]
Code: [paste relevant code]

What's wrong and how do I fix it?
```

### For Adding Features:
```
Context: Paladin Protocol (see CLAUDE_CONTEXT.md)

Current state: [describe what exists]

New feature: [describe what you want]

Which files need to change and what should the updated code be?
```

### For Testing:
```
Context: Paladin Protocol (see CLAUDE_CONTEXT.md)

File to test: [filename]
Functions: [list functions]

Create comprehensive Foundry tests covering:
- Happy path
- Revert conditions
- Edge cases
- Access control
```

### For Code Review:
```
Context: Paladin Protocol (see CLAUDE_CONTEXT.md)

Here's my code: [paste code]

Please review for:
- Security issues
- Gas optimization
- Best practices
- Paladin style consistency
```

## Sample Conversation Flow

**You:**
```
Read CLAUDE_CONTEXT.md

Create contracts/src/Guardian.sol with:
- emergencyWithdraw function (only CRE can call)
- Cooldown mechanism (5 min default)
- Max withdrawal limits per protocol
- Access control using OpenZeppelin
- Events for all actions
```

**Claude will:**
1. Create the complete Guardian.sol file
2. Include all imports
3. Add NatSpec comments
4. Follow Solidity 0.8.20 syntax
5. Use custom errors
6. Include proper access control

**You:**
```
Now create the corresponding test file contracts/test/Guardian.t.sol
Test all functions and revert conditions
```

**Claude will:**
1. Create comprehensive test file
2. Use Foundry test syntax
3. Include setUp function
4. Test happy paths and reverts
5. Use descriptive test names

**You:**
```
The test is failing with: "EvmError: Revert"
Here's the test code: [paste]
```

**Claude will:**
1. Identify the issue
2. Explain why it's reverting
3. Provide fixed code
4. Explain the fix

## Tips for Best Results

### ✅ DO:
- Be specific about what you want
- Provide error messages in full
- Mention which files are involved
- Specify any constraints or requirements
- Ask follow-up questions if unclear

### ❌ DON'T:
- Ask vague questions like "make it better"
- Paste huge code blocks without context
- Skip error messages
- Assume Claude remembers previous conversations (provide context each time)

## Quick Command Templates

### Create New Component:
```
Context: Paladin Protocol dashboard

Create components/[ComponentName].tsx that displays [X]
Use: Paladin colors, TypeScript, Tailwind, wagmi hooks
```

### Fix Error:
```
Error in [filename]:
[error message]

Code:
[paste code]

Fix it
```

### Add Feature:
```
Add [feature name] to [component/contract]

Current code:
[paste relevant section]

Requirements:
- [requirement 1]
- [requirement 2]
```

### Optimize:
```
Optimize this code for gas/performance:
[paste code]

Maintain: [list what must stay the same]
```

### Explain:
```
Explain how this works:
[paste code]

Specifically: [what you're confused about]
```

---

## Example Complete Interaction

```
I'm building Paladin Protocol (autonomous DeFi exploit defense system).

Context:
- Tech: Solidity, Foundry, Next.js, Chainlink CRE
- Theme: Paladin (medieval protector)
- Colors: Navy blue (#1a2742), Silver (#c0c5ce), Gold (#d4af37)

Task: Create contracts/src/Guardian.sol

Requirements:
- Only address with CRE_WORKFLOW_ROLE can call emergency functions
- emergencyWithdraw(protocol, token, amount, riskLevel) function
- 5-minute cooldown between withdrawals from same protocol
- Max withdrawal limit per protocol (configurable)
- Funds go to safeAddress (immutable)
- Events for all actions
- Custom errors (no require strings)
- NatSpec comments with Paladin theme

Please provide the complete file.
```

**Claude will provide complete, working code.**

---

**Save this document as `CLAUDE_CONTEXT.md` in your project root and reference it in every chat!** ⚔️