-- Run this in your Neon console (SQL Editor tab) to fix the production database.
-- It is safe to run multiple times.

-- 1. Add missing columns to the books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS drive_link text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed_at text;

-- 2. Create the journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id          serial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  content     text NOT NULL DEFAULT '',
  mood        text NOT NULL DEFAULT 'neutral'
                CHECK (mood IN ('happy','reflective','inspired','melancholic','neutral')),
  domain      text,
  tags        text[] NOT NULL DEFAULT '{}',
  book_id     integer,
  quote       text,
  minutes_read integer,
  pinned      boolean NOT NULL DEFAULT false,
  is_reread   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Add new columns to journal_entries if the table already existed
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS quote text;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS minutes_read integer;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_reread boolean NOT NULL DEFAULT false;
