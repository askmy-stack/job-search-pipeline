# Mode: fresh — Last 24 Hours Job Discovery

Discover jobs posted in the last 24 hours across Indeed, Greenhouse APIs, and web search. Filters for relevant titles and deduplicates against existing pipeline. Adds fresh matches to `data/pipeline.md`.

## Execution

Run as subagent to avoid consuming main context:

```
Agent(
    subagent_type="general-purpose",
    prompt="[content of _shared.md + this file + portals.yml data]",
    run_in_background=True
)
```

## Configuration

Read from:
- `portals.yml` → `title_filter` (positive/negative keywords) + `tracked_companies` (API URLs)
- `config/profile.yml` → `target_roles.primary` (search terms) + `location` (search location)

## Discovery Strategy (3 Layers — execute all, merge results)

### Layer 1 — Indeed MCP (PRIMARY — broadest coverage)

Use the `mcp search_jobs` tool to search Indeed for each target role. Run these searches:

```
search_jobs(search="Data Engineer", location="remote", country_code="US", job_type="fulltime")
search_jobs(search="ML Engineer", location="remote", country_code="US", job_type="fulltime")
search_jobs(search="AI Engineer", location="remote", country_code="US", job_type="fulltime")
search_jobs(search="Data Scientist", location="remote", country_code="US", job_type="fulltime")
search_jobs(search="MLOps Engineer", location="remote", country_code="US", job_type="fulltime")
```

Also run location-specific searches for the candidate's area:
```
search_jobs(search="Data Engineer", location="Arlington, VA", country_code="US", job_type="fulltime")
search_jobs(search="ML Engineer", location="Washington, DC", country_code="US", job_type="fulltime")
search_jobs(search="AI Engineer", location="Arlington, VA", country_code="US", job_type="fulltime")
```

For each result returned:
1. Call `get_job_details(job_id)` to get the full posting with date information
2. **Only keep jobs where the posting date is within the last 24 hours**
3. Extract: `{title, company, url, posted_date}`

**Enrichment (for top matches):** Call `get_company_data(companyName, jobTitle, knowledgeCategories={metadata: true, ratings: true, salaries: true})` to get company ratings and salary data. Include this in the pipeline notes.

### Layer 2 — Greenhouse API with `updated_at` Filter (COMPLEMENTARY)

For each company in `portals.yml` → `tracked_companies` that has an `api:` field and `enabled: true`:

1. `WebFetch` the API URL (e.g., `https://boards-api.greenhouse.io/v1/boards/anthropic/jobs`)
2. Parse JSON response → array of jobs
3. Each job has `updated_at` timestamp — filter for jobs updated within last 24 hours
4. Apply `title_filter` positive/negative keywords to job title
5. Extract: `{title, url (absolute_url field), company, updated_at}`

**Companies with Greenhouse APIs (from portals.yml):**
- Anthropic, dbt Labs, Fivetran, Arize AI, RunPod, Glean, Scale AI, Airtable, Vercel, Temporal, Prefect, Astronomer, Hume AI, Intercom, PolyAI, Parloa

### Layer 3 — WebSearch with Date Restriction (DISCOVERY)

Run date-restricted web searches to catch jobs on platforms without APIs:

```
WebSearch: "Data Engineer" OR "ML Engineer" posted in last 24 hours site:jobs.ashbyhq.com
WebSearch: "AI Engineer" OR "Data Scientist" posted in last 24 hours site:jobs.lever.co
WebSearch: "Data Engineer" OR "MLOps" new posting site:linkedin.com/jobs
WebSearch: "ML Engineer" OR "AI Engineer" new grad 2026 posted today
```

For each result:
1. Extract title, URL, and company using the extraction patterns from scan.md
2. Mark source as `websearch`

## Workflow

1. **Read configuration:**
   - `portals.yml` → title_filter + tracked_companies with API URLs
   - `config/profile.yml` → target_roles + location

2. **Read dedup sources:**
   - `data/scan-history.tsv` → URLs already seen
   - `data/applications.md` → company + role already evaluated
   - `data/pipeline.md` → URLs already in pending or processed

3. **Execute Layer 1 (Indeed MCP):**
   - Run all search_jobs calls (can be parallel)
   - For each result, get_job_details to check posting date
   - Filter to last 24 hours only
   - Accumulate candidates list

4. **Execute Layer 2 (Greenhouse APIs):**
   - WebFetch each API URL
   - Parse JSON, filter by `updated_at` within 24 hours
   - Apply title_filter
   - Accumulate (dedup against Layer 1 by URL)

5. **Execute Layer 3 (WebSearch):**
   - Run date-restricted searches
   - Extract title + URL + company
   - Accumulate (dedup against Layer 1+2 by URL)

6. **Filter by title** using `title_filter` from portals.yml:
   - At least 1 keyword from `positive` must match (case-insensitive)
   - 0 keywords from `negative` must match
   - `seniority_boost` keywords prioritize but don't exclude

7. **Deduplicate** against 3 sources:
   - `scan-history.tsv` → exact URL match
   - `applications.md` → company + normalized role already tracked
   - `pipeline.md` → exact URL already in pending or processed

8. **For each new job passing filters:**
   a. Add to `pipeline.md` section "Pendientes": `- [ ] {url} | {company} | {title} | 🔥 fresh`
   b. Register in `scan-history.tsv`: `{url}\t{date}\t{source}\t{title}\t{company}\tadded`

9. **Filtered jobs:** register in `scan-history.tsv` with status `skipped_title`
10. **Duplicates:** register with status `skipped_dup`

## Output Summary

```
🔥 Fresh Jobs — Last 24 Hours ({YYYY-MM-DD HH:MM})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Indeed: N new | Greenhouse API: N new | WebSearch: N new
Filtered by title: N | Duplicates: N already seen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Added to pipeline: N

  🔥 {company} | {title} | {source} | posted {X}h ago
  🔥 {company} | {title} | {source} | posted {X}h ago
  ...

{If company data available for top matches:}
  📊 {company}: ⭐ {rating}/5 | 💰 {salary range} | 👥 {employee count}

→ Run /career-ops pipeline to evaluate these fresh offers.
→ Or paste a URL directly to evaluate a specific one.
```

## Difference from `scan` Mode

| Feature | `scan` | `fresh` |
|---------|--------|---------|
| Time window | All active listings | Last 24 hours only |
| Indeed integration | No | Yes (MCP search_jobs) |
| Company enrichment | No | Yes (MCP get_company_data) |
| Greenhouse date filter | No (title only) | Yes (`updated_at` filter) |
| Best for | Weekly deep scan | Hourly/daily pulse check |
| Speed | Slower (full crawl) | Faster (API + search only) |

Use `scan` for comprehensive weekly discovery. Use `fresh` for hourly pulse checks to catch new postings immediately.
