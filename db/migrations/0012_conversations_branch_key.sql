-- Phase 2, step 2 (run ONLY after the Phase 2 code is deployed to Vercel).
--
-- The code now upserts conversations on (branch_id, channel, external_id). The old key
-- (channel, external_id) would reject the same patient writing to a second branch, so it goes.
-- Safe to run twice.

drop index if exists conversations_channel_ext_idx;

-- Optional, same session: give the hospital branch its Meta ids so nothing depends on env vars.
-- Fill the four values from Vercel → medicare-hospitals → Environment Variables, then uncomment.
-- update branches set
--   wa_phone_number_id = '<WHATSAPP_PHONE_NUMBER_ID>',
--   ig_user_id         = '<META_IG_USER_ID>',
--   fb_page_id         = '<META_PAGE_ID>',
--   ad_account_id      = '<META_AD_ACCOUNT_ID>'
-- where id = 'mh-kaikaluru';
