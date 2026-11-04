-- Run this whole file once in Supabase: SQL Editor > New query > Run

create table student (
  student_id  bigint generated always as identity primary key,
  username    text not null,
  email       text not null unique,
  password    text not null,
  age         int,
  gender      text,
  course      text,
  birthdate   date,
  profile_pic text,
  created_at  timestamptz not null default now()
);

create table admin (
  email    text primary key,
  password text not null
);

create table post (
  post_id      bigint generated always as identity primary key,
  student_id   bigint references student(student_id) on delete cascade,
  description  text not null default '',
  feeling      text,
  image        text,
  is_anonymous boolean not null default false,
  removed      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table comment (
  comment_id bigint generated always as identity primary key,
  post_id    bigint not null references post(post_id) on delete cascade,
  parent_id  bigint references comment(comment_id) on delete cascade,
  student_id bigint not null references student(student_id) on delete cascade,
  text       text not null,
  removed    boolean not null default false,
  created_at timestamptz not null default now()
);

create table reaction (
  post_id    bigint references post(post_id) on delete cascade,
  student_id bigint references student(student_id) on delete cascade,
  type       text not null,
  primary key (post_id, student_id)
);

create table repost (
  post_id    bigint references post(post_id) on delete cascade,
  student_id bigint references student(student_id) on delete cascade,
  primary key (post_id, student_id)
);

create table report (
  report_id  bigint generated always as identity primary key,
  post_id    bigint references post(post_id) on delete cascade,
  comment_id bigint references comment(comment_id) on delete cascade,
  student_id bigint not null references student(student_id) on delete cascade,
  reason     text not null,
  details    text,
  created_at timestamptz not null default now()
);
create unique index report_once_post    on report (student_id, post_id)    where comment_id is null;
create unique index report_once_comment on report (student_id, comment_id) where comment_id is not null;

create table notification (
  notification_id bigint generated always as identity primary key,
  student_id    bigint not null references student(student_id) on delete cascade,
  actor_id      bigint references student(student_id) on delete cascade,
  type          text not null,            -- reaction | comment | reply | repost | admin
  post_id       bigint references post(post_id) on delete cascade,
  comment_id    bigint references comment(comment_id) on delete cascade,
  reaction_type text,
  message       text,
  action        text,                     -- post_removed | comment_removed | post_hidden | comment_hidden
  reason        text,
  admin_note    text,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table message (
  message_id  bigint generated always as identity primary key,
  sender_id   bigint not null references student(student_id) on delete cascade,
  receiver_id bigint not null references student(student_id) on delete cascade,
  text        text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table message_report (
  report_id   bigint generated always as identity primary key,
  reporter_id bigint not null references student(student_id) on delete cascade,
  reported_id bigint not null references student(student_id) on delete cascade,
  reason      text not null,
  details     text,
  created_at  timestamptz not null default now()
);

create table block (
  blocker_id bigint references student(student_id) on delete cascade,
  blocked_id bigint references student(student_id) on delete cascade,
  primary key (blocker_id, blocked_id)
);

create table appeal (
  appeal_id       bigint generated always as identity primary key,
  notification_id bigint not null unique references notification(notification_id) on delete cascade,
  student_id      bigint not null references student(student_id) on delete cascade,
  post_id         bigint references post(post_id) on delete cascade,
  comment_id      bigint references comment(comment_id) on delete cascade,
  action          text not null,
  message         text not null,
  status          text not null default 'pending',   -- pending | accepted | declined
  admin_note      text,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- Security: the app talks to the database ONLY from the server with the service-role key.
-- RLS on with no policies = the public (anon) key can read nothing.
do $$ declare t text; begin
  for t in select unnest(array['student','admin','post','comment','reaction','repost','report',
    'notification','message','message_report','block','appeal']) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Image storage bucket (public read; only the server writes)
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Create your first admin (replace email/password hash; see README for how to make a hash)
-- insert into admin (email, password) values ('admin@example.com', '<bcrypt hash>');
