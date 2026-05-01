import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ── ENCRYPTION & KEY MANAGEMENT (AES-256-GCM) ──────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'agentic-flow-default-secret-change-in-production!!';
const KEY_STORE_PATH = join(__dirname, 'memory', 'keys.enc.json');
const memDir = dirname(KEY_STORE_PATH);
if (!existsSync(memDir)) mkdirSync(memDir, { recursive: true });

const PROJECT_KEY_STORE_PATH = join(__dirname, 'memory', 'project_keys.enc.json');

function deriveKey(secret) {
  return crypto.scryptSync(secret, 'agentic-flow-salt', 32);
}

function encryptKey(text) {
  const key = deriveKey(ENCRYPTION_SECRET);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), authTag };
}

function decryptKey(encData) {
  const key = deriveKey(ENCRYPTION_SECRET);
  const iv = Buffer.from(encData.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(encData.authTag, 'hex'));
  let decrypted = decipher.update(encData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function loadKeyStore() {
  if (!existsSync(KEY_STORE_PATH)) return {};
  try { return JSON.parse(readFileSync(KEY_STORE_PATH, 'utf8')); }
  catch { return {}; }
}

function saveKeyStore(store) {
  writeFileSync(KEY_STORE_PATH, JSON.stringify(store, null, 2));
}

function loadProjectKeyStore() {
  if (!existsSync(PROJECT_KEY_STORE_PATH)) return {};
  try { return JSON.parse(readFileSync(PROJECT_KEY_STORE_PATH, 'utf8')); }
  catch { return {}; }
}

function saveProjectKeyStore(store) {
  writeFileSync(PROJECT_KEY_STORE_PATH, JSON.stringify(store, null, 2));
}

/**
 * Resolve the API key for a user.
 * Priority: project-stored encrypted key > global-stored encrypted key > fallback key from client.
 */
function resolveApiKey(userId, sequenceId, fallbackKey) {
  if (userId) {
    // 1. Try project-scoped key
    if (sequenceId) {
      const pStore = loadProjectKeyStore();
      const pKey = `${userId}:${sequenceId}`;
      if (pStore[pKey]) {
        try { return decryptKey(pStore[pKey]); }
        catch (err) { console.error('[Server] Project key decryption failed:', err.message); }
      }
    }

    // 2. Try global key
    const store = loadKeyStore();
    const entry = store[userId];
    if (entry) {
      try { return decryptKey(entry); }
      catch (err) { console.error('[Server] Global key decryption failed:', err.message); }
    }
  }
  return fallbackKey || '';
}

// ── UNIVERSAL GATEWAY PROTOCOL ──────────────────────────────────────
function determineProvider(key) {
  if (key.startsWith('sk-or-')) {
    return { url: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: 'openrouter/auto' };
  } else if (key.startsWith('sk-ant-')) {
    return { url: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-3-haiku-20240307' };
  } else if (key.startsWith('xai-') || key.startsWith('gsk_')) {
    return { url: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.1-70b-versatile' }; 
  } else if (key.startsWith('sk-')) {
    return { url: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o-mini' };
  }
  
  return { url: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: 'openrouter/auto' }; 
}

// ── KEY MANAGEMENT ENDPOINTS ────────────────────────────────────────

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Save (or replace) an API key — encrypted at rest
app.post('/api/keys/save', (req, res) => {
  const { userId, apiKey } = req.body;
  if (!userId || !apiKey) {
    return res.status(400).json({ error: 'userId and apiKey are required.' });
  }

  try {
    const trimmed = apiKey.trim();
    const encryptedData = encryptKey(trimmed);
    const store = loadKeyStore();
    store[userId] = {
      ...encryptedData,
      lastFour: trimmed.slice(-4),
      savedAt: new Date().toISOString(),
    };
    saveKeyStore(store);
    console.log(`[Server] ✓ API key saved for user ${userId.substring(0, 8)}...`);
    res.json({ success: true, lastFour: store[userId].lastFour });
  } catch (err) {
    console.error('[Server] Failed to save key:', err.message);
    res.status(500).json({ error: 'Failed to encrypt and save the key.' });
  }
});

// Check if a key exists for a user (never returns the actual key)
app.get('/api/keys/status/:userId', (req, res) => {
  const { userId } = req.params;
  const store = loadKeyStore();
  const entry = store[userId];
  if (!entry) return res.json({ hasKey: false });
  res.json({ hasKey: true, lastFour: entry.lastFour || '****', savedAt: entry.savedAt });
});

app.get('/api/keys/project-status/:userId/:sequenceId', (req, res) => {
  const { userId, sequenceId } = req.params;
  const store = loadProjectKeyStore();
  const entry = store[`${userId}:${sequenceId}`];
  if (!entry) return res.json({ hasKey: false });
  res.json({ hasKey: true, lastFour: entry.lastFour || '****' });
});

app.post('/api/keys/save-project', (req, res) => {
  const { userId, sequenceId, apiKey } = req.body;
  if (!userId || !sequenceId || !apiKey) return res.status(400).json({ error: 'Missing data' });

  const store = loadProjectKeyStore();
  const encrypted = encryptKey(apiKey);
  encrypted.lastFour = apiKey.slice(-4);
  store[`${userId}:${sequenceId}`] = encrypted;
  saveProjectKeyStore(store);

  res.json({ success: true });
});

// Delete a stored key
app.delete('/api/keys/:userId', (req, res) => {
  const store = loadKeyStore();
  delete store[req.params.userId];
  saveKeyStore(store);
  console.log(`[Server] ✗ API key deleted for user ${req.params.userId.substring(0, 8)}...`);
  res.json({ success: true });
});

app.delete('/api/keys/project/:userId/:sequenceId', (req, res) => {
  const { userId, sequenceId } = req.params;
  const store = loadProjectKeyStore();
  delete store[`${userId}:${sequenceId}`];
  saveProjectKeyStore(store);
  res.json({ success: true });
});

// Verify a stored key works by making a lightweight test call
app.post('/api/keys/verify', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  const apiKey = resolveApiKey(userId);
  if (!apiKey) return res.json({ valid: false, reason: 'No key stored.' });

  const { url, defaultModel } = determineProvider(apiKey);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: defaultModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });
    res.json({ valid: response.ok, statusCode: response.status });
  } catch (err) {
    res.json({ valid: false, reason: err.message });
  }
});

// ── LLM EXECUTION ENDPOINT ─────────────────────────────────────────

app.post('/api/llm', async (req, res) => {
  const { userTask, agent, neuralContext, activeKey, userId, sequenceId } = req.body;

  console.log(`[Server] Incoming request for agent: ${agent?.name || 'unknown'}, phase: ${agent?.phaseLabel || 'unknown'}`);

  // Resolve key: project > global > client-provided
  const resolvedKey = resolveApiKey(userId, sequenceId, activeKey);

  if (!resolvedKey) {
    return res.status(401).json({
      _errorType: 'NO_KEY',
      content: 'No API key configured. Please add a key for this project or globally.',
      ui: `<div style="padding:32px;font-family:Outfit,sans-serif;background:rgba(10,10,15,0.8);backdrop-filter:blur(16px);border-radius:24px;border:1px solid rgba(255,255,255,0.08);color:#fff;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#A259FF,#46B1FF);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;box-shadow:0 8px 32px rgba(162,89,255,0.3)">⚡</div>
          <h2 style="font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">Gateway Authentication Required</h2>
        </div>
        <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0">No API key found. Please add your key to proceed.</p>
      </div>`,
    });
  }

  const { url, defaultModel } = determineProvider(resolvedKey);
  console.log(`[Server] Routing to provider: ${url} with model: ${defaultModel}`);

  // ── NODE EXECUTION & DELIVERY (DOUBLE DIAMOND PROTOCOL) ─────────
  let productSpec = "Provide deep expert analysis and structured technical output. Avoid placeholders.";
  const phaseTitle = (agent.phaseLabel || agent.categoryName || '').toUpperCase();
  
  if (phaseTitle.includes('DISCOVER') || phaseTitle.includes('RESEARCH')) {
    productSpec = `* Phase: [DISCOVER] - Research & Exploration
* Deliverable: Deep-dive market sentiment analysis, competitor feature mapping, and user persona profiling. 
* Context: Search for real-world trends. Create a sophisticated comparison matrix in the UI.`;
  } else if (phaseTitle.includes('DEFINE') || phaseTitle.includes('ARCHITECTURE')) {
    productSpec = `* Phase: [DEFINE] - Synthesis & Technical Strategy
* Deliverable: Comprehensive system architecture, data flow diagrams (Mermaid.js), and technical specifications. 
* Context: Define actual technical stacks and integration logic. Include Mermaid syntax.`;
  } else if (phaseTitle.includes('DEVELOP') || phaseTitle.includes('BUILD')) {
    productSpec = `* Phase: [DEVELOP] - Ideation & Prototype Creation
* Deliverable: Production-ready Tailwind CSS code, React component structures, or complex logic handlers. 
* Context: Write actual functional code blocks. Deliver extreme technical depth.`;
  } else if (phaseTitle.includes('DELIVER') || phaseTitle.includes('DEPLOY')) {
    productSpec = `* Phase: [DELIVER] - Finalization & Deployment Plan
* Deliverable: Deployment manifest, CI/CD pipeline strategy, and final Project Summary for stakeholders. 
* Context: Provide actual cloud deployment steps (AWS/Vercel/GCP) based on the architecture.`;
  }

  const systemPrompt = `You are a specialized worker in the "Agentic Flow" Engine.
CORE MISSION: Transform visual nodes into functional workers that deliver high-fidelity products.
Tone: Professional, futuristic, and efficient. Start your analysis with "[System Initialized: ${agent.name || 'Component'} Sequence]".

YOUR DIRECTIVE:
${productSpec}

${neuralContext ? `PREVIOUS NEURAL BRIDGE DATA:\n${neuralContext}\n\nBuild upon this previous context.` : ''}

RESPONSE FORMAT — Return a valid JSON object with exactly two keys:
{
  "content": "Your complete text output based on the Node Deliverable Spec. Include status like [Sequence Complete] at the end.",
  "ui": "A self-contained HTML component that renders your output beautifully. Use ONLY inline styles. 
         Midnight Luxe Design System:
         - Backgrounds: Deep black (#000000) or high-gloss navy-black (#0a0a0f). Use glassmorphism where applicable (backdrop-filter: blur(16px), background: rgba(255,255,255,0.02)).
         - Accents: Electric Purple (#A259FF) for primary highlights, Azure Blue (#46B1FF) for connections/data, Lime Green (#DEF767) for success.
         - Borders: 1px solid rgba(255,255,255,0.08).
         - Typography: Header fonts should use 'Syne, sans-serif', body font 'Outfit, sans-serif'. Use tracking (letter-spacing) on caps text.
         - Layout: High-end UI, generous padding (32px), rounded corners (24px). Grid layouts for data."
}
CRITICAL: Return ONLY the raw JSON object. No markdown fences.`;

  try {
    console.log(`[Server] Sending request to LLM provider...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resolvedKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Agentic Flow Express Server',
      },
      body: JSON.stringify({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userTask || 'Begin execution sequence.' },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error(`[Server] Provider Error: ${response.status} ${response.statusText}`);
      const errJson = await response.json().catch(() => ({}));
      
      let errorType = 'PROVIDER_ERROR';
      if (response.status === 401 || response.status === 403) errorType = 'INVALID_KEY';
      if (response.status === 429) errorType = 'RATE_LIMIT';

      return res.status(response.status).json({
        _errorType: errorType,
        _keyError: true,
        content: `Upstream Provider Error (${response.status}): ${errJson.error?.message || response.statusText}`,
        ui: `<div style="padding:24px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:16px;color:#ef4444">
               <h4 style="margin:0 0 8px 0">Execution Halted</h4>
               <p style="margin:0;font-size:13px;opacity:0.8">${errJson.error?.message || 'The upstream model provider returned an error.'}</p>
             </div>`
      });
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || '';
    console.log(`[Server] Raw LLM response length: ${raw.length} chars`);
    
    // Strip markdown fences if the LLM wraps them anyway
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    const parsed = JSON.parse(raw);
    if (!parsed.content || !parsed.ui) throw new Error('Response missing required "content" or "ui" fields.');

    console.log(`[Server] Successfully parsed LLM output for ${agent.name}`);
    res.json(parsed);
  } catch (error) {
    console.error(`[Server] LLM Fallback Triggered:`, error.message);
    res.status(500).json({
      content: `[System Error] Sequence halted. ${error.message}`,
      ui: `<div style="padding:32px;font-family:Outfit,sans-serif;background:rgba(10,10,15,0.9);backdrop-filter:blur(16px);border-radius:24px;border:1px solid rgba(239,68,68,0.25)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:18px;border:1px solid rgba(239,68,68,0.3)">⚠</div>
          <h3 style="color:#ef4444;font-size:20px;font-weight:700;margin:0;font-family:Syne,sans-serif">Gateway Routing Failure</h3>
        </div>
        <p style="color:#8b949e;font-size:14px;line-height:1.6;margin:0 0 16px 0">${error.message.replace(/"/g, '&quot;')}</p>
        <div style="padding:16px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.05)">
           <p style="color:#A259FF;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:1px">Fallback Protocol</p>
           <p style="color:#64748b;font-size:13px;margin:6px 0 0 0">Verify your API key in Profile, or try a different provider.</p>
        </div>
      </div>`,
    });
  }
});

app.post('/api/agent/stream', async (req, res) => {
  const { userTask, agent, activeKey, userId } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Resolve key: prefer server-stored encrypted key
  const resolvedKey = resolveApiKey(userId, activeKey);

  if (!resolvedKey) {
    res.write('data: {"choices":[{"delta":{"content":"No API key detected. Add one in Profile → API Key Management.\\n"}}]}\n\n');
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  const { url, defaultModel } = determineProvider(resolvedKey);
  const systemPrompt = `You are a sub-processor computing the neural logic for: ${agent?.name}. Output a rapid chain-of-thought (3-4 technical sentences simulating log processing) detailing how you are evaluating this prompt. Provide raw streamable text with no formatting.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resolvedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: defaultModel,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userTask || 'Begin execution log.' },
        ],
      }),
    });

    if (!response.ok) throw new Error('Stream failed upstream');

    for await (const chunk of response.body) {
      res.write(chunk);
    }
  } catch (err) {
    res.write(`data: {"choices":[{"delta":{"content":"\\n[STREAM FAILURE: ${err.message}]"}}]}\n\n`);
  }
  
  res.write('data: [DONE]\n\n');
  res.end();
});

// Use http.createServer to keep the process alive (Express 5 compat)
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`[Agentic Flow] ✓ Backend server running on http://localhost:${PORT}`);
  console.log(`[Agentic Flow] ✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`[Agentic Flow] ✓ Key Management: /api/keys/save, /api/keys/status/:userId`);
});
