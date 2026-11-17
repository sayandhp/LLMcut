import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dataDir = join(root, 'data')
mkdirSync(dataDir, { recursive: true })
const db = new DatabaseSync(join(dataDir, 'llmcut.sqlite'))
db.exec(readFileSync(join(root, 'server', 'schema.sql'), 'utf8'))

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

function validateJob(data) {
  if (typeof data.sourceUrl !== 'string' || !data.sourceUrl.trim()) return 'A video URL is required.'
  try { new URL(data.sourceUrl) } catch { return 'Enter a valid URL including https://.' }
  if (data.sourceUrl.length > 2048) return 'The video URL is too long.'
  const min = Number(data.minClipSeconds ?? 30)
  const max = Number(data.maxClipSeconds ?? 90)
  const count = Number(data.maxClips ?? 5)
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 180) return 'Clip length settings are invalid.'
  if (!Number.isInteger(count) || count < 1 || count > 20) return 'Maximum clips must be between 1 and 20.'
  return null
}

export const apiHandler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }
  const url = new URL(req.url, 'http://localhost')
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, database: 'sqlite' })
    if (req.method === 'GET' && url.pathname === '/api/jobs') {
      return json(res, 200, db.prepare('SELECT * FROM processing_jobs ORDER BY created_at DESC').all())
    }
    if (req.method === 'POST' && url.pathname === '/api/jobs') {
      const data = await readBody(req)
      const error = validateJob(data)
      if (error) return json(res, 400, { error })
      const id = randomUUID()
      db.prepare(`INSERT INTO processing_jobs
        (id, source_url, source_type, model, caption_style, min_clip_seconds, max_clip_seconds, max_clips, aspect_ratio, output_quality)
        VALUES (?, ?, 'url', ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, data.sourceUrl.trim(), data.model || 'gemini', data.captionStyle || 'bold', Number(data.minClipSeconds ?? 30), Number(data.maxClipSeconds ?? 90), Number(data.maxClips ?? 5), ['9:16', '1:1', '16:9'].includes(data.aspectRatio) ? data.aspectRatio : '9:16', ['720p', '1080p', '4K'].includes(data.outputQuality) ? data.outputQuality : '1080p')
      return json(res, 201, db.prepare('SELECT * FROM processing_jobs WHERE id = ?').get(id))
    }
    if (req.method === 'GET' && url.pathname === '/api/clips') {
      const clips = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM publish_queue p WHERE p.clip_id = c.id AND p.status IN ('pending','scheduled')) AS pending_posts
        FROM clips c ORDER BY c.created_at DESC`).all()
      return json(res, 200, clips)
    }
    if (req.method === 'POST' && url.pathname === '/api/clips') {
      const data = await readBody(req)
      if (typeof data.title !== 'string' || !data.title.trim()) return json(res, 400, { error: 'A clip title is required.' })
      const id = randomUUID()
      db.prepare(`INSERT INTO clips (id, job_id, title, source_url, media_url, thumbnail_url, start_seconds, end_seconds, duration_seconds, score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, data.jobId || null, data.title.trim(), data.sourceUrl || null, data.mediaUrl || null, data.thumbnailUrl || null, data.startSeconds ?? null, data.endSeconds ?? null, data.durationSeconds ?? null, data.score ?? null)
      return json(res, 201, db.prepare('SELECT * FROM clips WHERE id = ?').get(id))
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/clips/')) {
      const id = url.pathname.slice('/api/clips/'.length)
      const result = db.prepare('DELETE FROM clips WHERE id = ?').run(id)
      return result.changes ? json(res, 200, { deleted: true }) : json(res, 404, { error: 'Clip not found.' })
    }
    if (req.method === 'GET' && url.pathname === '/api/publish') {
      return json(res, 200, db.prepare(`SELECT p.*, c.title AS clip_title, c.thumbnail_url FROM publish_queue p JOIN clips c ON c.id = p.clip_id ORDER BY COALESCE(p.scheduled_at, p.created_at)`).all())
    }
    if (req.method === 'POST' && url.pathname === '/api/publish') {
      const data = await readBody(req)
      if (!['youtube', 'tiktok', 'reels', 'twitter'].includes(data.platform)) return json(res, 400, { error: 'Choose a supported platform.' })
      if (!data.clipId || !db.prepare('SELECT id FROM clips WHERE id = ?').get(data.clipId)) return json(res, 400, { error: 'Choose an existing clip.' })
      const id = randomUUID()
      const status = data.scheduledAt ? 'scheduled' : 'pending'
      db.prepare('INSERT INTO publish_queue (id, clip_id, platform, scheduled_at, status) VALUES (?, ?, ?, ?, ?)').run(id, data.clipId, data.platform, data.scheduledAt || null, status)
      db.prepare("UPDATE clips SET status = 'scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(data.clipId)
      return json(res, 201, db.prepare('SELECT * FROM publish_queue WHERE id = ?').get(id))
    }
    return json(res, 404, { error: 'Not found.' })
  } catch (error) {
    if (error instanceof SyntaxError) return json(res, 400, { error: 'Request body must be valid JSON.' })
    console.error(error)
    return json(res, 500, { error: 'The request could not be completed.' })
  }
}

const server = createServer(apiHandler)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  const port = Number(process.env.API_PORT || 3001)
  server.listen(port, '127.0.0.1', () => console.log(`LLMcut API listening on http://localhost:${port}`))

  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    db.close()
    server.close(() => process.exit(0))
  })
}
