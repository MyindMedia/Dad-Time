insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', true) on conflict (id) do nothing;
