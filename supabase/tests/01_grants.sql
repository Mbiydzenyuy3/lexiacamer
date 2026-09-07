-- Table privileges for the signed-in role. RLS is what restricts ROWS; these
-- grants are the coarse table-level layer underneath it. Supabase applies the
-- equivalent automatically.
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant usage on schema public to anon;
grant insert on school_access_requests to anon;
