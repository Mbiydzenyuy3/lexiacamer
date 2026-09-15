-- ============================================================================
-- EARLY TESTERS AND FEEDBACK
--
-- Deliberately small. A tester is NOT a new kind of account: they are a parent
-- or a teacher using the app, and auth already handles that. What is missing
-- is a way to reach someone who volunteered, and a way for anyone to say what
-- went wrong without leaving the app to find a Facebook post.
--
-- So: two write-only mailboxes. No tester dashboard, no session table, no
-- badges, no admin screens. Those have no consumer until real feedback exists,
-- and an admin surface in the deployed app is the attack surface we removed on
-- purpose.
-- ============================================================================

create table testers (
  id          uuid primary key default gen_random_uuid(),
  role        text not null
              check (role in ('parent', 'teacher', 'learner', 'other')),
  name        text not null check (char_length(name) between 1 and 120),
  -- WhatsApp is how people are actually reachable in Cameroon. Either is
  -- enough; demanding both costs volunteers for no gain.
  whatsapp    text check (char_length(whatsapp) <= 40),
  email       text check (char_length(email) <= 200),
  testing_for text check (char_length(testing_for) <= 120),
  wants_help_with text check (char_length(wants_help_with) <= 120),
  -- No account is required to volunteer, and the prototype has no accounts at
  -- all. Left free-form so this stands alone.
  created_at  timestamptz not null default now(),
  check (coalesce(whatsapp, '') <> '' or coalesce(email, '') <> '')
);

create index testers_created_idx on testers (created_at desc);

alter table testers enable row level security;

-- Anyone may volunteer, including someone with no account. Nobody may read the
-- list back: it is a mailbox, not a directory.
create policy testers_insert on testers
  for insert to anon, authenticated with check (true);

-- ----------------------------------------------------------------------------
-- FEEDBACK
--
-- Reportable from inside the app, by anyone, signed in or not. Someone should
-- never have to leave the product to tell you it is broken.
-- ----------------------------------------------------------------------------
create table feedback (
  id         uuid primary key default gen_random_uuid(),
  -- Where they were. Free text rather than an enum: a new screen must not
  -- silently fail to accept feedback because a migration was forgotten.
  screen     text check (char_length(screen) <= 60),
  category   text not null default 'other'
             check (category in ('bug', 'audio', 'confusing', 'suggestion',
                                 'content', 'positive', 'other')),
  rating     text check (rating in ('great', 'good', 'confusing', 'difficult')),
  message    text check (char_length(message) <= 2000),
  -- Device details, because "the sound does not work" means something
  -- different on a five-year-old Android than on a laptop.
  user_agent text check (char_length(user_agent) <= 400),
  created_at timestamptz not null default now(),
  check (coalesce(message, '') <> '' or rating is not null)
);

create index feedback_created_idx on feedback (created_at desc);
create index feedback_category_idx on feedback (category, created_at desc);

alter table feedback enable row level security;

create policy feedback_insert on feedback
  for insert to anon, authenticated with check (true);

-- No select policy on either. You read them with the service role, from the
-- scripts, the same way school leads and the demand report already work.
grant insert on testers  to anon, authenticated;
grant insert on feedback to anon, authenticated;
