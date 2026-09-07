-- S.T.E.P.S. Platform Schema
-- Run this in the Supabase SQL Editor after creating your project.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  email_opt_in boolean not null default true,
  email_bounced boolean not null default false,
  created_at timestamptz not null default now()
);

-- Weekly S.T.E.P.S. templates (admin-authored)
create table public.weekly_steps (
  id uuid primary key default gen_random_uuid(),
  week_number int unique not null,
  scripture_text text not null,
  scripture_reference text not null default '',
  theme_title text not null,
  nugget_text text not null,
  share_prompt text not null default 'Share one way you will live out this week''s theme.',
  created_at timestamptz not null default now(),
  created_by uuid references public.users (id)
);

-- Exactly two engagement questions per week (enforced in RPC)
create table public.engagement_questions (
  id uuid primary key default gen_random_uuid(),
  weekly_step_id uuid not null references public.weekly_steps (id) on delete cascade,
  question_number int not null check (question_number in (1, 2)),
  question_text text not null,
  unique (weekly_step_id, question_number)
);

-- Threaded comments (adjacency list)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  target_question_id uuid not null references public.engagement_questions (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

-- Custom reactions: HEART | PRAYER | THINKING (one per user per comment)
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  emoji_type text not null check (emoji_type in ('HEART', 'PRAYER', 'THINKING')),
  created_at timestamptz not null default now(),
  unique (user_id, comment_id)
);

-- Prayer requests with optional anonymity
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  weekly_step_id uuid not null references public.weekly_steps (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  is_anonymous boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for thread / week loading
create index comments_parent_id_idx on public.comments (parent_id);
create index comments_target_question_id_idx on public.comments (target_question_id);
create index comments_created_at_idx on public.comments (created_at);
create index reactions_comment_id_idx on public.reactions (comment_id);
create index prayer_requests_weekly_step_id_idx on public.prayer_requests (weekly_step_id);
create index prayer_requests_created_at_idx on public.prayer_requests (created_at);
create index weekly_steps_week_number_idx on public.weekly_steps (week_number desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'USER'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- Atomic weekly create: one weekly_steps + exactly two questions
create or replace function public.create_weekly_steps(
  p_week_number int,
  p_scripture_text text,
  p_scripture_reference text,
  p_theme_title text,
  p_nugget_text text,
  p_share_prompt text,
  p_question_1 text,
  p_question_2 text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only ADMIN users can create weekly S.T.E.P.S.';
  end if;

  insert into public.weekly_steps (
    week_number, scripture_text, scripture_reference,
    theme_title, nugget_text, share_prompt, created_by
  ) values (
    p_week_number, p_scripture_text, p_scripture_reference,
    p_theme_title, p_nugget_text, p_share_prompt, auth.uid()
  )
  returning id into v_id;

  insert into public.engagement_questions (weekly_step_id, question_number, question_text)
  values
    (v_id, 1, p_question_1),
    (v_id, 2, p_question_2);

  return v_id;
end;
$$;

-- Atomic weekly update: weekly_steps fields + both questions
create or replace function public.update_weekly_steps(
  p_id uuid,
  p_week_number int,
  p_scripture_text text,
  p_scripture_reference text,
  p_theme_title text,
  p_nugget_text text,
  p_share_prompt text,
  p_question_1 text,
  p_question_2 text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only ADMIN users can edit weekly S.T.E.P.S.';
  end if;

  if not exists (select 1 from public.weekly_steps where id = p_id) then
    raise exception 'Week not found';
  end if;

  update public.weekly_steps
  set
    week_number = p_week_number,
    scripture_text = p_scripture_text,
    scripture_reference = p_scripture_reference,
    theme_title = p_theme_title,
    nugget_text = p_nugget_text,
    share_prompt = p_share_prompt
  where id = p_id;

  update public.engagement_questions
  set question_text = p_question_1
  where weekly_step_id = p_id and question_number = 1;

  update public.engagement_questions
  set question_text = p_question_2
  where weekly_step_id = p_id and question_number = 2;

  return p_id;
end;
$$;

-- Recursive comment tree for one question
create or replace function public.get_comment_tree(p_question_id uuid)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  target_question_id uuid,
  parent_id uuid,
  content text,
  created_at timestamptz,
  depth int,
  heart_count bigint,
  prayer_count bigint,
  thinking_count bigint,
  my_reaction text
)
language sql
stable
security invoker
set search_path = public
as $$
  with recursive tree as (
    select
      c.id,
      c.user_id,
      u.display_name,
      c.target_question_id,
      c.parent_id,
      c.content,
      c.created_at,
      0 as depth
    from public.comments c
    join public.users u on u.id = c.user_id
    where c.target_question_id = p_question_id
      and c.parent_id is null

    union all

    select
      c.id,
      c.user_id,
      u.display_name,
      c.target_question_id,
      c.parent_id,
      c.content,
      c.created_at,
      t.depth + 1
    from public.comments c
    join public.users u on u.id = c.user_id
    join tree t on c.parent_id = t.id
  )
  select
    t.id,
    t.user_id,
    t.display_name,
    t.target_question_id,
    t.parent_id,
    t.content,
    t.created_at,
    t.depth,
    coalesce(sum(case when r.emoji_type = 'HEART' then 1 else 0 end), 0) as heart_count,
    coalesce(sum(case when r.emoji_type = 'PRAYER' then 1 else 0 end), 0) as prayer_count,
    coalesce(sum(case when r.emoji_type = 'THINKING' then 1 else 0 end), 0) as thinking_count,
    (
      select r2.emoji_type
      from public.reactions r2
      where r2.comment_id = t.id and r2.user_id = auth.uid()
      limit 1
    ) as my_reaction
  from tree t
  left join public.reactions r on r.comment_id = t.id
  group by
    t.id, t.user_id, t.display_name, t.target_question_id,
    t.parent_id, t.content, t.created_at, t.depth
  order by t.created_at asc;
$$;

-- Toggle reaction: same emoji deletes; different emoji updates; none inserts
create or replace function public.toggle_reaction(
  p_comment_id uuid,
  p_emoji_type text
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing text;
begin
  if p_emoji_type not in ('HEART', 'PRAYER', 'THINKING') then
    raise exception 'Invalid emoji_type';
  end if;

  select emoji_type into v_existing
  from public.reactions
  where comment_id = p_comment_id and user_id = auth.uid();

  if v_existing is null then
    insert into public.reactions (user_id, comment_id, emoji_type)
    values (auth.uid(), p_comment_id, p_emoji_type);
    return p_emoji_type;
  elsif v_existing = p_emoji_type then
    delete from public.reactions
    where comment_id = p_comment_id and user_id = auth.uid();
    return null;
  else
    update public.reactions
    set emoji_type = p_emoji_type
    where comment_id = p_comment_id and user_id = auth.uid();
    return p_emoji_type;
  end if;
end;
$$;

-- Optional: scrub prayer requests older than 90 days (enable pg_cron in Supabase)
-- select cron.schedule(
--   'scrub-old-prayers',
--   '0 3 * * *',
--   $$delete from public.prayer_requests where created_at < now() - interval '90 days'$$
-- );

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.weekly_steps enable row level security;
alter table public.engagement_questions enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.prayer_requests enable row level security;

-- users
create policy "Users can read all profiles"
  on public.users for select to authenticated
  using (true);

create policy "Users can update own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));

-- weekly_steps
create policy "Authenticated can read weekly steps"
  on public.weekly_steps for select to authenticated
  using (true);

create policy "Admins can insert weekly steps"
  on public.weekly_steps for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update weekly steps"
  on public.weekly_steps for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete weekly steps"
  on public.weekly_steps for delete to authenticated
  using (public.is_admin());

-- engagement_questions
create policy "Authenticated can read questions"
  on public.engagement_questions for select to authenticated
  using (true);

create policy "Admins can insert questions"
  on public.engagement_questions for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update questions"
  on public.engagement_questions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete questions"
  on public.engagement_questions for delete to authenticated
  using (public.is_admin());

-- comments
create policy "Authenticated can read comments"
  on public.comments for select to authenticated
  using (true);

create policy "Authenticated can insert own comments"
  on public.comments for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own comments"
  on public.comments for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own comments"
  on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- reactions
create policy "Authenticated can read reactions"
  on public.reactions for select to authenticated
  using (true);

create policy "Authenticated can insert own reactions"
  on public.reactions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own reactions"
  on public.reactions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own reactions"
  on public.reactions for delete to authenticated
  using (user_id = auth.uid());

-- prayer_requests
-- Note: user_id is returned; frontend must not display name when is_anonymous.
-- Non-authors cannot infer identity beyond what's needed for moderation by admin.
create policy "Authenticated can read visible prayers"
  on public.prayer_requests for select to authenticated
  using (
    is_hidden = false
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated can insert own prayers"
  on public.prayer_requests for insert to authenticated
  with check (user_id = auth.uid());

create policy "Authors can update own prayers"
  on public.prayer_requests for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Authors or admin can delete prayers"
  on public.prayer_requests for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Grants
grant usage on schema public to authenticated;
grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.weekly_steps to authenticated;
grant select, insert, update, delete on public.engagement_questions to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.reactions to authenticated;
grant select, insert, update, delete on public.prayer_requests to authenticated;

grant execute on function public.create_weekly_steps to authenticated;
grant execute on function public.update_weekly_steps to authenticated;
grant execute on function public.get_comment_tree to authenticated;
grant execute on function public.toggle_reaction to authenticated;
grant execute on function public.is_admin to authenticated;
