import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Clock, Plus, Send, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube Shorts', logo: '▶' },
  { id: 'tiktok',  name: 'TikTok',         logo: '🎵' },
  { id: 'reels',   name: 'Instagram Reels', logo: '📸' },
  { id: 'twitter', name: 'X / Twitter',     logo: '𝕏'  },
]

const STATUS_BADGE = {
  pending:   <span className="badge badge-muted">Pending</span>,
  scheduled: <span className="badge badge-warning">Scheduled</span>,
  posted:    <span className="badge badge-success"><CheckCircle size={9} /> Posted</span>,
  failed:    <span className="badge badge-danger">Failed</span>,
  cancelled: <span className="badge badge-muted">Cancelled</span>,
}

export default function Publish() {
  const [activeTab, setActiveTab] = useState('queue')
  const [clips, setClips] = useState([])
  const [posts, setPosts] = useState([])
  const [clipId, setClipId] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    const [savedClips, savedPosts] = await Promise.all([api.clips(), api.publishing()])
    setClips(savedClips)
    setPosts(savedPosts)
  }

  useEffect(() => {
    setLoading(true)
    refresh().catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  async function addToQueue(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.createPublish({
        clipId,
        platform,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      setClipId('')
      setScheduledAt('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const queuePosts  = posts.filter(p => p.status !== 'posted')
  const postedPosts = posts.filter(p => p.status === 'posted')
  const visiblePosts = activeTab === 'posted' ? postedPosts : queuePosts

  return (
    <div className="sidebar-layout">
      {/* Left — Queue & Posted */}
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {[
            { id: 'queue',  label: 'Queue',  count: queuePosts.length },
            { id: 'posted', label: 'Posted', count: postedPosts.length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} <span className="nav-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--danger)', fontSize: 12.5, marginBottom: 14, padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ padding: '4px 20px' }}>
            {loading ? (
              [1,2,3].map(n => <div key={n} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />)
            ) : visiblePosts.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-icon"><Send /></div>
                <div className="empty-title">
                  {activeTab === 'posted' ? 'Nothing published yet' : 'Queue is empty'}
                </div>
                <div className="empty-desc">
                  {activeTab === 'posted'
                    ? 'Published posts will appear here when a platform integration is connected.'
                    : 'Add a saved clip to the queue using the form on the right.'}
                </div>
              </div>
            ) : visiblePosts.map((post, i) => {
              const plat = PLATFORMS.find(p => p.id === post.platform)
              return (
                <div
                  key={post.id}
                  className="schedule-row"
                  style={{ gap: 12, borderBottom: i < visiblePosts.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{plat?.logo || '📤'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="job-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.clip_title}
                    </div>
                    <div className="job-source">
                      {plat?.name || post.platform}
                      {post.scheduled_at && (
                        <> · <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                          {new Date(post.scheduled_at).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>
                  {STATUS_BADGE[post.status] || <span className="badge badge-muted">{post.status}</span>}
                  {post.views > 0 && (
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {Number(post.views).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--text-tertiary)' }}>views</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right — Add to Queue + Platform info */}
      <div className="gap-stack">
        <form className="card" onSubmit={addToQueue}>
          <div className="card-body">
            <div className="card-title" style={{ marginBottom: 4 }}>Add a Clip to Queue</div>
            <div className="card-desc" style={{ marginBottom: 16 }}>
              Saves a publish queue entry in Supabase. Platform OAuth is not connected yet.
            </div>
            <div className="gap-stack">
              <div className="input-group">
                <label className="input-label" htmlFor="publish-clip">Clip</label>
                <select id="publish-clip" className="input select" required value={clipId}
                  onChange={e => setClipId(e.target.value)}>
                  <option value="">Choose a saved clip</option>
                  {clips.map(clip => (
                    <option key={clip.id} value={clip.id}>{clip.title}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="publish-platform">Platform</label>
                <select id="publish-platform" className="input select" value={platform}
                  onChange={e => setPlatform(e.target.value)}>
                  {PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.logo} {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="publish-time">Schedule time (optional)</label>
                <input id="publish-time" className="input" type="datetime-local" value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={!clips.length || submitting}>
                <Plus size={13} /> {submitting ? 'Saving…' : 'Add to Queue'}
              </button>
              {!clips.length && (
                <div className="card-desc">Save a clip first before adding it to the publish queue.</div>
              )}
            </div>
          </div>
        </form>

        {/* Platform status */}
        <div className="card">
          <div className="card-body">
            <div className="card-title" style={{ marginBottom: 14 }}>Platform Connections</div>
            <div className="platform-row">
              {PLATFORMS.map(p => (
                <div key={p.id} className="platform-item">
                  <div className="platform-logo">{p.logo}</div>
                  <div>
                    <div className="platform-name">{p.name}</div>
                    <div className="platform-handle" style={{ color: 'var(--text-muted)' }}>Not connected</div>
                  </div>
                  <div className="platform-actions">
                    <button className="btn btn-secondary btn-sm" disabled>
                      <Plus size={11} /> Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 14 }}>
              OAuth platform connections will be added in a future update.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
