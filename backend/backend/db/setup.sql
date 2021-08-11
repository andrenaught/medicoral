-- Quickly create DB user & database
CREATE USER medicoral WITH PASSWORD [password];
CREATE DATABASE medicoral WITH OWNER medicoral;
REVOKE connect ON DATABASE medicoral FROM PUBLIC;
GRANT connect ON DATABASE medicoral TO medicoral;

-- Might need to execute these permission commands after adding in new tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medicoral; -- allows select, update, delete
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public to medicoral; -- allows insert