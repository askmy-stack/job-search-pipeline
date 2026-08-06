# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
responsibly:

1. **Do not** open a public GitHub issue for security-sensitive findings.
2. Use [GitHub Private Vulnerability Reporting](https://github.com/askmy-stack/job-search-pipeline/security/advisories/new) for this repository, or contact the maintainer via GitHub if private reporting is unavailable.
3. Include steps to reproduce, affected components, and potential impact.

We will acknowledge receipt and work toward a fix. Please allow reasonable time
before public disclosure.

## Personal Data and PII Warning

This project is a **job-search and CV pipeline**. It is designed to process
highly sensitive personal information locally. Treat all career data as
confidential.

**Never commit personal or identifying information to the repository**, including:

- Full CVs or résumés with contact details (`cv.md` should stay local)
- Application trackers with employer names, interview notes, or outcomes (`data/`, `applications.md`)
- Profile configuration with name, email, phone, address, visa status (`config/profile.yml`)
- Generated reports, cover letters, or PDFs (`reports/`, `output/`)
- API keys, tokens, or `.env` files

The repository ships **example and template files only**. Copy templates locally
(`examples/cv-example.md` → `cv.md`, `config/profile.example.yml`,
`templates/portals.example.yml`) and keep your real data in gitignored paths
listed in `.gitignore`. Never commit a real `cv.md`.

Before pushing or opening a pull request:

- Review `git diff` for names, emails, phone numbers, addresses, or employer-specific notes
- Confirm `data/`, `reports/`, `config/profile.yml`, and `.env` are not staged
- Redact or anonymize any sample content used in issues or discussions

If you accidentally commit PII, rotate any exposed credentials immediately,
remove the data from history if possible, and notify the maintainer.

## Local API Bridge

The Ollama/API bridge (`ollama-config/api-bridge.js`) can expose a local HTTP
server on `127.0.0.1` by default. **Set `BRIDGE_API_KEY`** when running the
bridge so only authenticated clients can call it:

```bash
export BRIDGE_API_KEY=$(openssl rand -hex 32)
node ollama-config/api-bridge.js --server
```

Clients must send `X-Bridge-Api-Key: <key>` or `Authorization: Bearer <key>`.
Bind to localhost only unless you understand the exposure (`BRIDGE_HOST`).

## Supported Versions

Security fixes are applied to the default branch (`main`). Older tags may not
receive backports unless explicitly stated in a release advisory.
