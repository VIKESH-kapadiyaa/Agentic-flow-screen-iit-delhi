import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/llm', async (req, res) => {
  const { userTask, agent, neuralContext, activeKey } = req.body;

  console.log(`[Server] Incoming request for agent: ${agent?.name || 'unknown'}, phase: ${agent?.phaseLabel || 'unknown'}`);

  if (!activeKey) {
    return res.status(401).json({
      content: 'No API key configured.',
      ui: `<div style="padding:32px;font-family:Outfit,sans-serif;background:rgba(10,10,15,0.8);backdrop-filter:blur(16px);border-radius:24px;border:1px solid rgba(255,255,255,0.08);color:#fff;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#A259FF,#46B1FF);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;box-shadow:0 8px 32px rgba(162,89,255,0.3)">⚡</div>
          <h2 style="font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">Gateway Authentication Required</h2>
        </div>
        <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0">Initialize sequence by configuring your API key in Settings.</p>
      </div>`,
    });
  }

  const { url, defaultModel } = determineProvider(activeKey);
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
        Authorization: `Bearer ${activeKey}`,
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
      const errBody = await response.text().catch(() => 'Unknown error');
      console.error(`[Server] Provider returned ${response.status}:`, errBody.substring(0, 200));
      throw new Error(`API ${response.status}: ${errBody.substring(0, 150)}`);
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
           <p style="color:#64748b;font-size:13px;margin:6px 0 0 0">Verify your API key and quota, or try a different provider.</p>
        </div>
      </div>`,
    });
  }
});

app.post('/api/agent/stream', async (req, res) => {
  const { userTask, agent, activeKey } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!activeKey) {
    res.write('data: {"choices":[{"delta":{"content":"No API key detected.\\n"}}]}\n\n');
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  const { url, defaultModel } = determineProvider(activeKey);
  const systemPrompt = `You are a sub-processor computing the neural logic for: ${agent?.name}. Output a rapid chain-of-thought (3-4 technical sentences simulating log processing) detailing how you are evaluating this prompt. Provide raw streamable text with no formatting.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeKey}`,
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
});
