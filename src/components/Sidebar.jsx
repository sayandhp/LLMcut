import {
  LayoutDashboard, Scissors, Film, Send, Radio,
  Settings, Zap, ChevronRight
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'new',       icon: Scissors,        label: 'New Clip',   badge: null },
  { id: 'clips',     icon: Film,            label: 'My Clips' },
  { id: 'live',      icon: Radio,           label: 'Live Stream' },
  { id: 'publish',   icon: Send,            label: 'Publish' },
  { id: 'settings',  icon: Settings,        label: 'Settings', section: 'Config' },
]

export default function Sidebar({ activePage, onNavigate, userEmail }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4L8 2L13 4V12L8 14L3 12V4Z" fill="currentColor" opacity="0.15"/>
            <path d="M3 4L8 2L13 4V12L8 14L3 12V4Z" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="5.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
          </svg>
        </div>
        <span className="logo-text">LLM<span>cut</span></span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          const Icon = item.icon
          const prevSection = i > 0 ? NAV[i - 1].section : null
          return (
            <div key={item.id}>
              {item.section && item.section !== prevSection && (
                <div className="nav-section">{item.section}</div>
              )}
              <div
                className={`nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon />
                {item.label}
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="nav-item" onClick={() => onNavigate('settings')}>
          <Zap size={15} />
          Database
        </div>
        <div className="user-card">
          <div className="user-avatar">LC</div>
          <div className="user-info">
            <div className="user-name">{userEmail || 'LLMcut workspace'}</div>
            <div className="user-plan">{userEmail ? 'Authenticated account' : 'Development mode'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
