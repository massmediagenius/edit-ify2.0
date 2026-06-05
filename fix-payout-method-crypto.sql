ALTER TABLE profiles
  DROP CONSTRAINT profiles_payout_method_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_payout_method_check
  CHECK (payout_method IN ('paypal', 'wise', 'bank', 'crypto'));
