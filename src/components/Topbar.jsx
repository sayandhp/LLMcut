import { Database, LogOut } from 'lucide-react'

const TITLES = {
  dashboard: 'Dashboard',
  new: 'New Clip',
  clips: 'My Clips',
  publish: 'Publish',
  live: 'Live Stream',
  settings: 'Settings',
}

const DESCS = {
  dashboard: "Saved jobs and generated clips",
  new: "Save a video processing job",
  clips: "Browse saved clip records",
  publish: "Manage the local publishing queue",
  live: "Live capture is not connected",
  settings: "Database connection and records",
}

export default function Topbar({ page, userEmail, onSignOut }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{TITLES[page] || 'LLMcut'}</div>
        <div className="topbar-breadcrumb" style={{ fontSize: 11.5, marginTop: 1 }}>
          {DESCS[page]}
        </div>
      </div>

      <div className="topbar-actions" style={{ color: 'var(--text-tertiary)', fontSize: 12, gap: 7 }}>
        <Database size={14} /> {userEmail || 'Database workspace'}
        {onSignOut && <button className="btn btn-ghost btn-sm" onClick={onSignOut} title="Sign out"><LogOut size={13} /></button>}
      </div>
    </header>
  )
}
