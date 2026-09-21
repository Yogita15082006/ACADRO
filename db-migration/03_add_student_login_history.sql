-- ==============================================================================
-- Student Login History Table
-- ==============================================================================
-- Tracks successful student login events for HOD / Coordinator reporting.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS student_login_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slh_student_id ON student_login_history(student_id);
CREATE INDEX IF NOT EXISTS idx_slh_login_timestamp ON student_login_history(login_timestamp DESC);
