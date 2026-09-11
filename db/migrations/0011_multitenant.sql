-- Multi-tenant foundation for the shared growth platform (Supabase project "medicare-hospitals").
-- One platform, many organisations (Medicare Hospitals, Medicare Skin & Hair Clinic), each with branches.
-- Phase 1 of the central-agent plan, 11 Sep 2026. Applied to production via the Supabase MCP as
-- migration "multitenant_orgs_branches"; this file is the source copy.
--
-- Rules that keep the live hospital agent working untouched:
--   * every new tenant column has a DEFAULT pointing at the hospital's org/branch, so code that does not
--     yet know about tenants keeps inserting valid rows;
--   * the old unique index conversations(channel, external_id) STAYS until the Phase 2 code upserts on
--     the new (branch_id, channel, external_id) key;
--   * staff policies become org-scoped, but admins get all_orgs = true so nobody loses access today.
--
-- Not seeded here (ids live in Vercel env, copy them in Phase 2):
--   branches.wa_phone_number_id, ig_user_id, fb_page_id, ad_account_id for mh-kaikaluru.

-- ---------- organisations ----------
create table if not exists orgs (
  slug            text primary key,
  name_te         text not null,
  name_en         text not null,
  kind            text not null default 'clinic' check (kind in ('hospital','clinic')),
  agent_name_te   text,
  agent_name_en   text,
  agent_role_te   text,
  agent_role_en   text,
  phone           text,
  email           text,
  website         text,
  meta_app_id     text,
  waba_id         text,
  ad_account_id   text,
  brand           jsonb not null default '{}'::jsonb,
  settings        jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ---------- branches (one hospital, ten clinics) ----------
create table if not exists branches (
  id                 text primary key,                      -- 'mh-kaikaluru', 'ms-bhimavaram'
  org_slug           text not null references orgs(slug) on delete cascade,
  slug               text not null,
  name_te            text not null,
  name_en            text not null,
  town_te            text,
  town_en            text,
  pincode            text,
  address_en         text,
  address_te         text,
  maps_url           text,
  maps_query         text,
  map_embed          text,
  lat                double precision,
  lng                double precision,
  phones             text[] not null default '{}'::text[],
  whatsapp_display   text,           -- wa_id digits (the number patients know)
  wa_phone_number_id text,           -- Meta Cloud API phone_number_id, null until onboarded
  ig_user_id         text,           -- Instagram business account id (webhook entry.id)
  ig_handle          text,
  fb_page_id         text,
  ad_account_id      text,
  hms_branch_id      uuid,
  doctors            jsonb not null default '[]'::jsonb,
  staff_numbers      text[] not null default '{}'::text[],
  hours              jsonb,
  is_hq              boolean not null default false,
  is_active          boolean not null default true,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  unique (org_slug, slug)
);
create unique index if not exists branches_wa_phone_number_id_uidx on branches(wa_phone_number_id) where wa_phone_number_id is not null;
create unique index if not exists branches_ig_user_id_uidx on branches(ig_user_id) where ig_user_id is not null;
create index if not exists branches_org_idx on branches(org_slug, sort_order);

-- ---------- seed: the two organisations ----------
insert into orgs (slug, name_te, name_en, kind, agent_name_te, agent_name_en, agent_role_te, agent_role_en, phone, email, website, brand)
values
  ('medicare-hospitals', 'మెడికేర్ హాస్పిటల్స్', 'Medicare Hospitals', 'hospital',
   'డా. సత్య', 'Dr Sathya', 'పేషెంట్ కేర్ కోఆర్డినేటర్', 'Patient Care Coordinator',
   '9346113364', 'bnrmedicalagency@gmail.com', 'https://medicarehospitals.in', '{}'::jsonb),
  ('medicare-skin', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్', 'Medicare Skin & Hair Clinic', 'clinic',
   null, null, 'పేషెంట్ కేర్ కోఆర్డినేటర్', 'Patient Care Coordinator',
   '9141247777', 'bnrmedicalagency@gmail.com', 'https://medicareskinandhairclinic.com', '{"accent":"#B5266B"}'::jsonb)
on conflict (slug) do nothing;

-- ---------- seed: the hospital branch (everything that exists today belongs here) ----------
insert into branches (id, org_slug, slug, name_te, name_en, town_te, town_en, pincode, address_en, address_te, maps_query,
                      phones, whatsapp_display, ig_handle, hms_branch_id, is_hq, sort_order)
values ('mh-kaikaluru', 'medicare-hospitals', 'kaikaluru', 'మెడికేర్ హాస్పిటల్స్', 'Medicare Hospitals', 'కైకలూరు', 'Kaikaluru', '521333',
  'Vijayalakshmi Theatre Back Road, Kaikaluru, Eluru District, Andhra Pradesh',
  'విజయలక్ష్మి థియేటర్ వెనుక రోడ్, కైకలూరు, ఏలూరు జిల్లా, ఆంధ్రప్రదేశ్',
  'Medicare Hospitals Kaikaluru Vijayalakshmi Theatre',
  array['9346113364','08677224377']::text[], '919115495969', 'medicare_hospitals_kaikalur',
  'b0000000-0000-0000-0000-000000000003', true, 0)
on conflict (id) do nothing;

-- ---------- seed: Medicare Skin & Hair Clinic, 10 branches (generated from assets/js/branches.js) ----------
insert into branches (id, org_slug, slug, name_te, name_en, town_te, town_en, pincode, address_en, maps_url, maps_query, map_embed, lat, lng, phones, whatsapp_display, ig_handle, doctors, is_hq, sort_order)
values
  ('ms-kaikaluru', 'medicare-skin', 'kaikaluru', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – కైకలూరు', 'Medicare Skin & Hair Clinic Kaikaluru', 'కైకలూరు', 'Kaikaluru', '521333', 'Beside Maganti Theater, Kaikalur, Andhra Pradesh 521333', 'https://maps.app.goo.gl/HFZcis2fraDKAbANA', 'Medicare Skin & Hair Clinic Kaikaluru', 'https://maps.google.com/maps?q=16.5559859,81.2202182&z=16&output=embed', 16.5559859, 81.2202182, array['9141247777','08677223344']::text[], '919141247777', 'medicareskinandhairclinickklr', '[{"name_te":"డా. మేఘన","quals":"MBBS, MD, DVL (గోల్డ్ మెడలిస్ట్)","reg":"91692","photo":"assets/img/doctors/meghana.jpg"}]'::jsonb, true, 0),
  ('ms-bhimavaram', 'medicare-skin', 'bhimavaram', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – భీమవరం', 'Medicare Skin & Hair Clinic Bhimavaram', 'భీమవరం', 'Bhimavaram', '534202', '#2-6-6, 1st Floor, Upstairs to Twills, JP Road, beside Zudio, opposite Jai Srinivasa Hospital, Bhimavaram, Andhra Pradesh 534202', 'https://maps.app.goo.gl/jtQiq29Td5WY8kuQ9', 'Medicare Skin & Hair Clinic Bhimavaram', 'https://maps.google.com/maps?q=16.5441794,81.5156267&z=16&output=embed', 16.5441794, 81.5156267, array['9573124777','9573125777']::text[], '919573124777', 'medicare_skin_bhimavaram', '[{"name_te":"డా. శృతి","quals":"MBBS, MD, DVL","reg":"139988","photo":"assets/img/doctors/shruti.jpg"}]'::jsonb, false, 1),
  ('ms-gannavaram', 'medicare-skin', 'gannavaram', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – గన్నవరం', 'Medicare Skin & Hair Clinic Gannavaram', 'గన్నవరం', 'Gannavaram', '521101', '#6-60, Upstairs to Rasool Tea Stall, National Highway, Gandhi Chowk, opposite ICICI Bank, Gannavaram, Andhra Pradesh 521101', 'https://maps.app.goo.gl/uibGorHRuuHGEUcAA', 'Medicare Skin & Hair Clinic Gannavaram', 'https://maps.google.com/maps?q=16.5400423,80.8007671&z=16&output=embed', 16.5400423, 80.8007671, array['9988167779']::text[], '919988167779', 'gannavaram_medicareskinclinic', '[{"name_te":"డా. సాత్విక","quals":"MBBS, MD, DVL","reg":null,"photo":"assets/img/doctors/satvika.jpg"},{"name_te":"డా. ఆదిత్య","quals":"MBBS, MD, DVL","reg":"113812","photo":"assets/img/doctors/aditya.jpg"}]'::jsonb, false, 2),
  ('ms-nuzvid', 'medicare-skin', 'nuzvid', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – నూజివీడు', 'Medicare Skin & Hair Clinic Nuzvid', 'నూజివీడు', 'Nuzvid', '521201', 'Upstairs to Bank of Baroda, Chinna Gandhi Bomma Center, Nuzvid, Andhra Pradesh 521201', 'https://maps.app.goo.gl/yNLqPmLvZeddiXEt9', 'Medicare Skin & Hair Clinic Nuzvid', 'https://maps.google.com/maps?q=16.7866666,80.8488823&z=16&output=embed', 16.7866666, 80.8488823, array['9535363536']::text[], '919535363536', 'nuzivid_medicareskinclinic', '[{"name_te":"డా. సౌమ్య","quals":"MBBS, MD, DVL","reg":"115714","photo":"assets/img/doctors/soumya.jpg"}]'::jsonb, false, 3),
  ('ms-eluru', 'medicare-skin', 'eluru', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – ఏలూరు', 'Medicare Skin & Hair Clinic Eluru', 'ఏలూరు', 'Eluru', '534002', 'Beside Bhuvaneswari Hospital, Bendapudi Vari Street, RR Peta, Eluru, Andhra Pradesh 534002', 'https://maps.app.goo.gl/YqVA5ydieFBMhkyM9', 'Medicare Skin & Hair Clinic Eluru', 'https://maps.google.com/maps?q=16.7145178,81.1008604&z=16&output=embed', 16.7145178, 81.1008604, array['9988267779']::text[], '919988267779', 'eluru_medicare_skin_clinic', '[{"name_te":"డా. కమ్మ సాయి దివిజ","quals":"MBBS, MD, DVL","reg":"108959","photo":"assets/img/doctors/sai-divija.jpg"}]'::jsonb, false, 4),
  ('ms-tadepalligudem', 'medicare-skin', 'tadepalligudem', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – తాడేపల్లిగూడెం', 'Medicare Skin & Hair Clinic Tadepalligudem', 'తాడేపల్లిగూడెం', 'Tadepalligudem', '534101', 'Bhopal Nagar, beside Usha Grand Hotel, KFC back side, Tadepalligudem, Andhra Pradesh 534101', 'https://maps.app.goo.gl/F8DLphgoXup7LQdW8', 'Medicare Skin & Hair Clinic Tadepalligudem', 'https://maps.google.com/maps?q=16.8170189,81.5249456&z=16&output=embed', 16.8170189, 81.5249456, array['9988367779']::text[], '919988367779', null, '[{"name_te":"డా. అఖిల","quals":"MBBS, MD, DVL","reg":"111274","photo":"assets/img/doctors/akhila.jpg"}]'::jsonb, false, 5),
  ('ms-ongole', 'medicare-skin', 'ongole', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – ఒంగోలు', 'Medicare Skin & Hair Clinic Ongole', 'ఒంగోలు', 'Ongole', '523003', 'Lambadi Donka Road, opposite New Samata Hospital, Ongole, Andhra Pradesh 523003', 'https://maps.app.goo.gl/R3EpNzh8KvWarq7K7', 'Medicare Skin & Hair Clinic Ongole', 'https://maps.google.com/maps?q=15.5116371,80.0387788&z=16&output=embed', 15.5116371, 80.0387788, array['9515830777','9515831777']::text[], '919515830777', 'medicare_skin_clinic_ongole', '[{"name_te":"డా. సాయిదీప్తి","quals":"MBBS, MD, DVL","reg":"111083","photo":"assets/img/doctors/sai-deepthi.jpg"}]'::jsonb, false, 6),
  ('ms-machilipatnam', 'medicare-skin', 'machilipatnam', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – మచిలీపట్నం', 'Medicare Skin & Hair Clinic Machilipatnam', 'మచిలీపట్నం', 'Machilipatnam', '521001', 'Koneru Center, opposite Brundavan Theater, beside Madhu Children''s Hospital, Machilipatnam, Andhra Pradesh 521001', 'https://maps.app.goo.gl/LjaS5Sbwmb2W5XWe8', 'Medicare Skin & Hair Clinic Machilipatnam', 'https://maps.google.com/maps?q=16.178566,81.1276889&z=16&output=embed', 16.178566, 81.1276889, array['9734227777','08672223399']::text[], '919734227777', null, '[{"name_te":"డా. సుధీర్ కుమార్","quals":"MBBS, MD, DVL","reg":"84590","photo":"assets/img/doctors/sudheer-kumar.jpg"}]'::jsonb, false, 7),
  ('ms-gudivada', 'medicare-skin', 'gudivada', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – గుడివాడ', 'Medicare Skin & Hair Clinic Gudivada', 'గుడివాడ', 'Gudivada', '521301', 'Eluru Road, beside Sonovision, Gudivada, Andhra Pradesh 521301', 'https://maps.app.goo.gl/RML6zPfHdLjcJWfD9', 'Medicare Skin & Hair Clinic Gudivada', 'https://maps.google.com/maps?q=16.4359352,80.9925423&z=16&output=embed', 16.4359352, 80.9925423, array['7618882888']::text[], '917618882888', 'gudivada_medicareskinclinic', '[{"name_te":"డా. అనన్య బొల్లినేని","quals":"MBBS, MD, DVL","reg":"113624","photo":"assets/img/doctors/ananya.jpg"}]'::jsonb, false, 8),
  ('ms-akividu', 'medicare-skin', 'akividu', 'మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ – ఆకివీడు', 'Medicare Skin & Hair Clinic Akividu', 'ఆకివీడు', 'Akividu', '534235', 'Upstairs to HDFC Bank, S Turning, Akividu, Andhra Pradesh 534235', 'https://maps.app.goo.gl/7A4WENmD7EjfaCo69', 'Medicare Skin & Hair Clinic Akividu', 'https://maps.google.com/maps?q=16.5817043,81.3767418&z=16&output=embed', 16.5817043, 81.3767418, array['9734117777','7241122333']::text[], '919734117777', 'akivid_healthcareskinclinic', '[{"name_te":"డా. మేఘన","quals":"MBBS, MD, DVL (గోల్డ్ మెడలిస్ట్)","reg":"91692","photo":"assets/img/doctors/meghana.jpg"}]'::jsonb, false, 9)
on conflict (id) do nothing;

-- ---------- tenant columns on existing tables ----------
-- Defaults keep today's single-tenant code valid; Phase 2 removes the defaults once every writer passes them.
-- Postgres stores a non-volatile default in the catalog, so this is instant even on the big tables.
do $$
declare t text;
begin
  foreach t in array array[
    'leads','appointments','conversations','camps','social_posts','content_calendar','ad_campaigns',
    'events','followup_log','social_comments','broadcasts','home_samples','profiles','doctors','departments'
  ] loop
    execute format('alter table %I add column if not exists org_slug text not null default ''medicare-hospitals''', t);
    execute format('alter table %I add column if not exists branch_id text not null default ''mh-kaikaluru''', t);
    if not exists (select 1 from pg_constraint where conname = t || '_org_slug_fkey') then
      execute format('alter table %1$I add constraint %1$s_org_slug_fkey foreign key (org_slug) references orgs(slug)', t);
    end if;
    if not exists (select 1 from pg_constraint where conname = t || '_branch_id_fkey') then
      execute format('alter table %1$I add constraint %1$s_branch_id_fkey foreign key (branch_id) references branches(id)', t);
    end if;
  end loop;
end $$;

-- Staff who may see every organisation (owners / platform admins). Today's admins keep seeing everything.
alter table profiles add column if not exists all_orgs boolean not null default false;
update profiles set all_orgs = true where role = 'admin';

-- ---------- indexes ----------
create index if not exists leads_branch_created_idx          on leads(branch_id, created_at desc);
create index if not exists leads_org_created_idx             on leads(org_slug, created_at desc);
create index if not exists appointments_branch_date_idx      on appointments(branch_id, preferred_date desc);
create index if not exists conversations_branch_last_idx     on conversations(branch_id, last_message_at desc);
create index if not exists social_posts_branch_sched_idx     on social_posts(branch_id, status, scheduled_at);
create index if not exists content_calendar_branch_date_idx  on content_calendar(branch_id, date);
create index if not exists ad_campaigns_branch_idx           on ad_campaigns(branch_id, created_at desc);
create index if not exists events_org_created_idx            on events(org_slug, created_at desc);
create index if not exists social_comments_branch_idx        on social_comments(branch_id, created_at desc);
create index if not exists followup_log_branch_idx           on followup_log(branch_id, created_at desc);

-- One patient may write to two clinics: the same wa_id is a different conversation per branch.
-- conversations_channel_ext_idx (channel, external_id) is intentionally kept until Phase 2 switches the upserts.
create unique index if not exists conversations_branch_channel_ext_idx on conversations(branch_id, channel, external_id);

-- ---------- row level security ----------
create or replace function current_org_slug() returns text language sql stable security definer set search_path = public as $$
  select org_slug from public.profiles where id = auth.uid();
$$;
create or replace function is_org_member(o text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and (p.all_orgs or p.org_slug = o));
$$;
revoke execute on function current_org_slug() from anon, public;
revoke execute on function is_org_member(text) from anon, public;
grant execute on function current_org_slug() to authenticated, service_role;
grant execute on function is_org_member(text) to authenticated, service_role;

alter table orgs enable row level security;
alter table branches enable row level security;
drop policy if exists "public read orgs" on orgs;
create policy "public read orgs" on orgs for select using (is_active);
drop policy if exists "org staff manage orgs" on orgs;
create policy "org staff manage orgs" on orgs for all using (is_org_member(slug)) with check (is_org_member(slug));
drop policy if exists "public read branches" on branches;
create policy "public read branches" on branches for select using (is_active);
drop policy if exists "org staff manage branches" on branches;
create policy "org staff manage branches" on branches for all using (is_org_member(org_slug)) with check (is_org_member(org_slug));

-- Staff policies on tenant tables become org-scoped. Public insert policies (website forms) are unchanged.
alter policy "staff all leads"               on leads            using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all appointments"        on appointments     using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all conversations"       on conversations    using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all camps"               on camps            using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all social_posts"        on social_posts     using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff manage content_calendar" on content_calendar using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all ad_campaigns"        on ad_campaigns     using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all events"              on events           using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all followup_log"        on followup_log     using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all broadcasts"          on broadcasts       using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all profiles"            on profiles         using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all doctors"             on doctors          using (is_org_member(org_slug)) with check (is_org_member(org_slug));
alter policy "staff all departments"         on departments      using (is_org_member(org_slug)) with check (is_org_member(org_slug));
-- messages, lead_activities, camp_registrations, social_comments, home_samples stay is_staff(): they hang off
-- a tenant-scoped parent and the admin app reads them with the service role. Phase 2 tightens them via joins.
