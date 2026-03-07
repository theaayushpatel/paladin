/**
 * Paladin Protocol — Chainlink CRE Workflow
 *
 * Real Chainlink CRE SDK (TypeScript compiled to WASM) workflow that:
 *  1. Triggers every minute via CronCapability
 *  2. Fetches the latest Arbitrum Sepolia block via HTTPClient (Alchemy RPC)
 *  3. Detects suspicious high-frequency / high-gas transactions
 *  4. AI-classifies threats via HTTPClient → Ollama (llama3.1:8b)
 *  5. Reads current on-chain state via EVMClient.callContract
 *  6. Records confirmed threats via EVMClient.writeReport (CRE report mechanism)
 *
 * Compile:  bun x cre-compile index.ts
 * Simulate: cre workflow simulate . --target local-simulation --trigger-index 0 --broadcast
 */

import {
  CronCapability,
  HTTPClient,
  EVMClient,
  handler,
  Runner,
  type Runtime,
  ok,
  json,
  encodeCallMsg,
  prepareReportRequest,
  LAST_FINALIZED_BLOCK_NUMBER,
  consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";
import {
  encodeFunctionData,
  decodeFunctionResult,
  type Address,
  zeroAddress,
  type Hex,
} from "viem";

// ── Configuration type ────────────────────────────────────────────────────────
type Config = {
  riskRegistryAddress: string;
  guardianAddress: string;
  vulnerableProtocolAddress: string;
  alchemyRpcUrl: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
};

// ── ABI (minimal subset for reads and writes) ─────────────────────────────────
const RISK_REGISTRY_ABI = [
  {
    name: "eventCount",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "recordThreat",
    type: "function",
    inputs: [
      { name: "protocol",       type: "address" },
      { name: "token",          type: "address" },
      { name: "amount",         type: "uint256" },
      { name: "riskLevel",      type: "uint8" },
      { name: "actionType",     type: "uint8" },
      { name: "exploitPattern", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

// ── Chain setup ───────────────────────────────────────────────────────────────
// Arbitrum Sepolia chain selector
const ARB_SEPOLIA_CHAIN_SELECTOR = 3478487238524512106n;

// ── Workflow handler ──────────────────────────────────────────────────────────
const paladinsWatch = (runtime: Runtime<Config>) => {
  const {
    riskRegistryAddress,
    vulnerableProtocolAddress,
    alchemyRpcUrl,
    ollamaBaseUrl,
    ollamaModel,
  } = runtime.config;

  runtime.log("Paladin: scanning Arbitrum Sepolia for exploit patterns…");

  // Instantiate capabilities inside the handler (CRE pattern)
  const httpClient = new HTTPClient();
  const evmClient = new EVMClient(ARB_SEPOLIA_CHAIN_SELECTOR);

  // ── Step 1: Fetch latest block via HTTP (Alchemy JSON-RPC) ──────────────────
  const blockPayload = new TextEncoder().encode(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBlockByNumber",
      params: ["latest", false],
      id: 1,
    }),
  );

  const blockData = httpClient.sendRequest(
    runtime,
    (sendRequester) => {
      const resp = sendRequester
        .sendRequest({
          url: alchemyRpcUrl,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: blockPayload,
        })
        .result();

      if (!ok(resp)) {
        throw new Error(`Alchemy RPC error: ${resp.statusCode}`);
      }

      return json(resp) as {
        result: {
          number: string;
          transactions: string[];
          timestamp: string;
          gasUsed: string;
        };
      };
    },
    consensusIdenticalAggregation(),
  )().result();

  const blockNumber = parseInt(blockData.result.number, 16);
  const txCount = blockData.result.transactions.length;
  const gasUsed = parseInt(blockData.result.gasUsed, 16);

  runtime.log(`Block ${blockNumber}: ${txCount} txs, gasUsed=${gasUsed}`);

  // ── Step 2: Heuristic risk scoring ──────────────────────────────────────────
  // Thresholds calibrated for Arbitrum Sepolia testnet (low traffic: 1-20 txs, 100k-2M gas)
  const txScore  = txCount  > 10 ? 50 : txCount  > 5 ? 30 : 10;
  const gasScore = gasUsed  > 1_500_000 ? 40 : gasUsed > 400_000 ? 20 : 5;
  const riskScore = txScore + gasScore;
  const isSuspicious = riskScore >= 50;

  if (!isSuspicious) {
    runtime.log(
      `Block ${blockNumber}: clean (risk=${riskScore}/100) — no action needed`,
    );
    return { blockNumber, riskScore, action: "MONITOR" as const };
  }

  runtime.log(
    `Block ${blockNumber}: suspicious (risk=${riskScore}/100) — invoking AI analysis…`,
  );

  // ── Step 3: AI threat classification via Ollama ───────────────────────────
  const prompt =
    `You are a blockchain security analyzer. Analyze the following activity:\n` +
    `Block: ${blockNumber} on Arbitrum Sepolia\n` +
    `Transactions: ${txCount}\n` +
    `Gas used: ${gasUsed}\n` +
    `Risk score: ${riskScore}/100\n` +
    `Monitored protocol: ${vulnerableProtocolAddress}\n\n` +
    `Respond ONLY with a valid JSON object (no markdown):\n` +
    `{"exploitType":"reentrancy|flashloan|oracle_manipulation|sandwich|none",` +
    `"confidence":0-100,"severity":1-5,"action":"EMERGENCY_PAUSE|RECORD_THREAT|MONITOR|NONE"}`;

  const aiPayload = new TextEncoder().encode(
    JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
      format: "json",
    }),
  );

  const aiResult = httpClient.sendRequest(
    runtime,
    (sendRequester) => {
      const resp = sendRequester
        .sendRequest({
          url: `${ollamaBaseUrl}/api/generate`,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: aiPayload,
        })
        .result();

      if (!ok(resp)) {
        throw new Error(`Ollama error: ${resp.statusCode}`);
      }

      const body = json(resp) as { response: string };
      return JSON.parse(body.response) as {
        exploitType: string;
        confidence: number;
        severity: number;
        action: string;
      };
    },
    consensusIdenticalAggregation(),
  )().result();

  runtime.log(
    `AI: ${aiResult.exploitType} confidence=${aiResult.confidence}% ` +
      `severity=${aiResult.severity}/5 → ${aiResult.action}`,
  );

  // ── Step 4: Read current on-chain state (EVMClient read) ──────────────────
  const eventCountCallData = encodeFunctionData({
    abi: RISK_REGISTRY_ABI,
    functionName: "eventCount",
  });

  const callResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: riskRegistryAddress as Address,
        data: eventCountCallData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const [currentEventCount] = decodeFunctionResult({
    abi: RISK_REGISTRY_ABI,
    functionName: "eventCount",
    data: callResult.data as Hex,
  }) as [bigint];

  runtime.log(`RiskRegistry.eventCount = ${currentEventCount.toString()}`);

  // ── Step 5: Record threat on-chain (EVMClient write via CRE report) ────────
  // Confidence threshold per design spec: only act if >80% confident
  if (aiResult.confidence >= 80 && aiResult.severity >= 3) {
    // Map AI severity (1-5) → contract RiskLevel enum (0=LOW,1=MEDIUM,2=HIGH,3=CRITICAL)
    const riskLevel = aiResult.severity >= 5 ? 3
                    : aiResult.severity === 4 ? 3  // CRITICAL
                    : aiResult.severity === 3 ? 2  // HIGH
                    : aiResult.severity === 2 ? 1  // MEDIUM
                    : 0;                            // LOW
    // ActionType: 0=ALERT, 1=WITHDRAWAL, 2=GOVERNANCE_PROPOSAL
    // severity 5=CRITICAL→WITHDRAWAL, 4=HIGH→WITHDRAWAL, 3=MEDIUM→ALERT
    const actionType = aiResult.severity >= 4 ? 1 : 0;
    // Amount in wei — use 15.5 ETH sentinel for demo exploit pattern
    const amountWei = BigInt("15500000000000000000");

    const recordThreatData = encodeFunctionData({
      abi: RISK_REGISTRY_ABI,
      functionName: "recordThreat",
      args: [
        vulnerableProtocolAddress as Address,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // ETH sentinel
        amountWei,
        riskLevel,
        actionType,
        `${aiResult.exploitType}: detected by Paladin (action=${aiResult.action})`,
      ],
    });

    const report = runtime.report(prepareReportRequest(recordThreatData)).result();

    const writeResult = evmClient
      .writeReport(runtime, {
        receiver: riskRegistryAddress as `0x${string}`,
        report,
        gasConfig: { gasLimit: "500000" },
      })
      .result();

    runtime.log(
      `Threat recorded on-chain: exploit=${aiResult.exploitType} severity=${aiResult.severity}`,
    );

    return {
      blockNumber,
      riskScore,
      exploitType: aiResult.exploitType,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      action: aiResult.action,
      previousEventCount: currentEventCount.toString(),
    };
  }

  runtime.log(
    `Below recording threshold (confidence=${aiResult.confidence}, severity=${aiResult.severity}) — monitoring`,
  );
  return {
    blockNumber,
    riskScore,
    exploitType: aiResult.exploitType,
    confidence: aiResult.confidence,
    severity: aiResult.severity,
    action: "MONITOR" as const,
  };
};

// ── Workflow initialization ───────────────────────────────────────────────────
const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [
    handler(
      cron.trigger({ schedule: "0 */1 * * * *" }),
      paladinsWatch,
    ),
  ];
};

// ── Entry point ───────────────────────────────────────────────────────────────
export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

