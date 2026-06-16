CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL DEFAULT 'admin',
    action VARCHAR(20) NOT NULL,
    entity VARCHAR(20) NOT NULL,
    entity_id VARCHAR(255),
    details TEXT,
    result VARCHAR(10) NOT NULL DEFAULT 'success',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
