PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS processing_jobs (
  id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'url' CHECK (source_type IN ('url', 'upload', 'live')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  model TEXT NOT NULL DEFAULT 'gemini',
  caption_style TEXT NOT NULL DEFAULT 'bold',
  min_clip_seconds INTEGER NOT NULL DEFAULT 30,
  max_clip_seconds INTEGER NOT NULL DEFAULT 90,
  max_clips INTEGER NOT NULL DEFAULT 5,
  aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  output_quality TEXT NOT NULL DEFAULT '1080p',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES processing_jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  source_url TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  start_seconds REAL,
  end_seconds REAL,
  duration_seconds REAL,
  score REAL CHECK (score IS NULL OR (score >= 0 AND score <= 10)),
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'scheduled', 'posted', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS clips_created_at_idx ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS clips_status_idx ON clips(status);
CREATE INDEX IF NOT EXISTS processing_jobs_created_at_idx ON processing_jobs(created_at DESC);

CREATE TABLE IF NOT EXISTS publish_queue (
  id TEXT PRIMARY KEY,
  clip_id TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'reels', 'twitter')),
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'posted', 'failed', 'cancelled')),
  external_post_id TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS publish_queue_schedule_idx ON publish_queue(status, scheduled_at);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
