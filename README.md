# job-search-pipeline

Personal AI-powered job search automation using a **hybrid local Ollama + Anthropic** architecture.

Forked and customized from [santifer/career-ops](https://github.com/santifer/career-ops). Discovery and tracking run on local Ollama (near-zero cost); evaluation and drafting use the Anthropic API.

> Looking for the deep hybrid guide? See **[README-HYBRID.md](README-HYBRID.md)**.

## Stack

| Layer | Tech |
|-------|------|
| Pipeline scripts | **Node.js** (`.mjs` / Claude Code modes) |
| Local LLM | **Ollama** (`OLLAMA_MODEL`, default `gemma4:27b`) |
| Cloud LLM | **Anthropic API** (fit analysis, cover letters, deep eval) |
| Dashboard TUI | **Go** (`dashboard/`) |
| Config | `.env`, `config/profile.yml` (gitignored), YAML templates |

There is **no** root `main.go` — the Go entrypoint lives under `dashboard/`.

## Quick start

```bash
git clone https://github.com/askmy-stack/job-search-pipeline.git
cd job-search-pipeline
npm install
cp .env.example .env          # set ANTHROPIC_API_KEY; optional OLLAMA_* / BRIDGE_*
cp examples/cv-example.md cv.md   # personal CV — gitignored, never commit
cp config/profile.example.yml config/profile.yml  # if present

# Optional local inference
brew install ollama && ollama pull gemma4:27b && ollama serve
```

Useful scripts (`package.json`):

```bash
npm run verify       # pipeline integrity checks
npm run sync-check   # CV / profile consistency
npm run normalize    # canonicalize statuses
node ollama-config/api-bridge.js --server   # optional hybrid HTTP bridge
```

Go dashboard (from `dashboard/`):

```bash
cd dashboard && go run .
```

## Personal data

- Use `examples/cv-example.md` as a template; keep real `cv.md` local (gitignored).
- See [SECURITY.md](SECURITY.md) for PII rules and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE).

Built by [Abhinaysai Kamineni](https://github.com/askmy-stack).
