import { Radio } from 'lucide-react'

export default function LiveStream() {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
        <div className="empty-icon"><Radio /></div>
        <div className="empty-title">Live capture is not connected</div>
        <div className="empty-desc">This screen previously showed simulated viewers, chat, and clips. Those demos have been removed. Live capture needs a stream ingest and processing service before it can show real data.</div>
      </div>
    </div>
  )
}
