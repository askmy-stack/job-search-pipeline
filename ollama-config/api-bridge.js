#!/usr/bin/env node

/**
 * API Bridge — Route career-ops tasks to Ollama (local) or Anthropic (API)
 *
 * Discovery tasks (fresh, scan, tracker, training) → Ollama (0 cost)
 * Evaluation tasks (oferta, pdf, apply, deep) → Anthropic (high quality)
 *
 * Automatic fallback: If Ollama unavailable → use Anthropic API
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');

const OLLAMA_URL = 'http://localhost:11434';
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY || '';
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || '8787', 10);
const BRIDGE_HOST = process.env.BRIDGE_HOST || '127.0.0.1';
const OLLAMA_MODEL = 'gemma4:27b';
const OLLAMA_TIMEOUT = 30000; // 30s timeout for local inference

// Task routing configuration
const OLLAMA_TASKS = ['fresh', 'scan', 'tracker', 'training'];
const ANTHROPIC_TASKS = ['oferta', 'pdf', 'apply', 'pipeline', 'deep', 'contacto'];

/**
 * Check if Ollama is available (health check)
 */
async function isOllamaAvailable() {
  return new Promise((resolve) => {
    const req = http.get(`${OLLAMA_URL}/api/tags`, { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Call Ollama API for inference (discovery tasks)
 */
async function callOllama(prompt, systemPrompt = '') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      system: systemPrompt || getDefaultSystemPrompt(),
      stream: false,
      format: 'json'
    });

    const req = http.request(
      `${OLLAMA_URL}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        },
        timeout: OLLAMA_TIMEOUT
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              response: result.response,
              model: OLLAMA_MODEL,
              backend: 'ollama'
            });
          } catch (e) {
            reject(new Error(`Failed to parse Ollama response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama timeout (>30s)'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Call Anthropic API for evaluation tasks
 */
async function callAnthropic(prompt, model = 'claude-sonnet-4-5-20250514') {
  // Implementation would call Anthropic SDK
  // For now, return placeholder
  return {
    success: true,
    response: 'Anthropic API call would happen here',
    model: model,
    backend: 'anthropic'
  };
}

/**
 * Default system prompt for job filtering
 */
function getDefaultSystemPrompt() {
  return `You are a job matching assistant for Entry-Mid level Data/ML/AI engineers (F-1 OPT, graduating May 2026).

Your role: Evaluate and filter job postings quickly.

Target roles (equal priority):
- Data Engineer (ETL, pipelines, data infrastructure)
- ML Engineer / MLOps (model deployment, CI/CD for ML)
- AI Engineer (LLMs, deep learning, end-to-end AI systems)
- Data Scientist (statistical modeling, insights)
- Cloud/Platform Engineer (Terraform, K8s, infrastructure)

Filter criteria:
✓ ACCEPT: Entry-level, Junior, Mid-level roles with no "5+ years" requirement
✗ REJECT: Senior, Principal, Director, or explicit "5+ years" requirement
✗ REJECT: Non-technical roles (Sales, HR, Legal, PM)
✗ REJECT: Non-target tech stacks (.NET, iOS, Android, PHP, Ruby, Blockchain)

For each evaluation, respond with JSON:
{
  "match": true/false,
  "reason": "Brief explanation",
  "confidence": 0.0-1.0,
  "archetype": "Data Engineer" or null,
  "seniority_level": "Entry" or "Mid" or "Senior+",
  "flags": ["h1b_sponsor_likely", "startup", "remote"] or []
}

Be concise. Prioritize speed over perfection.`;
}

/**
 * Route a request to appropriate backend
 */
async function routeRequest(mode, input, options = {}) {
  const startTime = Date.now();
  const isDiscoveryTask = OLLAMA_TASKS.includes(mode);
  const isEvaluationTask = ANTHROPIC_TASKS.includes(mode);

  console.log(`\n📡 Routing request: mode=${mode}, backend=?`);

  // Try Ollama for discovery tasks
  if (isDiscoveryTask) {
    const ollamaAvailable = await isOllamaAvailable();

    if (ollamaAvailable) {
      console.log(`✅ Ollama available → using local inference (0 tokens)`);
      try {
        const result = await callOllama(input, options.systemPrompt);
        const duration = Date.now() - startTime;
        console.log(`⏱️  Ollama inference: ${duration}ms`);
        return {
          ...result,
          mode,
          duration,
          tokensSaved: true
        };
      } catch (error) {
        console.warn(`⚠️  Ollama failed: ${error.message} → falling back to Anthropic API`);
      }
    } else {
      console.log(`⚠️  Ollama unavailable → falling back to Anthropic API`);
    }
  }

  // Anthropic for evaluation tasks OR fallback from Ollama
  if (isEvaluationTask || (isDiscoveryTask && !await isOllamaAvailable())) {
    const model = options.model || (mode === 'apply' ? 'claude-opus-4-5-20250514' : 'claude-sonnet-4-5-20250514');
    console.log(`📡 Anthropic API → model=${model}`);

    try {
      const result = await callAnthropic(input, model);
      const duration = Date.now() - startTime;
      console.log(`⏱️  Anthropic inference: ${duration}ms`);
      return {
        ...result,
        mode,
        duration,
        tokensSaved: false
      };
    } catch (error) {
      console.error(`❌ Both backends failed: ${error.message}`);
      throw error;
    }
  }

  throw new Error(`Unknown mode: ${mode}`);
}

/**
 * Validate bridge API key when BRIDGE_API_KEY is configured.
 * Accepts X-Bridge-Api-Key header or Authorization: Bearer <key>.
 */
function isBridgeAuthorized(req) {
  if (!BRIDGE_API_KEY) return true;

  const headerKey = req.headers['x-bridge-api-key'];
  const authHeader = req.headers.authorization || '';
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const provided = headerKey || bearerKey;

  if (!provided || provided.length !== BRIDGE_API_KEY.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(provided),
    Buffer.from(BRIDGE_API_KEY)
  );
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Local HTTP server exposing routeRequest to other tools on the same machine.
 * When BRIDGE_API_KEY is set, all endpoints require authentication.
 */
function createBridgeServer() {
  return http.createServer(async (req, res) => {
    if (!isBridgeAuthorized(req)) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }

    if (req.method === 'GET' && req.url === '/health') {
      const ollamaAvailable = await isOllamaAvailable();
      return sendJson(res, 200, { ok: true, ollamaAvailable, authRequired: Boolean(BRIDGE_API_KEY) });
    }

    if (req.method === 'POST' && req.url === '/route') {
      try {
        const body = await readJsonBody(req);
        const { mode, input, options = {} } = body;

        if (!mode || typeof input !== 'string') {
          return sendJson(res, 400, { error: 'mode and input (string) are required' });
        }

        const result = await routeRequest(mode, input, options);
        return sendJson(res, 200, result);
      } catch (error) {
        return sendJson(res, 500, { error: error.message });
      }
    }

    return sendJson(res, 404, { error: 'Not found' });
  });
}

function startBridgeServer(options = {}) {
  const host = options.host || BRIDGE_HOST;
  const port = options.port || BRIDGE_PORT;
  const server = createBridgeServer();

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const authStatus = BRIDGE_API_KEY ? 'required' : 'disabled (set BRIDGE_API_KEY to enable)';
      console.log(`Bridge listening on http://${host}:${port} (auth: ${authStatus})`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

/**
 * Example usage
 */
async function example() {
  // Test fresh mode (should use Ollama)
  const testPrompt = `Evaluate this job title: "Data Engineer at Anthropic"

  Does it match our target profile (Entry-Mid Data/ML/AI role)?`;

  try {
    const result = await routeRequest('fresh', testPrompt);
    console.log('\n✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Export for use in career-ops skill
module.exports = {
  routeRequest,
  isOllamaAvailable,
  isBridgeAuthorized,
  callOllama,
  callAnthropic,
  createBridgeServer,
  startBridgeServer,
  OLLAMA_TASKS,
  ANTHROPIC_TASKS,
  BRIDGE_API_KEY,
  BRIDGE_PORT,
  BRIDGE_HOST
};

// Run example if called directly
if (require.main === module) {
  if (process.argv.includes('--server')) {
    startBridgeServer().catch((error) => {
      console.error('Failed to start bridge server:', error.message);
      process.exit(1);
    });
  } else {
    example();
  }
}
