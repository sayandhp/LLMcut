import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import {
  ArrowUpRight, Scissors, ChevronRight,
  Share2, Zap, Film, Briefcase, Star, AlertCircle
} from 'lucide-react'

function StatCard({ label, value, change, dir, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${dir}`}>
        {dir === 'up' && <ArrowUpRight size={12} />}
        {change}
      </div>
    </div>
  )
}

function fmt(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ClipRow({ clip }) {
  const score = clip.score != null ? Number(clip.score) : null
  return (
    <div className="schedule-row" style={{ gap: 14 }}>
      <div style={{ fontSize: 20, width: 32, textAlign: 'center' }}>🎬</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {clip.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {fmt(clip.duration_seconds)} · {timeAgo(clip.created_at)}
        </div>
      </div>
      {score != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: score >= 9 ? 'var(--success)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          <Zap size={11} />
          {score.toFixed(1)}
        </div>
      )}
      <span className={`badge ${clip.status === 'ready' ? 'badge-blue' : clip.status === 'posted' ? 'badge-success' : 'badge-warning'}`}>
        {clip.status}
      </span>
    </div>
  )
}

function JobRow({ job }) {
  const statusColor = {
    queued: 'badge-warning',
    processing: 'badge-blue',
    completed: 'badge-success',
    failed: 'badge-danger',
    cancelled: 'badge-muted',
  }
  const shortUrl = job.source_url.replace(/^https?:\/\//, '').slice(0, 50)
  return (
    <div className="schedule-row" style={{ gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {shortUrl}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {job.model} · {timeAgo(job.created_at)}
        </div>
      </div>
      <span className={`badge ${statusColor[job.status] || 'badge-muted'}`}>{job.status}</span>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [clips, setClips] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([api.clips(), api.jobs()])
      .then(([savedClips, savedJobs]) => {
        setClips(savedClips)
        setJobs(savedJobs)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const scoredClips = clips.filter(c => c.score != null)
  const avgScore = scoredClips.length
    ? (scoredClips.reduce((s, c) => s + Number(c.score), 0) / scoredClips.length).toFixed(1)
    : '—'

  const STATS = [
    { label: 'Total Clips',     value: String(clips.length), change: 'Saved clips',  dir: 'neutral', icon: '🎬' },
    { label: 'Processing Jobs', value: String(jobs.length),  change: `${jobs.filter(j => j.status === 'queued' || j.status === 'processing').length} active`, dir: 'neutral', icon: '⏱' },
    { label: 'Ready to Publish', value: String(clips.filter(c => c.status === 'ready').length), change: 'Generated clips', dir: 'neutral', icon: '📤' },
    { label: 'Avg Clip Score',  value: avgScore, change: 'AI confidence', dir: 'neutral', icon: '⚡' },
  ]

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Processing Jobs */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div>
              <div className="section-title">Processing Jobs</div>
              <div className="section-desc">Video jobs saved to your Supabase workspace</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('new')}>
              <Scissors size={12} /> New job
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2].map(n => <div key={n} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="card-desc" style={{ padding: '12px 0' }}>
              No jobs yet. Submit a video URL to queue your first clip.
            </div>
          ) : jobs.slice(0, 4).map(job => <JobRow key={job.id} job={job} />)}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="sidebar-layout">
        {/* Recent Clips */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Recent Clips</div>
              <div className="section-desc">AI-extracted highlights from your videos</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('clips')}>
              View all <ChevronRight size={12} />
            </button>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '8px 20px' }}>
              {loading ? (
                [1,2,3].map(n => <div key={n} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />)
              ) : clips.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-icon"><Film /></div>
                  <div className="empty-title">No clips saved yet</div>
                  <div className="empty-desc">Start a video processing job to build your clip library.</div>
                </div>
              ) : clips.slice(0, 6).map(clip => <ClipRow key={clip.id} clip={clip} />)}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="gap-stack">
          {/* Quick actions */}
          <div>
            <div className="section-header" style={{ marginBottom: 10 }}>
              <div className="section-title">Quick Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => onNavigate('new')}>
                <Scissors size={16} /> Process New Video
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('publish')}>
                <Share2 size={14} /> Manage Publish Queue
              </button>
            </div>
          </div>

          {/* Supabase workspace info */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  🟢
                </div>
                <div>
                  <div className="card-title">Supabase · Mumbai</div>
                  <div className="card-desc">llmcut-production · RLS active</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { table: 'processing_jobs', count: jobs.length },
                  { table: 'clips', count: clips.length },
                ].map(r => (
                  <div key={r.table} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.table}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{r.count} rows</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
