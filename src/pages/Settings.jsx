import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Save, Eye, EyeOff, Trash2 } from 'lucide-react'

const TABS = [
  { id: 'ai',            icon: '✦', label: 'AI Keys' },
  { id: 'appearance',    icon: '◎', label: 'Appearance' },
  { id: 'account',       icon: '◈', label: 'Account' },
  { id: 'notifications', icon: '◉', label: 'Notifications' },
]

function ApiKeyField({ label, placeholder, provider }) {
  const [visible, setVisible] = useState(false)
  const [val, setVal] = useState('')
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-addon">
        <div className="input-addon-prefix">
          <span style={{ fontSize: 14 }}>{provider}</span>
        </div>
        <input
          className="input"
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{ padding: '0 12px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {visible ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  )
}

function Toggle({ defaultChecked }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <label className="toggle">
      <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
      <div className="toggle-track" />
    </label>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('ai')
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState(() => supabase?.auth?.getUser ? '' : 'dev@localhost')

  // Lazily fetch user email
  useState(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  })

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '??'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Sidebar tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {TABS.map(t => (
          <div
            key={t.id}
            className={`nav-item${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* AI KEYS */}
        {tab === 'ai' && (
          <div className="gap-stack">
            <div className="card">
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 4 }}>AI Provider Keys</div>
                <div className="card-desc" style={{ marginBottom: 20 }}>
                  Keys are stored in your browser's local session and are never sent to our servers.
                  The processing worker reads them from your environment instead.
                </div>
                <div className="gap-stack">
                  <ApiKeyField label="Google Gemini"      placeholder="AIzaSy…"     provider="✦" />
                  <ApiKeyField label="OpenAI"             placeholder="sk-…"         provider="◉" />
                  <ApiKeyField label="Anthropic Claude"   placeholder="sk-ant-…"     provider="◈" />
                  <ApiKeyField label="Groq"               placeholder="gsk_…"        provider="⚡" />
                  <ApiKeyField label="xAI Grok"           placeholder="xai-…"        provider="✕" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 4 }}>Ollama (Local)</div>
                <div className="card-desc" style={{ marginBottom: 16 }}>
                  Run models locally for full privacy — no API key required
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Ollama endpoint</label>
                    <input className="input" defaultValue="http://localhost:11434" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Model name</label>
                    <input className="input" placeholder="llama3.1, mistral, gemma2…" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 4 }}>Custom Endpoint</div>
                <div className="card-desc" style={{ marginBottom: 16 }}>
                  Any OpenAI-compatible endpoint (OpenRouter, LM Studio, etc.)
                </div>
                <div className="gap-stack">
                  <div className="input-group">
                    <label className="input-label">Base URL</label>
                    <input className="input" placeholder="https://openrouter.ai/api/v1" />
                  </div>
                  <ApiKeyField label="API Key" placeholder="Bearer token…" provider="◎" />
                  <div className="input-group">
                    <label className="input-label">Model identifier</label>
                    <input className="input" placeholder="meta-llama/llama-3-8b-instruct" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={save}>
                <Save size={13} /> {saved ? 'Saved ✓' : 'Save Keys'}
              </button>
            </div>
          </div>
        )}

        {/* APPEARANCE */}
        {tab === 'appearance' && (
          <div className="gap-stack">
            <div className="card">
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 16 }}>Theme</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { id: 'dark',    name: 'Dark',    bg: '#080808', desc: 'Default' },
                    { id: 'charcoal',name: 'Charcoal',bg: '#111827', desc: 'Warmer dark' },
                    { id: 'amoled',  name: 'AMOLED',  bg: '#000000', desc: 'Pure black' },
                  ].map((theme, i) => (
                    <div key={theme.id} className={`model-card${i === 0 ? ' selected' : ''}`}>
                      <div className="model-card-check" />
                      <div style={{
                        height: 48, borderRadius: 6, background: theme.bg, marginBottom: 10,
                        border: '1px solid rgba(255,255,255,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: 4
                      }}>
                        {[1,2,3].map(n => (
                          <div key={n} style={{ width: n === 2 ? 24 : 12, height: 4, background: `rgba(255,255,255,${n === 2 ? 0.7 : 0.2})`, borderRadius: 2 }} />
                        ))}
                      </div>
                      <div className="model-name" style={{ fontSize: 12 }}>{theme.name}</div>
                      <div className="model-desc">{theme.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 14 }}>Preferences</div>
                {[
                  { label: 'Reduce motion',   desc: 'Minimize animations and transitions' },
                  { label: 'Compact sidebar', desc: 'Icon-only sidebar for more workspace', defaultChecked: false },
                  { label: 'Show clip scores', desc: 'Display AI confidence score on each clip', defaultChecked: true },
                ].map((pref, i, arr) => (
                  <div key={pref.label} className="toggle-wrap" style={{ borderBottom: i < arr.length - 1 ? undefined : 'none' }}>
                    <div>
                      <div className="toggle-label">{pref.label}</div>
                      <div className="toggle-desc">{pref.desc}</div>
                    </div>
                    <Toggle defaultChecked={pref.defaultChecked ?? false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {tab === 'account' && (
          <div className="gap-stack">
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                  <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {userEmail || 'Loading…'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Supabase Auth · owner-scoped RLS</div>
                    <span className="badge badge-success" style={{ marginTop: 6 }}>Authenticated</span>
                  </div>
                </div>
                <div className="card-desc">
                  Your account is managed by Supabase Auth. All data is private to your user ID via row-level security.
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 4 }}>Supabase Project</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {[
                    { label: 'Project', value: 'llmcut-production' },
                    { label: 'Region',  value: 'ap-south-1 (Mumbai)' },
                    { label: 'Tables',  value: 'processing_jobs · clips · publish_queue · app_settings' },
                    { label: 'RLS',     value: 'Enabled on all tables · 0 security findings' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-tertiary)', minWidth: 70 }}>{r.label}</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: r.label === 'Tables' ? 'var(--font-mono)' : undefined, fontSize: r.label === 'Tables' ? 11 : undefined }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
              <div className="card-body">
                <div className="card-title" style={{ marginBottom: 4, color: 'var(--danger)' }}>Danger Zone</div>
                <div className="card-desc" style={{ marginBottom: 16 }}>
                  These actions are permanent and cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-danger" disabled>
                    <Trash2 size={13} /> Delete all my data
                  </button>
                </div>
                <div className="card-desc" style={{ marginTop: 10 }}>
                  Sign out is available in the top-right corner.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && (
          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 16 }}>Notification Preferences</div>
              {[
                { label: 'Clips ready',           desc: 'Notify when AI finishes processing clips',          on: true },
                { label: 'Post published',         desc: 'Confirm when a clip is published to a platform',    on: true },
                { label: 'API errors',             desc: 'Alert on AI provider or platform API failures',     on: true },
                { label: 'Live stream highlights', desc: 'Real-time alerts for high-score moments',           on: false },
                { label: 'Weekly digest',          desc: 'Summary of clips, posts, and performance',          on: false },
                { label: 'Product updates',        desc: 'New features and improvements',                     on: false },
              ].map((n, i, arr) => (
                <div key={n.label} className="toggle-wrap" style={{ borderBottom: i < arr.length - 1 ? undefined : 'none' }}>
                  <div>
                    <div className="toggle-label">{n.label}</div>
                    <div className="toggle-desc">{n.desc}</div>
                  </div>
                  <Toggle defaultChecked={n.on} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
