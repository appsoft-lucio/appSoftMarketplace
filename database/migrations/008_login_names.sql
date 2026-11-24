BEGIN;
CREATE TABLE marketplace_v2.login_names (
  auth_subject uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9][a-z0-9_.-]{2,29}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE marketplace_v2.login_names ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_v2.login_names FROM PUBLIC;

-- Claim the name atomically with account creation. Existing accounts remain valid.
-- Metadata updates never change an existing claim.
CREATE FUNCTION marketplace_v2.claim_signup_username() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE chosen text;
BEGIN
  chosen := lower(trim(NEW.raw_user_meta_data->>'username'));
  IF chosen IS NOT NULL AND chosen <> '' THEN
    INSERT INTO marketplace_v2.login_names(auth_subject, username) VALUES (NEW.id, chosen);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION marketplace_v2.claim_signup_username() FROM PUBLIC;
CREATE TRIGGER appsoft_claim_username AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION marketplace_v2.claim_signup_username();

CREATE TABLE marketplace_v2.username_login_limits (
  identifier_hash text PRIMARY KEY,
  attempts integer NOT NULL,
  expires_at timestamptz NOT NULL
);
ALTER TABLE marketplace_v2.username_login_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_v2.username_login_limits FROM PUBLIC;
COMMIT;
