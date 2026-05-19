CREATE TABLE IF NOT EXISTS "property_value_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "value" numeric(12,2) NOT NULL,
  "price_per_m2" numeric(10,2),
  "recorded_at" timestamptz NOT NULL DEFAULT now()
);
