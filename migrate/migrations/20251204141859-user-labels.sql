-- +migrate Up
-- name: Add user labels support
-- Adds support for labeling users with key-value pairs similar to service labels

-- Add a tgt_user_id column to the labels table to support user labels
ALTER TABLE labels ADD COLUMN tgt_user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Drop the NOT NULL constraint on tgt_service_id since we now support multiple target types
ALTER TABLE labels ALTER COLUMN tgt_service_id DROP NOT NULL;

-- Update the unique constraint to work with either service or user targets
ALTER TABLE labels DROP CONSTRAINT labels_tgt_service_id_key_key;

-- Add new unique constraints for both service and user labels
ALTER TABLE labels ADD CONSTRAINT labels_tgt_service_id_key_unique UNIQUE (tgt_service_id, key);
ALTER TABLE labels ADD CONSTRAINT labels_tgt_user_id_key_unique UNIQUE (tgt_user_id, key);

-- Add a check constraint to ensure exactly one target is specified
ALTER TABLE labels ADD CONSTRAINT labels_single_target_check 
    CHECK ((tgt_service_id IS NOT NULL)::int + (tgt_user_id IS NOT NULL)::int = 1);

-- Add index for user labels
CREATE INDEX idx_labels_user_id ON labels (tgt_user_id);

-- +migrate Down
-- Remove user label support

DROP INDEX IF EXISTS idx_labels_user_id;
ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_single_target_check;
ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_tgt_user_id_key_unique;
ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_tgt_service_id_key_unique;
ALTER TABLE labels ADD CONSTRAINT labels_tgt_service_id_key_key UNIQUE (tgt_service_id, key);
ALTER TABLE labels ALTER COLUMN tgt_service_id SET NOT NULL;
ALTER TABLE labels DROP COLUMN IF EXISTS tgt_user_id;