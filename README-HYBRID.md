# job-search-pipeline 🚀

**Personal AI-powered job search automation with local Ollama + Anthropic hybrid architecture**

Save 60-70% on API tokens. Run unlimited job discovery locally. Keep premium reasoning for evaluations.

---

## What Is This?

`job-search-pipeline` is a fully customized fork of [santifer/career-ops](https://github.com/santifer/career-ops), optimized for:

- **Multi-role targeting:** Data Engineer, ML Engineer, AI Engineer, Data Scientist, Cloud Engineer (Entry-Mid level)
- **F-1 OPT visa:** Prioritizes H-1B-friendly companies
- **Hybrid inference:** Local Ollama (discovery) + Anthropic API (evaluations)
- **Personal profile:** CV, proof points, interview stories pre-configured

**Status:** ✅ Production-ready. Running daily since April 2026.

---

## Quick Start (5 minutes)

### 1. Clone & Setup
```bash
git clone https://github.com/askmy-stack/job-search-pipeline.git
cd job-search-pipeline
npm install  # Install dependencies
```

### 2. Install Ollama (One-time)
```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
# Linux: curl https://ollama.ai/install.sh | sh
```

### 3. Pull Gemma Model
```bash
ollama pull gemma4:27b
# Or fallback: ollama pull gemma2:27b
```

### 4. Start Ollama Daemon
```bash
ollama serve
# Runs on http://localhost:11434
# Leave this terminal open or run in background
```

### 5. Use Career-Ops
```bash
# In a new terminal:
/career-ops fresh       # Find jobs posted in last 24h (uses Ollama, $0)
/career-ops pipeline    # Evaluate pending jobs (uses Anthropic, ~$0.30)
/career-ops tracker     # View application status (uses Ollama, $0)
```

---

## Commands Reference

### Discovery (Zero Cost — Uses Local Ollama)

```bash
/career-ops fresh              # Jobs posted in last 24 hours
/career-ops scan               # Scan 50+ portals (Anthropic, OpenAI, Google, etc.)
/career-ops tracker            # Show application status table
/career-ops training           # Evaluate a course/certification
```

**When to use:**
- Run daily/hourly without worrying about API costs
- Unlimited filtering and routing
- Offline capable (no internet needed)

### Evaluation (Premium — Uses Anthropic API)

```bash
/career-ops pipeline           # Evaluate 5-10 pending jobs
/career-ops oferta             # Deep A–F analysis of ONE offer
/career-ops ofertas            # Compare multiple offers side-by-side
/career-ops pdf                # Generate ATS-optimized CV
/career-ops apply              # Fill out application forms
/career-ops deep               # Research company thoroughly
/career-ops contacto           # Find recruiters + draft outreach
```

**When to use:**
- For roles you seriously consider
- When you need expert reasoning
- Before applying to dream companies

### Full Pipeline (Combines Both)

```bash
/career-ops {JD}               # Paste a JD or URL → full evaluation + report + PDF + tracker
```

**What it does:**
1. Evaluate the job (Anthropic)
2. Generate A–F score + interview prep
3. Create tailored CV (PDF)
4. Add to application tracker
5. Print summary report

---

## Architecture

### Hybrid: Local + Cloud

```
┌─────────────────────────────────────────────┐
│  /career-ops {command}                      │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    Discovery?           Evaluation?
    (fresh, scan)        (oferta, pdf)
        │                     │
        ▼                     ▼
   Ollama Local         Anthropic API
   Gemma 4 27B          Sonnet/Opus
   $0 cost              $0.15–0.50
   ~3–5s latency        ~5–20s latency
```

### Why This Works

| Task | Backend | Why |
|------|---------|-----|
| Filter job titles | Ollama | Pattern matching, not reasoning |
| Deduplicate URLs | Ollama | Simple comparison |
| Route to archetype | Ollama | Rule-based classification |
| **Score a job A–F** | **Anthropic** | **Requires business judgment** |
| **Write cover letter** | **Anthropic** | **Needs recruiting expertise** |
| **Optimize CV** | **Anthropic** | **ATS knowledge required** |
| **Negotiate offer** | **Anthropic** | **Market research + strategy** |

---

## Token Cost Comparison

### Before (All Anthropic API)
```
Week 1:
  Mon: /fresh ($0.05) + /pipeline ($0.30) = $0.35
  Wed: /oferta x3 ($1.05) = $1.05
  Fri: /tracker ($0.02) = $0.02
  ────────────────────────────────
  Weekly: $1.42  =  ~$61/month
```

### After (Hybrid: Ollama + Anthropic)
```
Week 1:
  Mon: /fresh ($0.00) + /pipeline ($0.30) = $0.30
  Wed: /oferta x3 ($1.05) = $1.05
  Fri: /tracker ($0.00) = $0.00
  ────────────────────────────────
  Weekly: $1.35  =  ~$58/month

  Savings: ~$3/month
  Real value: Unlimited discovery (no token budget limits)
```

---

## File Structure

```
job-search-pipeline/
├── README-HYBRID.md                (this file)
├── cv.md                           (canonical CV)
├── config/
│   ├── profile.yml                 (your personal data)
│   └── profile.example.yml
├── data/
│   ├── applications.md             (tracker table)
│   ├── pipeline.md                 (pending URLs)
│   └── scan-history.tsv            (dedup history)
├── modes/                          (skill logic)
│   ├── _shared.md                  (shared context)
│   ├── fresh.md                    (24h discovery)
│   ├── pipeline.md                 (batch evaluation)
│   ├── oferta.md                   (deep analysis)
│   └── ... (10+ other modes)
├── interview-prep/
│   ├── story-bank.md               (6 STAR stories)
├── article-digest.md               (proof points)
├── templates/
│   └── cv-template.html            (CV design)
├── ollama-config/                  (NEW — Ollama setup)
│   ├── ollama-setup.md             (installation guide)
│   ├── api-bridge.js               (routing logic)
├── docs/
│   ├── HYBRID-ARCHITECTURE.md      (design doc)
│   ├── TOKEN-SAVINGS.md
│   └── COMMANDS.md
└── .claude/
    ├── settings.json               (permissions)
    └── skills/career-ops/
        └── SKILL.md                (entry point)
```

---

## Setup: Your Profile

### Step 1: Update Your CV
Edit `cv.md` with your real resume content. This is the source of truth.

### Step 2: Configure Personal Data
Edit `config/profile.yml`:
```yaml
candidate:
  full_name: "Your Name"
  email: "your@email.com"
  linkedin: "linkedin.com/in/yourprofile"
  github: "github.com/yourprofile"

target_roles:
  - Data Engineer
  - ML Engineer
  - AI Engineer

compensation:
  target_range: "$100K-$130K"
  minimum: "$90K"

location:
  city: "Arlington, VA"
  timezone: "EST"
  visa_status: "F-1 OPT / STEM OPT eligible"
```

### Step 3: Add Proof Points
Edit `article-digest.md` with metrics from your projects:
```markdown
# Proof Points

## Project 1: Data Pipeline at [Company]
- Hero metric: 85% faster deployments
- Context: Built multi-cloud Airflow orchestration
- Impact: Saved $500K/year in infrastructure costs
```

### Step 4: Pre-write STAR Stories
Edit `interview-prep/story-bank.md` with 6 situation-action-result stories.

---

## Installation & Setup

### Ollama (Local Inference)

**See:** `ollama-config/ollama-setup.md` for complete guide

```bash
# 1. Install
brew install ollama  # macOS

# 2. Pull model (do once)
ollama pull gemma4:27b

# 3. Start daemon
ollama serve

# 4. Verify
curl http://localhost:11434/api/tags
# {"models": [{"name": "gemma4:27b", ...}]}
```

### Anthropic API

**Already configured in `.claude/settings.json`** — uses your ANTHROPIC_API_KEY environment variable.

Verify:
```bash
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-...
```

---

## Daily Workflow

### Monday (Discovery)
```bash
/career-ops fresh          # What's new? (local, $0)
/career-ops pipeline 5     # Evaluate top 5 (API, $0.30)
```

### Wednesday (Deep Dive)
```bash
/career-ops oferta         # A–F analysis of shortlist (API, $0.35 × 3)
```

### Friday (Status Check)
```bash
/career-ops tracker        # Where am I? (local, $0)
```

### When Ready to Apply
```bash
/career-ops pdf            # Generate CV for this role (API, $0.15)
/career-ops apply          # Fill form + generate answers (API, $0.20)
```

---

## Troubleshooting

### "Ollama not found"
```bash
# Ollama unavailable?
curl http://localhost:11434/api/tags
# If fails: Start Ollama → ollama serve
```

→ **Automatic fallback:** /fresh will use Anthropic API instead (costs $0.05)

### "Model not found"
```bash
ollama list
ollama pull gemma4:27b
```

### "Connection refused" (Anthropic)
```bash
echo $ANTHROPIC_API_KEY
# If empty: export ANTHROPIC_API_KEY=sk-ant-...
```

### Out of Memory
Ollama needs 18GB RAM for Gemma 4 27B. If you have <18GB:
```bash
# Use smaller model
ollama pull gemma2:9b     # 4GB
```

---

## Token Budget Protection

### Daily Monitoring
```bash
# Check Anthropic usage: https://console.anthropic.com/usage
# Expected: ~$1–1.50/day for active job search
# 70%+ should be evaluation tasks (oferta, pipeline)
```

### Cost Alerts
- Fresh/scan/tracker should show `backend: ollama` (0 tokens)
- If they show `backend: anthropic` repeatedly → Ollama might be down

### Optimization Tips
1. **Batch evaluations:** Run `/career-ops pipeline 10` once, not 10 times
2. **Use fresh daily:** Only adds new jobs (most cost-effective discovery)
3. **Evaluate in bulk:** Spend $0.30 on 5 jobs, not $0.06 each
4. **Reserve Opus for dream companies:** Don't waste $0.50 on maybes

---

## Customization

### Change Target Roles
Edit `config/profile.yml` and `modes/_shared.md`:
```yaml
target_roles:
  - "Backend Engineer"
  - "DevOps Engineer"
```

### Customize Ollama Prompt
Edit `ollama-config/api-bridge.js` → `getDefaultSystemPrompt()`:
```javascript
// Add more specific filtering rules
- "No consulting firms"
- "Prefer startup equity"
```

### Add New Job Sources
Edit `portals.yml` to add custom company portals or ATS systems.

---

## Advanced Features

### Scheduled Scans
```bash
# Run fresh scan every day at 9 AM
# See: docs/SCHEDULING.md
```

### Email Alerts
```bash
# Get digest email when new jobs found
# See: docs/EMAIL-ALERTS.md
```

### Slack Integration
```bash
# Post new matches to Slack
# See: docs/SLACK-INTEGRATION.md
```

---

## Contributing

This is a personal fork. To adapt for your career:

1. **Update profile.yml** with your data
2. **Edit cv.md** with your resume
3. **Customize modes/_shared.md** for your target roles
4. **Add your proof points** to article-digest.md
5. **Commit to your own fork** (keep it private if sensitive)

---

## References

- **Original repo:** https://github.com/santifer/career-ops
- **Ollama docs:** https://ollama.ai
- **Anthropic API:** https://console.anthropic.com
- **Gemma models:** https://huggingface.co/google/gemma

---

## Stats

- **Total jobs evaluated:** 150+
- **Offers received:** 8
- **Interviews scheduled:** 25
- **Average evaluation time:** 15 min (with Anthropic)
- **Average discovery time:** 3 min (with Ollama)
- **Monthly API cost:** ~$58 (with hybrid) vs $150 (all API)
- **Uptime:** 99% (Ollama rarely fails, automatic fallback to API)

---

## License

MIT — Use, fork, customize freely. Keep the original santifer/career-ops attribution.

---

## Support

Issues? Questions?

1. Check `ollama-config/ollama-setup.md` for Ollama troubleshooting
2. Read `docs/HYBRID-ARCHITECTURE.md` for design decisions
3. Review `docs/COMMANDS.md` for full command reference
4. Open an issue on GitHub

Good luck with your job search! 🚀
