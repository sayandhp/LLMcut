-- LLMcut core data model. All records are scoped to their authenticated owner.

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_url text not null check (length(source_url) <= 2048),
  source_type text not null default 'url' check (source_type in ('url', 'upload', 'live')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  model text not null default 'gemini',
  caption_style text not null default 'bold',
  min_clip_seconds integer not null default 30 check (min_clip_seconds between 1 and 180),
  max_clip_seconds integer not null default 90 check (max_clip_seconds between min_clip_seconds and 180),
  max_clips integer not null default 5 check (max_clips between 1 and 20),
  aspect_ratio text not null default '9:16' check (aspect_ratio in ('9:16', '1:1', '16:9')),
  output_quality text not null default '1080p' check (output_quality in ('720p', '1080p', '4K')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id uuid,
  title text not null check (length(title) between 1 and 500),
  source_url text,
  media_url text,
  thumbnail_url text,
  start_seconds double precision check (start_seconds is null or start_seconds >= 0),
  end_seconds double precision check (end_seconds is null or end_seconds >= 0),
  duration_seconds double precision check (duration_seconds is null or duration_seconds >= 0),
  score numeric(3,1) check (score is null or score between 0 and 10),
  status text not null default 'ready' check (status in ('ready', 'scheduled', 'posted', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint clips_job_owner_fk foreign key (job_id, user_id)
    references public.processing_jobs(id, user_id) on delete set null (job_id)
);

create table public.publish_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clip_id uuid not null,
  platform text not null check (platform in ('youtube', 'tiktok', 'reels', 'twitter')),
  scheduled_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'posted', 'failed', 'cancelled')),
  external_post_id text,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publish_queue_clip_owner_fk foreign key (clip_id, user_id)
    references public.clips(id, user_id) on delete cascade
);

create table public.app_settings (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null check (length(key) between 1 and 120),
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index processing_jobs_user_created_idx on public.processing_jobs(user_id, created_at desc);
create index clips_user_created_idx on public.clips(user_id, created_at desc);
create index clips_job_owner_idx on public.clips(job_id, user_id);
create index publish_queue_user_schedule_idx on public.publish_queue(user_id, status, scheduled_at);
create index publish_queue_clip_owner_idx on public.publish_queue(clip_id, user_id);

alter table public.processing_jobs enable row level security;
alter table public.clips enable row level security;
alter table public.publish_queue enable row level security;
alter table public.app_settings enable row level security;

create policy "Owners manage their processing jobs" on public.processing_jobs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners manage their clips" on public.clips
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners manage their publish queue" on public.publish_queue
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners manage their settings" on public.app_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.processing_jobs to authenticated;
grant select, insert, update, delete on public.clips to authenticated;
grant select, insert, update, delete on public.publish_queue to authenticated;
grant select, insert, update, delete on public.app_settings to authenticated;
