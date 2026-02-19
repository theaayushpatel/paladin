# Ollama Setup Guide for Paladin Protocol

Complete guide for setting up and using Ollama AI for local exploit analysis.

## 🤖 What is Ollama?

Ollama is a tool that lets you run large language models (LLMs) locally on your machine. This means:
- ✅ **No API costs** - Completely free to use
- ✅ **Privacy** - Data never leaves your machine
- ✅ **Speed** - Low latency analysis
- ✅ **Offline** - Works without internet (after initial model download)

## 📦 Installation

### Linux & macOS

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows

Download and install from: [ollama.com/download](https://ollama.com/download)

### Verify Installation

```bash
ollama --version
```

## 🚀 Quick Start

### 1. Start Ollama Server

```bash
ollama serve
```

This starts the Ollama API server on `http://localhost:11434`.

**Note:** Keep this terminal window open while using Paladin Protocol.

### 2. Pull the AI Model

```bash
# Recommended model for Paladin (good balance of speed/quality)
ollama pull llama3.1:8b

# Alternative models:
# ollama pull llama3.1:70b    # Better quality, slower, needs more RAM
# ollama pull codellama:13b   # Optimized for code analysis
# ollama pull mistral:7b      # Faster, less RAM needed
```

### 3. Test the Model

```bash
ollama run llama3.1:8b "Explain what a reentrancy attack is in DeFi"
```

### 4. Verify API is Working

```bash
curl http://localhost:11434/api/version
```

Expected output:
```json
{"version":"0.x.x"}
```

## ⚙️ Configuration

### Environment Variables

In your `cre-workflow/.env` file:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### Available Models for Paladin

| Model | Size | RAM Needed | Speed | Quality | Best For |
|-------|------|------------|-------|---------|----------|
| `llama3.1:8b` | 4.7GB | 8GB | Fast | Good | **Recommended** - Best balance |
| `llama3.1:70b` | 40GB | 48GB | Slow | Excellent | High-accuracy analysis |
| `mistral:7b` | 4.1GB | 8GB | Very Fast | Good | Quick scans |
| `codellama:13b` | 7.3GB | 16GB | Medium | Very Good | Code-focused analysis |
| `deepseek-coder:6.7b` | 3.8GB | 8GB | Fast | Good | Code patterns |

### Switching Models

```bash
# Pull new model
ollama pull mistral:7b

# Update .env file
OLLAMA_MODEL=mistral:7b

# Restart your workflow
```

## 🧪 Testing

### Test Ollama Directly

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "What is a smart contract vulnerability?",
  "stream": false
}'
```

### Test with Paladin

```bash
cd cre-workflow
npm run test:analyzer
```

Expected output:
```
🧪 Testing AI Analyzer with Ollama...
⚙️  Make sure Ollama is running: ollama serve
⚙️  Model required: llama3.1:8b

👁️  Divine Sight activates...
🤖 Using Ollama (llama3.1:8b) at http://localhost:11434
⏱️  Analysis completed in 2341ms
✅ Exploit Type: reentrancy
📊 Risk Level: 9/10
...
```

## 🔧 Troubleshooting

### "Connection refused to localhost:11434"

**Solution:** Start Ollama server
```bash
ollama serve
```

### "Model not found: llama3.1:8b"

**Solution:** Pull the model
```bash
ollama pull llama3.1:8b
```

### "Out of memory" / Slow Performance

**Solution:** Use a smaller model
```bash
ollama pull mistral:7b
# Update OLLAMA_MODEL in .env to mistral:7b
```

### Model Taking Too Long to Respond

**Possible causes:**
1. First run (model loading into memory)
2. System resources low
3. Model too large for your hardware

**Solutions:**
1. Wait for first run to complete (30-60s)
2. Close other applications
3. Use smaller model (`mistral:7b` instead of `llama3.1:8b`)

### JSON Parsing Errors

If AI returns invalid JSON:
1. Paladin automatically falls back to heuristic analysis
2. Try different model: `codellama:13b` is better at structured output
3. Increase temperature in `aiAnalyzer.js` (makes output more deterministic)

## ⚡ Performance Optimization

### Speed Up Analysis

1. **Keep Ollama running** - Don't restart between analyses
2. **Use smaller models** - `mistral:7b` is 2-3x faster than `llama3.1:8b`
3. **Reduce context** - Limit transaction logs to first 5 events
4. **Enable GPU** - Ollama automatically uses GPU if available

### Check if GPU is Being Used

```bash
# During analysis, check GPU usage
nvidia-smi  # NVIDIA GPUs
rocm-smi    # AMD GPUs
```

### Model Performance Tips

```bash
# Set CPU threads (adjust based on your system)
export OLLAMA_NUM_THREADS=8

# Set GPU layers (higher = more GPU usage)
export OLLAMA_NUM_GPU=999
```

## 📊 Expected Performance

### Typical Analysis Times

| Model | CPU (8 cores) | GPU (RTX 3060) | GPU (RTX 4090) |
|-------|---------------|----------------|----------------|
| `mistral:7b` | 2-4s | 1-2s | <1s |
| `llama3.1:8b` | 3-6s | 1-3s | 1-2s |
| `llama3.1:70b` | 30-60s | 5-10s | 3-5s |

## 🔄 Running in Production

### Keep Ollama Running (systemd on Linux)

Create `/etc/systemd/system/ollama.service`:

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=your-user
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

### Docker Setup

```dockerfile
# Dockerfile for Paladin with Ollama
FROM ollama/ollama:latest

# Pull model during build
RUN ollama pull llama3.1:8b

# Start Ollama server
CMD ["ollama", "serve"]
```

## 🆚 Ollama vs Claude API

| Feature | Ollama (Local) | Claude API |
|---------|----------------|------------|
| Cost | ✅ Free | ❌ ~$3-15 per 1M tokens |
| Privacy | ✅ Fully private | ⚠️ Data sent to Anthropic |
| Speed | ⚠️ Depends on hardware | ✅ Consistent fast |
| Quality | ⚠️ Good (model dependent) | ✅ Excellent |
| Setup | ⚠️ Requires installation | ✅ Just API key |
| Offline | ✅ Works offline | ❌ Needs internet |
| Scaling | ⚠️ Limited by hardware | ✅ Unlimited |

**Recommendation:**
- **Development/Testing**: Use Ollama (free, private)
- **Production/24x7**: Consider Claude API (more reliable, better quality)
- **Hybrid**: Use Ollama with Claude fallback

## 🔗 Resources

- **Ollama Website**: [ollama.com](https://ollama.com)
- **Ollama GitHub**: [github.com/ollama/ollama](https://github.com/ollama/ollama)
- **Model Library**: [ollama.com/library](https://ollama.com/library)
- **Discord Community**: [discord.gg/ollama](https://discord.gg/ollama)

## 📝 Advanced Configuration

### Custom Model Parameters

Edit `cre-workflow/src/analysis/aiAnalyzer.js`:

```javascript
const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
            temperature: 0.3,      // 0.0-1.0 (lower = more focused)
            top_p: 0.9,           // 0.0-1.0 (nucleus sampling)
            top_k: 40,            // Limits vocabulary choices
            num_predict: 512,     // Max tokens to generate
            repeat_penalty: 1.1,  // Penalize repetition
        }
    })
});
```

### Multiple Model Strategy

Use different models for different tasks:
- **Quick scan**: `mistral:7b`
- **Deep analysis**: `llama3.1:70b`
- **Code review**: `codellama:13b`

---

**⚔️ Ready to analyze exploits locally with Ollama!**

For issues or questions, check the [Ollama documentation](https://github.com/ollama/ollama/tree/main/docs) or Paladin's troubleshooting guide.
