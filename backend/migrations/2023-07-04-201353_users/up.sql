-- Your SQL goes here
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  fgs INTEGER NOT NULL UNIQUE,
  firstname VARCHAR NOT NULL,
  lastname VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
