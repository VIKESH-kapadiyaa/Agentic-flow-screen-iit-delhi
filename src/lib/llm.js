// ── LLM Driver with BYOK (Bring Your Own Key) ──────────────────────
// Priority: localStorage → .env
// Structured output: { content, ui }
// Providers: OpenRouter (GPT-4o/Claude) or Groq (Llama 3.1)

function getKey(localKey, envKey) {
  const fromStorage = localStorage.getItem(localKey);
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  try {
    return import.meta.env[envKey] || '';
  } catch {
    return '';
  }
}

export function getKeyStatus() {
  const openrouter = getKey('openrouter_api_key', 'VITE_OPENROUTER_API_KEY_1');
  const groq = getKey('groq_api_key', 'VITE_GROQ_API_KEY_1');
  return {
    openrouter: !!openrouter,
    groq: !!groq,
    any: !!openrouter || !!groq,
  };
}

export function saveKeys({ openrouterKey, groqKey }) {
  if (openrouterKey !== undefined) {
    openrouterKey.trim()
      ? localStorage.setItem('openrouter_api_key', openrouterKey.trim())
      : localStorage.removeItem('openrouter_api_key');
  }
  if (groqKey !== undefined) {
    groqKey.trim()
      ? localStorage.setItem('groq_api_key', groqKey.trim())
      : localStorage.removeItem('groq_api_key');
  }
}

export function getSavedKeys() {
  return {
    openrouterKey: localStorage.getItem('openrouter_api_key') || '',
    groqKey: localStorage.getItem('groq_api_key') || '',
  };
}

/**
 * Call the LLM with the agent's persona and the user's task.
 * @param {string} userTask - The user's task/prompt
 * @param {string} agentPersona - The agent's system prompt / persona
 * @param {string} agentName - The display name of the agent
 * @returns {Promise<{content: string, ui: string}>}
 */
export async function callLLM(userTask, agentPersona, agentName = 'Synthesis Agent') {
  const openrouterKey = getKey('openrouter_api_key', 'VITE_OPENROUTER_API_KEY_1');
  const groqKey = getKey('groq_api_key', 'VITE_GROQ_API_KEY_1');

  let url, key, model;

  // Route to first available provider
  if (openrouterKey) {
    url = 'https://openrouter.ai/api/v1/chat/completions';
    key = openrouterKey;
    model = 'openai/gpt-4o-mini';
  } else if (groqKey) {
    url = 'https://api.groq.com/openai/v1/chat/completions';
    key = groqKey;
    model = 'llama-3.1-70b-versatile';
  }

  // ── No key fallback ───────────────────────────────────────────
  if (!url || !key) {
    return {
      content:
        'No API key configured. Open Settings (⚙) to add your OpenRouter or Groq API key.',
      ui: `<div style="padding:32px;font-family:Inter,system-ui,sans-serif;background:#0a0a0f;border-radius:16px;border:1px solid #1e293b">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px">⚡</div>
          <h2 style="color:#e2e8f0;font-size:18px;font-weight:700;margin:0">API Key Required</h2>
        </div>
        <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0">Configure your <strong style="color:#818cf8">OpenRouter</strong> or <strong style="color:#818cf8">Groq</strong> API key in Settings to enable AI synthesis.</p>
      </div>`,
    };
  }

  // ── System prompt: Agent persona + structured output instruction ──
  const systemPrompt = `You are "${agentName}", a high-order intelligence unit in the Mandelbrot Neuro-Agentic framework.

YOUR PERSONA:
${agentPersona}

INSTRUCTIONS:
Process the user's request through your specific neural expertise. Produce both a comprehensive text deliverable AND a beautiful visual HTML representation of it.

RESPONSE FORMAT — Return a valid JSON object with exactly two keys:
{
  "content": "Your complete, detailed text output. This is the actual deliverable — a full analysis, article, strategy document, or design specification. Be thorough, insightful, and professional. Use paragraphs and structure.",
  "ui": "A self-contained HTML component that renders your output beautifully. Use ONLY inline styles (no external CSS classes). 
           Design System:
           - Backgrounds: Deep black (#000000) or high-gloss navy-black (#0a0a0f).
           - Accents: Electric Purple (#A259FF) for primary highlights, Azure Blue (#46B1FF) for information, Lime Green (#DEF767) for success/growth.
           - Borders: Subtle (1px solid rgba(255,255,255,0.08)).
           - Typography: Header font 'Syne', body font 'Outfit' (fallback to sans-serif).
           - Style: Glassmorphic cards (backdrop-filter: blur(16px)), generous padding (32px), rounded corners (24px).
           - Layout: Use grids, lists, and bold display headings to create a 'Command Center' or 'Executive Dashboard' aesthetic."
}

CRITICAL: Return ONLY the raw JSON object. No markdown fences, no code blocks, no explanations outside the JSON.`;

  // ── API call ──────────────────────────────────────────────────
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Mandelbrot — Agentic Design Workflow',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userTask },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`API ${response.status}: ${errBody.substring(0, 200)}`);
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if the model wraps its output
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    const parsed = JSON.parse(raw);

    // Validate the two required keys exist
    if (typeof parsed.content !== 'string' || typeof parsed.ui !== 'string') {
      throw new Error('Response missing required "content" or "ui" fields.');
    }

    return parsed;
  } catch (error) {
    console.error(`[${agentName}] LLM Error:`, error);
    return {
      content: `Agent "${agentName}" encountered an error: ${error.message}`,
      ui: `<div style="padding:32px;font-family:Inter,system-ui,sans-serif;background:#0a0a0f;border-radius:16px;border:1px solid rgba(239,68,68,0.25)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:14px">⚠</div>
          <h3 style="color:#ef4444;font-size:16px;font-weight:700;margin:0">Synthesis Error</h3>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px 0">${error.message.replace(/"/g, '&quot;')}</p>
        <p style="color:#64748b;font-size:11px;margin:0">Check your API keys in Settings and try again.</p>
      </div>`,
    };
  }
}
