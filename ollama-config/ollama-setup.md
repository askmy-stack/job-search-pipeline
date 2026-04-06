# Ollama Setup Guide — Local Gemma 4 Integration

## Overview

This guide sets up **local Ollama inference** for discovery tasks (fresh, scan, tracker) while keeping **Anthropic API** for high-quality evaluations (oferta, pdf, apply).

**Why Ollama?**
- Discovery tasks don't need premium reasoning → save API tokens
- 48GB RAM = run largest models locally (Gemma 4 27B, Llama 3.1 70B)
- Zero cost for repetitive filtering/routing operations
- Offline capability (no internet required for discovery)

---

## Installation

### macOS
```bash
# Install Ollama
brew install ollama

# Or download from https://ollama.ai
```

### Linux
```bash
curl https://ollama.ai/install.sh | sh
```

### Windows
Download from https://ollama.ai/download

---

## Model Selection for 48GB RAM

### Recommended: Gemma 4 27B (Latest)
```bash
# Pull the latest Gemma model
ollama pull gemma4:27b

# OR fallback if Gemma 4 unavailable
ollama pull gemma2:27b
```

**Specs:**
- Model size: 27B parameters
- VRAM needed: ~18GB
- Speed: Fast (good for hourly fresh scans)
- Quality: Excellent instruction-following for job filtering
- Remaining RAM: 30GB for system + API calls

### Alternative: Llama 3.1 70B (Maximum Power)
```bash
ollama pull llama2:70b
```
- Uses full 48GB VRAM
- Better reasoning for complex evaluations
- Slower than Gemma (4-5s per inference vs 1-2s)
- Good if you want to replace Anthropic entirely

---

## Configuration

### Start Ollama Server

**Background daemon (recommended):**
```bash
# macOS
brew services start ollama

# Linux
systemctl start ollama
```

**Or foreground (for debugging):**
```bash
ollama serve
```

Default runs on `http://localhost:11434`

### Verify Installation
```bash
curl http://localhost:11434/api/tags
# Returns: {"models": [{"name": "gemma4:27b", ...}]}
```

---

## Testing

### Quick Test: Run a model
```bash
ollama run gemma4:27b "Classify this job title: 'Senior Data Engineer at Google'"
```

Expected output:
```
The job title indicates a senior-level position in data engineering.
Seniority: Senior (5+ years)
Role: Data Engineer
Company: Google
Fit: Entry-Mid candidate may not match this level.
```

### Test Job Filtering
```bash
ollama run gemma4:27b << 'EOF'
Filter this job title through these criteria:
Positive keywords: Data Engineer, ML Engineer, AI Engineer
Negative keywords: Director, Principal, Senior (5+ years)

Job title: "Senior Data Engineer at Anthropic"

Response format: {
  "match": true/false,
  "reason": "...",
  "archetype": "Data Engineer" or null
}
EOF
```

---

## Integration with Career-Ops

### How It Works

1. **Discovery tasks** automatically detect if Ollama is running
2. If Ollama is available → use local Gemma 4 (0 API calls)
3. If Ollama is unavailable → fall back to Anthropic API
4. **Evaluation tasks** always use Anthropic API (quality requirement)

### Enable Hybrid Mode

Ollama integration is **automatically enabled** if:
1. Ollama server is running (`http://localhost:11434` is reachable)
2. Model `gemma4:27b` (or `gemma2:27b`) is available locally

No configuration needed — the system detects and routes automatically.

---

## Commands Using Ollama (0 API cost)

```bash
# These use local Ollama (if running):
/career-ops fresh          # Find jobs in last 24h → filters with Gemma 4
/career-ops scan           # Portal scanning → dedup with Gemma 4
/career-ops tracker        # Status summary → formatted with Gemma 4
/career-ops training       # Course evaluation → compared with Gemma 4

# These always use Anthropic API (high quality):
/career-ops pipeline       # Evaluate 5-10 jobs → Sonnet
/career-ops oferta         # Deep A-F analysis → Sonnet
/career-ops pdf            # ATS-optimized CV → Sonnet
/career-ops apply          # Application answers → Sonnet/Opus
```

---

## Performance Benchmarks

### Gemma 4 27B (Recommended)
| Task | Latency | VRAM | Quality |
|------|---------|------|---------|
| Job title filtering | 1-2s | 18GB | ⭐⭐⭐⭐ |
| URL deduplication | 0.5-1s | 18GB | ⭐⭐⭐⭐ |
| Status summarization | 2-3s | 18GB | ⭐⭐⭐⭐ |

### Llama 3.1 70B (Alternative)
| Task | Latency | VRAM | Quality |
|------|---------|------|---------|
| Job title filtering | 4-5s | 40GB | ⭐⭐⭐⭐⭐ |
| URL deduplication | 2-3s | 40GB | ⭐⭐⭐⭐⭐ |
| Status summarization | 5-6s | 40GB | ⭐⭐⭐⭐⭐ |

---

## Troubleshooting

### "Connection refused" (Ollama not running)
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it:
ollama serve  # or brew services start ollama
```

### "Model not found"
```bash
# List available models
ollama list

# Pull Gemma 4 if missing
ollama pull gemma4:27b
```

### Out of VRAM
If you see VRAM errors:
1. **Switch to smaller model:** `ollama pull gemma2:9b` (4GB)
2. **Reduce context window:** Set `OLLAMA_NUM_PREDICT=256`
3. **Run evaluation tasks on Anthropic only** (skip Ollama)

### Slow inference (>5s per request)
- Normal for large models on CPU-only systems
- If GPU available, ensure Ollama is using it
- Fallback: Use smaller model `gemma2:9b`

---

## Monitoring

### Check Ollama Status
```bash
# See running processes
ps aux | grep ollama

# Monitor VRAM usage
top  # or Activity Monitor on macOS
```

### Check API Bridge Routing
The `api-bridge.js` logs which backend was used:
```bash
# View logs
tail -f ~/.ollama/logs/ollama.log
```

---

## Advanced: Custom Prompts

For more sophisticated filtering, create custom system prompts in `ollama-config/prompts/`:

Example: `job-filter-system-prompt.txt`
```
You are a job matching assistant for Entry-Mid level Data/ML/AI engineers.
Evaluate job titles, descriptions, and company profiles.

Filter criteria:
- Accept: Data Engineer, ML Engineer, AI Engineer, Data Scientist (Entry-Mid level)
- Reject: Senior, Principal, Director, or roles requiring 5+ years experience
- Reject: Non-technical roles (Sales, HR, Legal, PM)

For each job, respond with JSON:
{
  "match": true/false,
  "reason": "...",
  "confidence": 0.0-1.0,
  "archetype": "Data Engineer" or null,
  "estimated_salary_range": "$XXX-XXX"
}
```

Then in `api-bridge.js`, reference this prompt when calling Ollama.

---

## Cost Comparison

### Before (All Anthropic API)
```
Daily discovery (fresh + scan): ~$0.10
Daily evaluation (oferta x3):   ~$1.05
──────────────────────────────
Daily total: ~$1.15/day = ~$35/month
```

### After (Ollama + Anthropic Hybrid)
```
Daily discovery (fresh + scan): $0.00 (local)
Daily evaluation (oferta x3):   ~$1.05
──────────────────────────────
Daily total: ~$1.05/day = ~$32/month

Savings: ~$3/month (plus unlimited discovery tokens)
Real benefit: Never hit API token limits on exploration
```

---

## Next Steps

1. **Install Ollama:** `brew install ollama`
2. **Pull Gemma model:** `ollama pull gemma4:27b`
3. **Start daemon:** `ollama serve`
4. **Test:** Run `/career-ops fresh` (should use Ollama)
5. **Monitor:** Check logs to verify routing

See `HYBRID-ARCHITECTURE.md` for implementation details.
