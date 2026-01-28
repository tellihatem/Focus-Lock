/**
 * Database schema initialization and migrations
 * Handles SQLite database setup for task storage
 */

/**
 * SQL schema for the tasks table
 * Stores all task-related data with proper indexing for performance
 */
export const TASKS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    difficulty TEXT NOT NULL DEFAULT 'medium',
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    due_date INTEGER,
    created_at_index INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
  CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
`;

/**
 * SQL schema for metadata table
 * Tracks database version for migrations
 */
export const METADATA_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

/**
 * Current database schema version
 */
export const SCHEMA_VERSION = 1;

/**
 * Initialize metadata table with current schema version
 */
export const INIT_METADATA = `
  INSERT OR IGNORE INTO metadata (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}');
`;
