-- Run this SQL to create the access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  secret_type TEXT NOT NULL,
  status TEXT NOT NULL,
  secret_value TEXT,
  justification TEXT,
  duration_days INTEGER DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE
);
