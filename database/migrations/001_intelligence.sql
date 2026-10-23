-- Additive schema only. No conversations, family questions, phone numbers or raw QR payloads.
CREATE SCHEMA IF NOT EXISTS kavach;
CREATE TABLE IF NOT EXISTS kavach.campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
 summary text NOT NULL CHECK (char_length(summary) BETWEEN 3 AND 700),
 region text NOT NULL CHECK (region IN ('Chennai','India')),
 first_seen timestamptz NOT NULL,
 reviewed boolean NOT NULL DEFAULT false,
 source_url text NOT NULL CHECK (source_url LIKE 'https://%'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kavach.reputation (
 hostname text PRIMARY KEY CHECK (char_length(hostname) BETWEEN 3 AND 253 AND hostname ~ '^[a-z0-9][a-z0-9.-]+[a-z0-9]$'),
 report_count integer NOT NULL CHECK (report_count > 0),
 reviewed boolean NOT NULL DEFAULT false,
 evidence_url text NOT NULL CHECK (evidence_url LIKE 'https://%'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
