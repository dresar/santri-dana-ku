CREATE TABLE IF NOT EXISTS gemini_api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias       TEXT NOT NULL,
  key_value   TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'disabled', 'error')),
  usage_today INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 1500,
  total_calls BIGINT DEFAULT 0,
  last_used   TIMESTAMPTZ,
  last_error  TEXT,
  error_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gemini_keys_status_usage ON gemini_api_keys (status, usage_today ASC);

ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
