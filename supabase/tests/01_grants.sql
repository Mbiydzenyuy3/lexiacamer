-- Table privileges, mirroring what Supabase applies by default.
-- RLS is what restricts ROWS; these grants are the coarse layer underneath.
-- Note anon gets SELECT on everything, exactly as in a real Supabase project:
-- the protection comes from RLS, not from withholding table grants. Testing
-- against a stricter shim would prove less than production actually enforces.
grant usage on schema public to authenticated, anon;

grant select, insert, update, delete
  on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

grant select on all tables in schema public to anon;
grant insert on school_access_requests to anon;
