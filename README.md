### Database setup
docker exec -it finance-tracker-mvp-main-db-1 psql -U postgres
CREATE DATABASE financetracker;
\c financetracker
\i /schema.sql