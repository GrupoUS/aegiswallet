-- Performance indexes for contacts and financial events filtering

-- Contacts indexes
create index if not exists contacts_user_name_idx
  on public.contacts (user_id, lower(name));

create index if not exists contacts_user_email_idx
  on public.contacts (user_id, email)
  where email is not null;

create index if not exists contacts_user_phone_idx
  on public.contacts (user_id, phone)
  where phone is not null;

create index if not exists contacts_user_favorite_idx
  on public.contacts (user_id, is_favorite);

-- Financial events indexes
create index if not exists financial_events_user_event_date_idx
  on public.financial_events (user_id, event_date);

create index if not exists financial_events_user_due_date_idx
  on public.financial_events (user_id, due_date)
  where due_date is not null;

create index if not exists financial_events_user_type_idx
  on public.financial_events (user_id, event_type_id);

create index if not exists financial_events_user_category_idx
  on public.financial_events (user_id, category_id)
  where category_id is not null;

create index if not exists financial_events_user_completion_idx
  on public.financial_events (user_id, is_completed, event_date);


