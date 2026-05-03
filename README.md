# job-search-pipeline

> Personal AI-powered job search automation with hybrid local Ollama + Anthropic API architecture.

Written in Go. Runs locally for privacy-sensitive operations (parsing resumes, ranking listings) and reaches out to Anthropic only for higher-reasoning tasks (cover letter drafting, fit analysis).

## What it does

- Scrapes job listings from configured boards
- Extracts structured fields with local Ollama (privacy-preserving)
- Routes complex reasoning (fit assessment, cover letter drafts) to Anthropic API
- Persists results locally for review

## Stack

- **Language:** Go
- **LLMs:** Ollama (local) · Anthropic API
- **Storage:** Local filesystem / SQLite

## Setup

```bash
git clone https://github.com/askmy-stack/job-search-pipeline.git
cd job-search-pipeline
go mod download
cp .env.example .env  # add ANTHROPIC_API_KEY
go run main.go
```

## What I learned

Hybrid local + cloud agent design keeps cost low and privacy high while still benefiting from frontier-model reasoning where it matters. Ollama is fast enough on consumer hardware for the structured-extraction parts.

## License

MIT

---

Built by [Abhinaysai Kamineni](https://github.com/askmy-stack)
