/**
 * AI Analyzer - Divine Sight
 * 
 * Uses Ollama AI to analyze exploit transactions and extract vulnerability patterns.
 * Returns structured analysis with confidence scores and recommended actions.
 */

import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:8b';

/**
 * Calls Ollama API for chat completion
 * @param {string} prompt - The prompt to send to Ollama
 * @returns {Promise<string>} The AI response
 */
async function callOllama(prompt) {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.3, // Lower temperature for more focused analysis
                    top_p: 0.9,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('❌ Ollama API call failed:', error.message);
        throw error;
    }
}

/**
 * Analyzes an exploit using Ollama AI
 * @param {Object} transaction - The suspicious transaction to analyze
 * @returns {Object} AI analysis with patterns, confidence, and recommendations
 */
export async function analyzeExploit(transaction) {
    console.log('👁️  Divine Sight activates...');
    console.log(`🤖 Using Ollama (${OLLAMA_MODEL}) at ${OLLAMA_BASE_URL}`);

    const prompt = `You are a DeFi security expert analyzing a suspicious blockchain transaction for potential exploits.

TRANSACTION DATA:
Hash: ${transaction.hash || 'N/A'}
From: ${transaction.from || 'N/A'}
To: ${transaction.to || 'N/A'}
Value: ${transaction.value || '0'} ETH
Gas Used: ${transaction.gasUsed || 'N/A'}
Status: ${transaction.status || 'N/A'}
Anomaly Score: ${transaction.anomalyScore || 0}/10

${transaction.logs ? `Transaction Logs: ${JSON.stringify(transaction.logs, null, 2)}` : ''}

TASK:
Analyze this transaction and provide a structured JSON response with:

1. exploitType: Type of exploit detected (e.g., "reentrancy", "flash-loan", "price-manipulation", "access-control", "integer-overflow", "none")
2. confidence: Confidence score from 0-100
3. vulnerabilityPattern: Technical description of the vulnerability pattern
4. affectedComponents: List of contract components that could be vulnerable
5. riskLevel: Risk level from 1-10
6. recommendedAction: "EMERGENCY_WITHDRAW" | "PARTIAL_WITHDRAW" | "ALERT" | "MONITOR"
7. reasoning: Brief explanation of your analysis

Respond ONLY with valid JSON, no additional text.`;

    try {
        const startTime = Date.now();
        const aiResponse = await callOllama(prompt);
        const analysisTime = Date.now() - startTime;
        
        console.log(`⏱️  Analysis completed in ${analysisTime}ms`);
        
        // Extract JSON from response (handle cases where model adds text)
        let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('⚠️  Could not extract JSON from AI response, using fallback');
            return createFallbackAnalysis(transaction);
        }

        const analysis = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the response
        const normalizedAnalysis = {
            exploitType: analysis.exploitType || 'unknown',
            confidence: Math.min(100, Math.max(0, analysis.confidence || 0)),
            vulnerabilityPattern: analysis.vulnerabilityPattern || 'Pattern analysis inconclusive',
            affectedComponents: Array.isArray(analysis.affectedComponents) ? analysis.affectedComponents : [],
            riskLevel: Math.min(10, Math.max(1, analysis.riskLevel || 5)),
            recommendedAction: analysis.recommendedAction || 'MONITOR',
            reasoning: analysis.reasoning || 'Analysis completed',
            analysisTime: analysisTime,
            model: OLLAMA_MODEL
        };

        console.log(`✅ Exploit Type: ${normalizedAnalysis.exploitType}`);
        console.log(`📊 Risk Level: ${normalizedAnalysis.riskLevel}/10`);
        console.log(`🎯 Action: ${normalizedAnalysis.recommendedAction}`);

        return normalizedAnalysis;

    } catch (error) {
        console.error('❌ AI analysis failed:', error.message);
        return createFallbackAnalysis(transaction);
    }
}

/**
 * Creates a fallback analysis when AI fails
 * @param {Object} transaction - The transaction data
 * @returns {Object} Basic analysis based on anomaly score
 */
function createFallbackAnalysis(transaction) {
    const anomalyScore = transaction.anomalyScore || 0;
    
    let riskLevel, recommendedAction;
    if (anomalyScore >= 9) {
        riskLevel = 10;
        recommendedAction = 'EMERGENCY_WITHDRAW';
    } else if (anomalyScore >= 7) {
        riskLevel = 8;
        recommendedAction = 'PARTIAL_WITHDRAW';
    } else if (anomalyScore >= 5) {
        riskLevel = 6;
        recommendedAction = 'ALERT';
    } else {
        riskLevel = 4;
        recommendedAction = 'MONITOR';
    }

    return {
        exploitType: 'unknown',
        confidence: 50,
        vulnerabilityPattern: 'AI analysis unavailable - using anomaly score heuristics',
        affectedComponents: [],
        riskLevel,
        recommendedAction,
        reasoning: 'Fallback analysis based on anomaly detection score',
        analysisTime: 0,
        model: 'fallback'
    };
}

// Standalone testing
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🧪 Testing AI Analyzer with Ollama...\n');
    
    const mockTransaction = {
        hash: '0x123abc...',
        from: '0xAttacker...',
        to: '0xVulnerableContract...',
        value: '1000',
        gasUsed: '500000',
        status: 'success',
        anomalyScore: 9.2,
        logs: [
            { event: 'Transfer', data: '1000 ETH' },
            { event: 'Withdrawal', data: 'Reentrancy detected' }
        ]
    };

    analyzeExploit(mockTransaction)
        .then(result => {
            console.log('\n📋 Analysis Result:');
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(console.error);
}
