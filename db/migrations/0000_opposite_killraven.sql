CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" text NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"notes" text,
	"tax_deductible" boolean DEFAULT false NOT NULL,
	"invoice_url" text,
	"invoice_filename" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"property_name" text DEFAULT 'Ostrava — Nádražní 2965/9' NOT NULL,
	"purchase_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"mortgage_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"target_monthly_rent" numeric(12, 2) DEFAULT '0' NOT NULL,
	"size_m2" numeric(5, 1) DEFAULT '0' NOT NULL,
	"mortgage_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"mortgage_term_years" integer DEFAULT 30 NOT NULL,
	"mortgage_start_date" date,
	"mortgage_rate_fixed_until" date,
	"current_property_value" numeric(12, 2),
	"current_property_value_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
