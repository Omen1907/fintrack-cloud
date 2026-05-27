![CI Pipeline](https://github.com/Omen1907/fintrack-cloud/actions/workflows/ci.yml/badge.svg)

### Database setup
docker exec -it finance-tracker-mvp-main-db-1 psql -U postgres
CREATE DATABASE financetracker;
\c financetracker
\i /schema.sql