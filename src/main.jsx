import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider, SupabaseAuthAdapter } from './lib/auth'

// ╔════════════════════════════════════════════════════════════╗
// ║  TO SWITCH AUTH BACKENDS, CHANGE THIS ONE LINE:           ║
// ║                                                           ║
// ║  import { LocalServerAuthAdapter } from './lib/auth';     ║
// ║  const authAdapter = new LocalServerAuthAdapter();        ║
// ╚════════════════════════════════════════════════════════════╝
const authAdapter = new SupabaseAuthAdapter();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider adapter={authAdapter}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
