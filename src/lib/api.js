import { supabase } from './supabase'

async function localRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export const api = {
  health: async () => supabase ? { ok: true, database: 'supabase' } : localRequest('/health'),
  jobs: async () => supabase
    ? unwrap(await supabase.from('processing_jobs').select('*').order('created_at', { ascending: false }))
    : localRequest('/jobs'),
  clips: async () => supabase
    ? unwrap(await supabase.from('clips').select('*').order('created_at', { ascending: false }))
    : localRequest('/clips'),
  publishing: async () => {
    if (!supabase) return localRequest('/publish')
    const rows = unwrap(await supabase.from('publish_queue').select('*, clips(title)').order('scheduled_at', { ascending: true, nullsFirst: false }))
    return rows.map(row => ({ ...row, clip_title: row.clips?.title || 'Clip', clips: undefined }))
  },
  createJob: async data => supabase
    ? unwrap(await supabase.from('processing_jobs').insert({
      source_url: data.sourceUrl.trim(), model: data.model || 'gemini', caption_style: data.captionStyle || 'bold',
      min_clip_seconds: Number(data.minClipSeconds ?? 30), max_clip_seconds: Number(data.maxClipSeconds ?? 90),
      max_clips: Number(data.maxClips ?? 5), aspect_ratio: data.aspectRatio || '9:16', output_quality: data.outputQuality || '1080p',
    }).select().single())
    : localRequest('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  createPublish: async data => supabase
    ? unwrap(await supabase.from('publish_queue').insert({ clip_id: data.clipId, platform: data.platform, scheduled_at: data.scheduledAt || null, status: data.scheduledAt ? 'scheduled' : 'pending' }).select().single())
    : localRequest('/publish', { method: 'POST', body: JSON.stringify(data) }),
  deleteClip: async id => supabase
    ? unwrap(await supabase.from('clips').delete().eq('id', id))
    : localRequest(`/clips/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
