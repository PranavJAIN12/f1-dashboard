create extension if not exists pgcrypto;
create table if not exists races (
 id uuid primary key default gen_random_uuid(),
 season integer not null,
 round integer not null,
 event_name text not null,
 country text,
 location text,
 event_date date,
 unique(season, round)
);
create table if not exists drivers (
 id uuid primary key default gen_random_uuid(),
 code text unique not null,
 full_name text not null,
 team text
);
create table if not exists race_results (
 id uuid primary key default gen_random_uuid(),
 race_id uuid references races(id) on delete cascade,
 session_type text not null,
 driver_code text not null,
 position integer,
 grid_position integer,
 points numeric,
 status text,
 laps integer,
 fastest_lap_seconds numeric
);
create index if not exists idx_results_race on race_results(race_id);
create index if not exists idx_results_driver on race_results(driver_code);
