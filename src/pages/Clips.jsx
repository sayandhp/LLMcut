import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Search, Trash2, Zap, Grid, List, Film, Download } from 'lucide-react'

function fmt(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function statusBadge(s) {
  if (s === 'ready')     return <span className="badge badge-blue">Ready</span>
  if (s === 'posted')    return <span className="badge badge-success">Posted</span>
  if (s === 'scheduled') return <span className="badge badge-warning">Scheduled</span>
  if (s === 'archived')  return <span className="badge badge-muted">Archived</span>
  return null
}

function ScoreBar({ score }) {
  const n = score == null ? null : Number(score)
  const pct = n == null ? 0 : (n / 10) * 100
  const color = n >= 9 ? 'var(--success)' : n >= 8 ? 'var(--blue)' : 'var(--warning)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="progress-bar" style={{ flex: 1, height: 2 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color, fontWeight: 600, minWidth: 24 }}>
        {n == null ? '—' : n.toFixed(1)}
      </span>
    </div>
  )
}

function GridCard({ clip, onDelete }) {
  const dur = fmt(clip.duration_seconds)
  const score = clip.score == null ? null : Number(clip.score)
  return (
    <div className="clip-card">
      <div className="clip-thumb">
        <div className="clip-thumb-bg">🎬</div>
        <div className="clip-thumb-overlay" />
        <div className="clip-thumb-actions">
          <div className="clip-action-btn" onClick={() => onDelete(clip.id)} title="Delete">
            <Trash2 size={11} />
          </div>
        </div>
        <div className="clip-duration">{dur}</div>
        <div className="clip-score-bar">
          <div style={{ height: '100%', width: `${score == null ? 0 : (score / 10) * 100}%`, background: score >= 9 ? 'var(--success)' : 'var(--blue)' }} />
        </div>
      </div>
      <div className="clip-info">
        <div className="clip-title">{clip.title}</div>
        <div className="clip-meta">
          <span>{new Date(clip.created_at).toLocaleDateString()}</span>
          {score != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={10} style={{ color: 'var(--warning)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{score.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 8 }}>{statusBadge(clip.status)}</div>
      </div>
    </div>
  )
}

function ListRow({ clip, onDelete }) {
  const dur = fmt(clip.duration_seconds)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{
        width: 44, height: 44, background: 'var(--bg-elevated)', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0, border: '1px solid var(--border)'
      }}>
        🎬
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {clip.title}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{dur}</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(clip.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div style={{ width: 100 }}>
        <ScoreBar score={clip.score} />
      </div>
      <div>{statusBadge(clip.status)}</div>
      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(clip.id)} aria-label={`Delete ${clip.title}`}>
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export default function Clips({ onNavigate }) {
  const [view, setView] = useState('grid')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.clips()
      .then(setClips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function deleteClip(id) {
    try {
      await api.deleteClip(id)
      setClips(items => items.filter(item => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = clips.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="input-addon" style={{ width: 240 }}>
          <div className="input-addon-prefix" style={{ padding: '7px 10px' }}>
            <Search size={13} />
          </div>
          <input
            className="input"
            placeholder="Filter clips..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 10px', fontSize: 12.5 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'ready', 'scheduled', 'posted'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="nav-badge" style={{ marginLeft: 4 }}>
                {f === 'all' ? clips.length : clips.filter(c => c.status === f).length}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            className={`btn btn-sm ${view === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setView('grid')}
          ><Grid size={13} /></button>
          <button
            className={`btn btn-sm ${view === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setView('list')}
          ><List size={13} /></button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 14, padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
        {loading ? 'Loading…' : `${filtered.length} clip${filtered.length !== 1 ? 's' : ''}${filter !== 'all' ? ` · ${filter}` : ''}`}
      </div>

      {loading ? (
        <div className="clip-grid">
          {[1,2,3,4,5,6].map(n => <div key={n} className="skeleton" style={{ aspectRatio: '9/16', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Film /></div>
          <div className="empty-title">{clips.length ? 'No clips found' : 'No clips saved yet'}</div>
          <div className="empty-desc">
            {clips.length
              ? 'Try adjusting your filters or search term'
              : 'Generated clips will appear here once a processing worker delivers results to Supabase.'}
          </div>
          {!clips.length && (
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => onNavigate('new')}>
              Queue your first video
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="clip-grid">
          {filtered.map(clip => <GridCard key={clip.id} clip={clip} onDelete={deleteClip} />)}
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: '0 20px' }}>
            {filtered.map(clip => <ListRow key={clip.id} clip={clip} onDelete={deleteClip} />)}
          </div>
        </div>
      )}
    </div>
  )
}
