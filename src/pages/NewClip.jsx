import { useState } from 'react'
import { api } from '../lib/api'
import { Link, Upload, Zap, ChevronRight, Sparkles, Scissors } from 'lucide-react'

const AI_MODELS = [
  { id: 'gemini', logo: '✦', name: 'Gemini 1.5',  desc: 'Google · Fast & multimodal' },
  { id: 'gpt4',   logo: '◉', name: 'GPT-4o',      desc: 'OpenAI · Great reasoning' },
  { id: 'claude', logo: '◈', name: 'Claude 3.5',  desc: 'Anthropic · Long context' },
  { id: 'grok',   logo: '✕', name: 'Grok 2',      desc: 'xAI · Fast inference' },
  { id: 'ollama', logo: '◎', name: 'Ollama',      desc: 'Local · Private & free' },
  { id: 'none',   logo: '♬', name: 'Audio Only',  desc: 'No API key required' },
]

const CAPTION_STYLES = [
  { id: 'bold',    label: 'Bold',    preview: 'white bold word highlights' },
  { id: 'neon',    label: 'Neon',    preview: 'glowing word highlights' },
  { id: 'minimal', label: 'Minimal', preview: 'clean, minimal captions' },
  { id: 'karaoke', label: 'Karaoke', preview: 'progressive word reveal' },
]

export default function NewClip({ onNavigate }) {
  const [step, setStep] = useState(1)
  const [sourceType, setSourceType] = useState('url')
  const [url, setUrl] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini')
  const [captionStyle, setCaptionStyle] = useState('bold')
  const [maxClips, setMaxClips] = useState(5)
  const [isDrag, setIsDrag] = useState(false)
  const [minClipSeconds, setMinClipSeconds] = useState(30)
  const [maxClipSeconds, setMaxClipSeconds] = useState(90)
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [outputQuality, setOutputQuality] = useState('1080p')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const canProceed1 = url.length > 10

  async function startProcessing() {
    setIsSaving(true)
    setError('')
    try {
      await api.createJob({
        sourceUrl: url,
        model: selectedModel,
        captionStyle,
        minClipSeconds,
        maxClipSeconds,
        maxClips,
        aspectRatio,
        outputQuality,
      })
      onNavigate('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Steps */}
      <div className="process-steps" style={{ marginBottom: 32 }}>
        {['Source', 'AI Config', 'Output', 'Review'].map((label, i) => (
          <div key={label} className={`process-step${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
            <div className={`step-node${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <div className="step-label">{label}</div>
            {i < 3 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="gap-stack">
          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 4 }}>Video Source</div>
              <div className="card-desc" style={{ marginBottom: 20 }}>
                Paste a YouTube, Twitch, or Kick URL to queue it for processing
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {[
                  { id: 'url', icon: Link, label: 'Paste URL' },
                  { id: 'file', icon: Upload, label: 'Upload File (coming soon)' },
                ].map(opt => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      className={`btn ${sourceType === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSourceType(opt.id)}
                      disabled={opt.id === 'file'}
                    >
                      <Icon size={13} /> {opt.label}
                    </button>
                  )
                })}
              </div>

              {sourceType === 'url' ? (
                <div className="gap-stack">
                  <div className="input-group">
                    <label className="input-label">Video URL</label>
                    <div className="input-addon">
                      <div className="input-addon-prefix">
                        <Link size={13} />
                      </div>
                      <input
                        className="input"
                        placeholder="https://youtube.com/watch?v=... or twitch.tv/..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['▶ YouTube', '💜 Twitch', '🟢 Kick', '📹 Direct MP4'].map(p => (
                      <div key={p} style={{
                        padding: '4px 10px', background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)', borderRadius: 20,
                        fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500
                      }}>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`upload-zone${isDrag ? ' drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
                  onDragLeave={() => setIsDrag(false)}
                  onDrop={() => setIsDrag(false)}
                >
                  <div className="upload-icon"><Upload /></div>
                  <div className="upload-title">Drop your video here</div>
                  <div className="upload-desc">
                    Drag & drop, or <strong>click to browse</strong><br />
                    MP4, MOV, MKV, AVI — up to 10 GB
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" disabled={!canProceed1} onClick={() => setStep(2)}>
              Continue <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="gap-stack">
          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 4 }}>Preferred AI Model</div>
              <div className="card-desc" style={{ marginBottom: 16 }}>
                This preference is saved with the job. AI keys are configured in Settings.
              </div>
              <div className="model-grid">
                {AI_MODELS.map(m => (
                  <div
                    key={m.id}
                    className={`model-card${selectedModel === m.id ? ' selected' : ''}`}
                    onClick={() => setSelectedModel(m.id)}
                  >
                    <div className="model-card-check" />
                    <div className="model-logo">{m.logo}</div>
                    <div className="model-name">{m.name}</div>
                    <div className="model-desc">{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
              Continue <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="gap-stack">
          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 16 }}>Clip Length & Count</div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Min length (seconds)</label>
                  <input className="input" type="number" value={minClipSeconds}
                    onChange={e => setMinClipSeconds(Number(e.target.value))} min={1} max={180} />
                </div>
                <div className="input-group">
                  <label className="input-label">Max length (seconds)</label>
                  <input className="input" type="number" value={maxClipSeconds}
                    onChange={e => setMaxClipSeconds(Number(e.target.value))} min={1} max={180} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 14 }}>
                <label className="input-label">Maximum clips to generate</label>
                <select className="input select" value={maxClips} onChange={e => setMaxClips(Number(e.target.value))}>
                  {[3, 5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} clips</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 4 }}>Caption Style</div>
              <div className="card-desc" style={{ marginBottom: 16 }}>Saved with the job</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {CAPTION_STYLES.map(s => (
                  <div
                    key={s.id}
                    className={`model-card${captionStyle === s.id ? ' selected' : ''}`}
                    onClick={() => setCaptionStyle(s.id)}
                    style={{ padding: '12px 10px' }}
                  >
                    <div className="model-card-check" />
                    <div style={{
                      height: 60, background: '#000', borderRadius: 6, marginBottom: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: 'white', fontSize: 12,
                      textShadow: s.id === 'neon' ? '0 0 10px #fff, 0 0 20px #fff' : 'none',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      {s.id === 'bold'    && <span style={{ background: '#fff', color: '#000', padding: '2px 6px', borderRadius: 3 }}>WORD</span>}
                      {s.id === 'neon'    && 'WORD'}
                      {s.id === 'minimal' && <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400, fontSize: 11 }}>word by word</span>}
                      {s.id === 'karaoke' && <span><span style={{ color: '#fff' }}>WOR</span><span style={{ color: 'rgba(255,255,255,0.3)' }}>D</span></span>}
                    </div>
                    <div className="model-name" style={{ fontSize: 12 }}>{s.label}</div>
                    <div className="model-desc">{s.preview}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 14 }}>Format</div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Aspect Ratio</label>
                  <select className="input select" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                    <option value="9:16">9:16 — TikTok / Reels / Shorts</option>
                    <option value="1:1">1:1 — Instagram Feed</option>
                    <option value="16:9">16:9 — YouTube (original)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Output Quality</label>
                  <select className="input select" value={outputQuality} onChange={e => setOutputQuality(e.target.value)}>
                    <option value="1080p">1080p — Recommended</option>
                    <option value="720p">720p — Smaller files</option>
                    <option value="4K">4K — Maximum</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(4)}>
              Review <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="gap-stack">
          <div className="card">
            <div className="card-body">
              <div className="card-title" style={{ marginBottom: 16 }}>Processing Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Source URL',     value: url },
                  { label: 'AI Model',       value: AI_MODELS.find(m => m.id === selectedModel)?.name },
                  { label: 'Max Clips',      value: `${maxClips} clips` },
                  { label: 'Duration Range', value: `${minClipSeconds}–${maxClipSeconds} seconds` },
                  { label: 'Caption Style',  value: CAPTION_STYLES.find(s => s.id === captionStyle)?.label },
                  { label: 'Output Format',  value: `${aspectRatio} · ${outputQuality}` },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '12px 14px', background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Sparkles size={18} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Job saved to Supabase · owner-scoped via RLS
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    Video downloading, transcription, AI analysis and rendering connect to this job record. The processing worker reads it from the queue.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ color: 'var(--danger)', fontSize: 12.5, padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
            <button
              className="btn btn-primary btn-lg"
              onClick={startProcessing}
              disabled={isSaving || minClipSeconds < 1 || maxClipSeconds < minClipSeconds}
            >
              <Zap size={15} /> {isSaving ? 'Saving…' : 'Save to Queue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
