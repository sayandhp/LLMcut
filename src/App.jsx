import { useEffect, useState } from 'react'
import { supabase, hasSupabaseConfig } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import NewClip from './pages/NewClip'
import Clips from './pages/Clips'
import Publish from './pages/Publish'
import Settings from './pages/Settings'
import LiveStream from './pages/LiveStream'

function AccessScreen({ requiredConfiguration = false }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setError(result.error.message)
    else if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account, then sign in.')
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--bg-primary)' }}>
      <div className="card" style={{ width: 'min(100%, 420px)' }}>
        <div className="card-body">
          <div className="logo-text" style={{ marginBottom: 20 }}>LLM<span>cut</span></div>
          <div className="card-title" style={{ marginBottom: 6 }}>{requiredConfiguration ? 'Connect Supabase to deploy' : mode === 'signup' ? 'Create your account' : 'Sign in to LLMcut'}</div>
          {requiredConfiguration ? (
            <div className="card-desc">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the hosting environment, then redeploy. The publishable key is safe for browser use; never add a secret key here.</div>
          ) : (
            <>
              <div className="card-desc" style={{ marginBottom: 18 }}>Your saved jobs and clips are private to your account.</div>
              <form onSubmit={submit} className="gap-stack">
                <div className="input-group"><label className="input-label" htmlFor="auth-email">Email</label><input id="auth-email" className="input" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></div>
                <div className="input-group"><label className="input-label" htmlFor="auth-password">Password</label><input id="auth-password" className="input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></div>
                {error && <div role="alert" style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>}
                {message && <div role="status" style={{ color: 'var(--success)', fontSize: 12 }}>{message}</div>}
                <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
              </form>
              <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); setError('') }}>
                {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])

  if (import.meta.env.PROD && !hasSupabaseConfig) return <AccessScreen requiredConfiguration />
  if (supabase && authLoading) return <div className="page-content">Loading account…</div>
  if (supabase && !session) return <AccessScreen />

  const pages = {
    dashboard: Dashboard,
    new: NewClip,
    clips: Clips,
    publish: Publish,
    live: LiveStream,
    settings: Settings,
  }

  const PageComponent = pages[page] || Dashboard

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} userEmail={session?.user.email} />
      <div className="main-content">
        <Topbar page={page} userEmail={session?.user.email} onSignOut={supabase ? () => supabase.auth.signOut() : undefined} />
        <div className="page-scroll">
          <div className="page-content">
            <PageComponent onNavigate={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
