// ── Front-End LLM Client ──────────────────────────────
// Routes execution requests safely to the local Node.js Express backend.

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
 * Call the local Node.js Backend Server API
 * @param {string} userTask - The overarching project goal / prompt
 * @param {object} agent - Current Node Information (phase, name, etc.)
 * @param {string} neuralContext - Previous phase data (Neural Bridge)
 * @returns {Promise<{content: string, ui: string}>}
 */
export async function callLLM(userTask, agent, neuralContext = '', attachment = null) {
  const openrouterKey = getKey('openrouter_api_key', 'VITE_OPENROUTER_API_KEY_1');
  const groqKey = getKey('groq_api_key', 'VITE_GROQ_API_KEY_1');
  
  // Build enriched task with attachment
  let enrichedTask = userTask;
  if (attachment?.content) {
    enrichedTask += `\n\n--- ATTACHED FILE: ${attachment.name} ---\n${attachment.content.substring(0, 8000)}\n--- END ATTACHMENT ---`;
  }
  
  // Choose key based on availability. Prioritize what's inputted.
  const activeKey = openrouterKey || groqKey;

  if (!activeKey) {
    return {
      content: 'No API key configured. Open Settings (⚙) to add your API key.',
      ui: `<div style="padding:32px;font-family:Outfit,sans-serif;background:rgba(10,10,15,0.8);backdrop-filter:blur(16px);border-radius:24px;border:1px solid rgba(255,255,255,0.08);color:#fff;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#A259FF,#46B1FF);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;box-shadow:0 8px 32px rgba(162,89,255,0.3)">⚡</div>
          <h2 style="font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">Gateway Authentication Required</h2>
        </div>
        <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0">Initialize sequence by configuring your API key in Settings.</p>
      </div>`,
    };
  }

  // Determine API URL (Dev vs Prod fallback if needed later)
  const API_URL = 'http://localhost:3001/api/llm';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userTask: enrichedTask,
        agent,
        neuralContext,
        activeKey // Pass the key safely to the backend (or replace with sessions)
      })
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        if (errorPayload && errorPayload.ui) return errorPayload;
        throw new Error(`Node Server returned status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[Frontend] Failed strictly communicating with Node.js backend:', err);
    return {
        content: `Error securely reaching internal backend: ${err.message}`,
        ui: `<div style="padding:32px;font-family:Outfit,sans-serif;background:rgba(10,10,15,0.9);backdrop-filter:blur(16px);border-radius:24px;border:1px solid rgba(239,68,68,0.25)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <h3 style="color:#ef4444;font-size:20px;font-weight:700;margin:0;font-family:Syne,sans-serif">Frontend/Backend Conductor Error</h3>
          </div>
          <p style="color:#8b949e;font-size:14px;line-height:1.6;margin:0 0 16px 0">Make sure your Node.js server (npm run dev:server) is running on port 3001.</p>
        </div>`
    };
  }
}
