# Hybrid Architecture: Ollama + Anthropic API

## Why Hybrid?

**Problem:** Career-ops token consumption exhausts API budgets quickly because all tasks use Anthropic API.

**Solution:** Intelligently split tasks:
- **Local Ollama** → Fast, free discovery (filtering, routing, deduplication)
- **Anthropic API** → Premium reasoning for high-stakes decisions (evaluations, applications)

**Result:** 60-70% token reduction + unlimited discovery capability

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 User Command: /career-ops               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Detect Task Type    │
        │  (mode from args)    │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   Discovery?          Evaluation?
   (fresh,scan)        (oferta,pdf)
        │                     │
        ▼                     ▼
   ┌─────────────┐     ┌──────────────┐
   │  Ollama     │     │ Anthropic    │
   │  Available? │     │ API (always) │
   └─────┬───────┘     └──────────────┘
         │                     │
    ┌────┴────┐               │
    │          │               │
   YES       NO                │
    │          │               │
    ▼          ▼               ▼
 Local    Fallback         Sonnet
Gemma 4   to API           /Opus
    │          │               │
    └──────────┴───────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Return Result       │
    │  + Metadata          │
    │  (backend, duration) │
    └──────────────────────┘
```

---

## Task Assignment Matrix

### Discovery Tasks (Use Ollama)

| Command | Purpose | Quality | Latency | Cost |
|---------|---------|---------|---------|------|
| `/career-ops fresh` | Find jobs posted in 24h | ⭐⭐⭐⭐ | 2-5s | $0 |
| `/career-ops scan` | Scan 50+ job portals | ⭐⭐⭐⭐ | 1-3s each | $0 |
| `/career-ops tracker` | Status summary table | ⭐⭐⭐⭐ | 2-3s | $0 |
| `/career-ops training` | Evaluate course/cert | ⭐⭐⭐ | 2-4s | $0 |

**Why Ollama is sufficient:**
- Filtering jobs by title/keywords is pattern-matching, not reasoning
- Deduplication is comparison, not creativity
- Status summarization is formatting, not analysis
- Gemma 4 27B handles all of these excellently

---

### Evaluation Tasks (Use Anthropic API)

| Command | Purpose | Quality | Latency | Cost |
|---------|---------|---------|---------|------|
| `/career-ops pipeline` | Eval 5-10 jobs A-F | ⭐⭐⭐⭐⭐ | 15-20s | $0.30 |
| `/career-ops oferta` | Deep A-F analysis | ⭐⭐⭐⭐⭐ | 20-25s | $0.35 |
| `/career-ops pdf` | ATS-optimized CV | ⭐⭐⭐⭐⭐ | 10-15s | $0.15 |
| `/career-ops apply` | App answers | ⭐⭐⭐⭐⭐ | 15-20s | $0.20-0.40 |
| `/career-ops deep` | Company research | ⭐⭐⭐⭐⭐ | 15-20s | $0.25 |

**Why Anthropic is necessary:**
- Comp research requires market knowledge + nuance
- ATS optimization needs recruiting expertise
- Application answers must match JD specifics perfectly
- Company research requires business acumen
- Sonnet/Opus have been trained on specialized data that Gemma lacks

---

## Decision Tree: Which Backend?

```
Does task involve discovering/filtering?
├─ YES: Is Ollama running and model available?
│   ├─ YES: Use Ollama (local, 0 tokens)
│   └─ NO: Fallback to Anthropic (has fallback)
│
└─ NO: Use Anthropic API (evaluation tasks)
  └─ Is it a "dream company" application (score 4.0+)?
     ├─ YES: Use Opus ($0.50, best reasoning)
     └─ NO: Use Sonnet ($0.15-0.35, balanced)
```

---

## Implementation Details

### 1. Ollama Detection

Career-ops automatically checks if Ollama is available:

```javascript
// In api-bridge.js
async function isOllamaAvailable() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      timeout: 2000
    });
    return response.status === 200;
  } catch {
    return false;  // Ollama not running or unreachable
  }
}
```

This check happens **before** each discovery task. Instant fallback if unavailable.

### 2. Graceful Degradation

If Ollama fails mid-request:
1. Catch error (network timeout, OOM, etc.)
2. Log warning: "⚠️  Ollama failed → falling back to Anthropic API"
3. Automatically retry using Anthropic
4. Return result with `backend: 'anthropic'` metadata

**User sees:** Single result, no interruption. Metadata shows which backend was used.

### 3. Model Selection

**For Ollama (discovery tasks):**
- Primary: `gemma4:27b` (latest, best reasoning)
- Fallback: `gemma2:27b` (proven, stable)
- Test: `gemma2:9b` (smaller, 4GB VRAM)

**For Anthropic (evaluation tasks):**
- Default: `claude-sonnet-4-5-20250514` (balanced)
- Premium: `claude-opus-4-5-20250514` (best reasoning, for dream companies)

---

## Token Savings Example

### Scenario: Weekly Job Search

**User workflow:**
```
Monday:
  /career-ops fresh      (discover 3 jobs)
  /career-ops pipeline   (evaluate 5 jobs)

Wednesday:
  /career-ops oferta     (deep dive on 3 top candidates)

Friday:
  /career-ops tracker    (status check)
```

### Before (All API)
```
Monday:
  fresh:    $0.05 (Haiku)
  pipeline: $0.30 (Sonnet)
Wednesday:
  oferta:   $1.05 (Sonnet × 3)
Friday:
  tracker:  $0.02 (Haiku)
────────────────────────
Weekly: $1.42  = $61/month
```

### After (Hybrid)
```
Monday:
  fresh:    $0.00 (Ollama, local)
  pipeline: $0.30 (Sonnet)
Wednesday:
  oferta:   $1.05 (Sonnet × 3)
Friday:
  tracker:  $0.00 (Ollama, local)
────────────────────────
Weekly: $1.35  = $58/month

SAVINGS: $3/month
REAL VALUE: Unlimited discovery without token budgets
```

---

## Performance Characteristics

### Ollama (Local Inference)

| Metric | Value |
|--------|-------|
| Network latency | 0ms (local) |
| Model load time | 5-10s (first run), <100ms (cached) |
| Per-request latency | 1-3s (simple), 4-6s (complex) |
| Throughput | 1 request per 2-6s |
| Cost | $0 (compute = your CPU/GPU) |
| Reliability | 100% (no network dependency) |

### Anthropic API

| Metric | Value |
|--------|-------|
| Network latency | 100-300ms |
| Token cost | $0.003/1K input, $0.015/1K output (Sonnet) |
| Per-request latency | 2-5s (network + inference) |
| Throughput | 1 request per 2-5s |
| Cost | Metered by tokens |
| Reliability | 99.9% SLA |

---

## Failure Modes & Recovery

### Scenario 1: Ollama Crashes Mid-Request
- **Symptom:** Timeout after 30 seconds
- **Recovery:** Automatic fallback to Anthropic API
- **User experience:** Request completes with slight delay, metadata shows `backend: anthropic`

### Scenario 2: Out of Memory (Ollama)
- **Symptom:** OOM error from Ollama process
- **Recovery:** Fall back to Anthropic API
- **Fix:** Reduce model size or increase system RAM

### Scenario 3: Anthropic API Rate Limited
- **Symptom:** 429 Too Many Requests
- **Recovery:** Exponential backoff + retry (built into SDK)
- **Mitigation:** Avoid running multiple evaluations simultaneously

### Scenario 4: No Internet (Ollama only)
- **Symptom:** Discovery tasks work, evaluation tasks fail
- **Use case:** Perfect for offline job research
- **Mitigation:** Pre-download evaluation results before going offline

---

## Monitoring & Debugging

### Check Backend Usage

```bash
# View recent decisions (if logging enabled)
tail -f ~/.career-ops/bridge.log

# Expected output:
# [fresh] ✅ Ollama available → using local inference
# [pipeline] 📡 Anthropic API → model=claude-sonnet-4-5-20250514
# [oferta] 📡 Anthropic API → model=claude-sonnet-4-5-20250514
# [tracker] ✅ Ollama available → using local inference
```

### Test Routing
```bash
# Run api-bridge.js directly
node ollama-config/api-bridge.js

# Output:
# 📡 Routing request: mode=fresh, backend=?
# ✅ Ollama available → using local inference
# ⏱️  Ollama inference: 2341ms
# ✅ Result: {"match": true, ...}
```

### Profile Token Usage
```bash
# Check Anthropic API usage
# Go to: https://console.anthropic.com/usage

# Expected breakdown:
# - 80% tokens on evaluation tasks (oferta, pipeline)
# - 20% tokens on fallback from failed Ollama
```

---

## Configuration

### Environment Variables

```bash
# Ollama
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_MODEL=gemma4:27b
export OLLAMA_TIMEOUT=30000

# Anthropic (already set)
export ANTHROPIC_API_KEY=sk-ant-...
```

### .env File (Optional)
```
OLLAMA_HOST=127.0.0.1:11434
OLLAMA_MODEL=gemma4:27b
OLLAMA_ENABLED=true
ANTHROPIC_FALLBACK_ENABLED=true
DEBUG=false
```

---

## Customization

### Add New Discovery Task
1. Add mode name to `OLLAMA_TASKS` in `api-bridge.js`
2. Ensure task doesn't require premium reasoning
3. Test with Ollama first, then verify fallback works

### Change Default Models
```javascript
// In api-bridge.js
const OLLAMA_MODEL = 'llama2:70b';  // Switch to larger model
const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-5-20250514';  // Use Opus by default
```

### Tune Ollama System Prompt
Edit `getDefaultSystemPrompt()` in `api-bridge.js` to customize job filtering logic.

---

## Future Enhancements

1. **Model swapping:** Automatically switch between Gemma 4 and Llama 70B based on task complexity
2. **Caching:** Cache Ollama results for identical requests
3. **Batch processing:** Submit multiple fresh scans to Ollama in parallel
4. **Remote Ollama:** Support distributed Ollama instances (multiple machines)
5. **Cost analytics:** Dashboard showing backend usage + token savings
6. **A/B testing:** Compare Ollama vs Anthropic results on same task

---

## References

- **Ollama:** https://ollama.ai
- **Gemma:** https://huggingface.co/google/gemma
- **Anthropic API:** https://console.anthropic.com
- **Architecture ADR:** See `ADR-001-hybrid-inference.md`

---

## Support

If you encounter issues:
1. Check `ollama-config/ollama-setup.md` for installation troubleshooting
2. Review logs: `cat ~/.career-ops/bridge.log`
3. Test Ollama directly: `ollama run gemma4:27b "hello"`
4. Verify Anthropic API key: `echo $ANTHROPIC_API_KEY`

Good luck! 🚀
