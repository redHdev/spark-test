
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE EXTENSION IF NOT EXISTS "plv8" WITH SCHEMA "pg_catalog";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

CREATE TYPE "public"."pricing_plan_interval" AS ENUM (
    'day',
    'week',
    'month',
    'year'
);

ALTER TYPE "public"."pricing_plan_interval" OWNER TO "postgres";

CREATE TYPE "public"."pricing_type" AS ENUM (
    'one_time',
    'recurring'
);

ALTER TYPE "public"."pricing_type" OWNER TO "postgres";

CREATE TYPE "public"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'paused',
    'unpaid'
);

ALTER TYPE "public"."subscription_status" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."create_sections_from_messages"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    msg_content jsonb;
BEGIN
    RAISE NOTICE 'Trigger function invoked with ID %', NEW.id;

    FOR msg_content IN SELECT jsonb_array_elements_text(NEW.messages)
    LOOP
        RAISE NOTICE 'Processing message: %', msg_content;

        INSERT INTO conversation_sections (conversation_id, sender, content) 
        VALUES (NEW.id, msg_content->>'sender', msg_content->>'content');
    END LOOP;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."create_sections_from_messages"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_conversation_parents"("conversation_id" bigint) RETURNS TABLE("id" bigint, "parent_conversation_id" bigint, "conversation_name" "text", "meta" "jsonb")
    LANGUAGE "sql"
    AS $$
  with recursive chain as (
    select *
    from conversations 
    where id = conversation_id

    union all

    select child.*
      from conversations as child
      join chain on chain.parent_conversation_id = child.id 
  )
  select id, parent_conversation_id, conversation_name, meta
  from chain;
$$;

ALTER FUNCTION "public"."get_conversation_parents"("conversation_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_page_parents"("page_id" bigint) RETURNS TABLE("id" bigint, "parent_page_id" bigint, "path" "text", "meta" "jsonb")
    LANGUAGE "sql"
    AS $$
  with recursive chain as (
    select *
    from nods_page 
    where id = page_id

    union all

    select child.*
      from nods_page as child
      join chain on chain.parent_page_id = child.id 
  )
  select id, parent_page_id, path, meta
  from chain;
$$;

ALTER FUNCTION "public"."get_page_parents"("page_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_companion_memories"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") RETURNS TABLE("id" bigint, "companion_id" "text", "user_id" "uuid", "embeddings" "public"."vector", "content" "text", "memory_name" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      memories.id,
      memories.companion_id,
      memories.embeddings,
      memories.content,
      memories.created_at,
      memories.user_id,
      memories.memory_name,
      (memories.embeddings <#> embedding) * -1 as similarity
    from memories
    where memories.companion_id = companion_id_param
      and length(memories.content) >= min_content_length
      and (memories.embeddings <#> embedding) * -1 > match_threshold
    order by memories.embeddings <#> embedding
    limit match_count;
end;
$$;

ALTER FUNCTION "public"."match_companion_memories"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_context_memories"("conversation_id_param" bigint, "min_content_length" integer, "embedding" "public"."vector", "match_threshold" double precision, "companion_id" bigint, "match_count" integer) RETURNS TABLE("id" bigint, "owner" "text", "conversation_id" bigint, "embeddings" "public"."vector", "content" "text", "sender" "text", "token_count" integer, "heading" "text", "context" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select
    memories.id,
    memories.user_id,
    memories.companion_id,
    memories.embeddings,
    memories.content,
    memories.memory_name,
    memories.token_count,
    memories.created_at,
    user_conversations.content as context,
    (memories.embeddings <#> embedding) * -1 as similarity
  from
    memories
    join user_conversations on memories.companion_id = user_conversations.companion_id
  where
    memories.companion_id = conversation_id_param
    and length(memories.content) >= min_content_length
    and (memories.embeddings <#> embedding) * -1 > match_threshold
    and user_conversations.companion_id = companion_id
  order by
    memories.embeddings <#> embedding
  limit
    match_count;
end;
$$;

ALTER FUNCTION "public"."match_context_memories"("conversation_id_param" bigint, "min_content_length" integer, "embedding" "public"."vector", "match_threshold" double precision, "companion_id" bigint, "match_count" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_conversation_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) RETURNS TABLE("id" bigint, "conversation_id" bigint, "slug" "text", "heading" "text", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
begin
  return query
  select
    conversation_sections.id,
    conversation_sections.conversation_id,
    conversation_sections.slug,
    conversation_sections.heading,
    conversation_sections.content,
    (conversation_sections.embedding <#> embedding) * -1 as similarity
  from conversation_sections

  -- We only care about sections that have a useful amount of content
  where length(conversation_sections.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (conversation_sections.embedding <#> embedding) * -1 > match_threshold

  order by conversation_sections.embedding <#> embedding
  
  limit match_count;
end;
$$;

ALTER FUNCTION "public"."match_conversation_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_memories"("companion_id_param" bigint, "query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) RETURNS TABLE("id" bigint, "companion_id" bigint, "embeddings" "public"."vector", "content" "text", "user_id" bigint, "memory_name" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$ BEGIN RETURN QUERY SELECT memories.id, memories.companion_id, memories.embeddings, memories.content, memories.user_id, memories.memory_name, (memories.embeddings <#> query_embedding) * -1 as similarity FROM memories WHERE memories.companion_id = companion_id_param AND length(memories.content) >= min_content_length AND (memories.embeddings <#> query_embedding) * -1 > match_threshold ORDER BY memories.embeddings <#> query_embedding LIMIT match_count; END; $$;

ALTER FUNCTION "public"."match_memories"("companion_id_param" bigint, "query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") RETURNS TABLE("id" "uuid", "companion_id" "text", "embeddings" "public"."vector", "content" "text", "user_id" "uuid", "memory_name" "text", "similarity" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return query
    select
      memories.id,
      memories.companion_id,
      memories.embeddings,
      memories.content,
      memories.user_id,
      memories.memory_name,
      (memories.embeddings <#> query_embedding) * -1 as similarity
    from memories
    where memories.companion_id = companion_id_param
      and length(memories.content) >= min_content_length
      and (memories.embeddings <#> query_embedding) * -1 > match_threshold
    order by memories.embeddings <#> query_embedding
    limit match_count;
end;
$$;

ALTER FUNCTION "public"."match_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_memories_f"("query_embedding" "public"."vector", "companion_id" "text", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) RETURNS TABLE("id" bigint, "content" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    memories.id,
    memories.content,
    1 - (memories.embeddings <=> query_embedding) as similarity
  from memories
  where memories.companion_id = companion_id
    and length(memories.content) >= min_content_length
    and 1 - (memories.embeddings <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

ALTER FUNCTION "public"."match_memories_f"("query_embedding" "public"."vector", "companion_id" "text", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_memory"("query_embedding" "public"."vector", "companion_id" "text") RETURNS TABLE("content" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select
    memories.content
  from memories
  where memories.companion_id = companion_id
    and 1 - (memories.embeddings <=> query_embedding) > 0.4;
$$;

ALTER FUNCTION "public"."match_memory"("query_embedding" "public"."vector", "companion_id" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_memory_a"("query_embedding" "public"."vector", "min_content_length" integer, "match_count" integer, "match_threshold" double precision) RETURNS TABLE("content" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT memories.content
    FROM memories
    WHERE memories.companion_id = companion_id
    AND 1 - (memories.embeddings <=> query_embedding) > match_threshold
    AND length(memories.content) >= min_content_length
    LIMIT match_count;
END;
$$;

ALTER FUNCTION "public"."match_memory_a"("query_embedding" "public"."vector", "min_content_length" integer, "match_count" integer, "match_threshold" double precision) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_page_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "the_id" bigint) RETURNS TABLE("id" bigint, "page_id" bigint, "slug" "text", "heading" "text", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
BEGIN
  RETURN QUERY
  SELECT
    nods_page_section.id,
    nods_page_section.page_id,
    nods_page_section.slug,
    nods_page_section.heading,
    nods_page_section.content,
    (nods_page_section.embedding <#> embedding) * -1 as similarity
  FROM nods_page_section
  WHERE nods_page_section.page_id = the_id  -- added this line
  -- We only care about sections that have a useful amount of content
  AND length(nods_page_section.content) >= min_content_length
  -- The dot product is negative because of a Postgres limitation, so we negate it
  AND (nods_page_section.embedding <#> embedding) * -1 > match_threshold
  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  ORDER BY nods_page_section.embedding <#> embedding
  LIMIT match_count;
END;
$$;

ALTER FUNCTION "public"."match_page_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "the_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."match_user_conversations"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "conversation_id_param" "text") RETURNS TABLE("id" bigint, "owner" "uuid", "conversation_id" "text", "embeddings" "public"."vector", "content" "text", "sender" "text", "token_count" integer, "heading" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      user_conversations.id,
      user_conversations.owner,
      user_conversations.conversation_id,
      user_conversations.embeddings,
      user_conversations.content,
      user_conversations.sender,
      user_conversations.token_count,
      user_conversations.heading,
      (user_conversations.embeddings <#> embedding) * -1 as similarity
    from user_conversations
    where user_conversations.conversation_id = conversation_id_param
      and length(user_conversations.content) >= min_content_length
      and (user_conversations.embeddings <#> embedding) * -1 > match_threshold
    order by user_conversations.embeddings <#> embedding
    limit match_count;
end;
$$;

ALTER FUNCTION "public"."match_user_conversations"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "conversation_id_param" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."clients" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."companions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "companion_id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid",
    "settings" "jsonb" DEFAULT '[]'::"jsonb",
    "pfp" "text",
    "chatcode" "text",
    "description" "text",
    "user_list" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "intros" "text",
    "characters" "text",
    "extras" "text",
    "test_questions" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE "public"."companions" OWNER TO "postgres";

ALTER TABLE "public"."companions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."companions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."customers" (
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "id" bigint
);

ALTER TABLE "public"."customers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "companion_id" "uuid",
    "file_name" "text",
    "file_extension" "text",
    "file_id" "text",
    "has_uploaded" boolean DEFAULT false NOT NULL,
    "file_content" "text",
    "total_chunks" "text",
    "chunks_remaining" "text"
);

ALTER TABLE "public"."files" OWNER TO "postgres";

ALTER TABLE "public"."files" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."files_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."library" (
    "id" integer NOT NULL,
    "SGPT" "jsonb"[],
    "SE" "jsonb"[],
    "SCOMP" "jsonb"
);

ALTER TABLE "public"."library" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."library_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."library_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."library_id_seq" OWNED BY "public"."library"."id";

CREATE TABLE IF NOT EXISTS "public"."memories" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "companion_id" "text" NOT NULL,
    "embeddings" "public"."vector",
    "content" "text",
    "token_count" integer,
    "memory_name" "text",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "file_id" "text"
);

ALTER TABLE "public"."memories" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."memories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."memories_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."memories_id_seq" OWNED BY "public"."memories"."id";

CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" "text" NOT NULL,
    "product_id" "text",
    "active" boolean,
    "description" "text",
    "unit_amount" bigint,
    "currency" "text",
    "type" "public"."pricing_type",
    "interval" "public"."pricing_plan_interval",
    "interval_count" integer,
    "trial_period_days" integer,
    "metadata" "jsonb",
    CONSTRAINT "prices_currency_check" CHECK (("char_length"("currency") = 3))
);

ALTER TABLE "public"."prices" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "active" boolean,
    "name" "text",
    "description" "text",
    "image" "text",
    "metadata" "jsonb"
);

ALTER TABLE "public"."products" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."shared_companions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "my_chatcodes" "text" NOT NULL
);

ALTER TABLE "public"."shared_companions" OWNER TO "postgres";

ALTER TABLE "public"."shared_companions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shared_companions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."subscription_status",
    "metadata" "jsonb",
    "product_id" "text",
    "price_id" "text",
    "quantity" integer,
    "cancel_at_period_end" boolean,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "current_period_end" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ended_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cancel_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "canceled_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "trial_start" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "trial_end" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);

ALTER TABLE "public"."subscriptions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."test_results" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "companion_id" "text",
    "test_state" "jsonb" DEFAULT '[]'::"jsonb"
);

ALTER TABLE "public"."test_results" OWNER TO "postgres";

ALTER TABLE "public"."test_results" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."test_results_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."user_conversation_ids" (
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "modLastUsed" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "time" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "gameplayState" "jsonb" DEFAULT '{"xp": 0, "bag": [{"name": "Health Pack", "emoji": "🩹", "purpose": "Restores health", "quantity": 1}], "shop": [{"name": "Flashlight", "emoji": "🔦", "price": 5, "purpose": "Lights up dark areas", "quantity": 5}], "health": 5, "bankroll": 20}'::"jsonb" NOT NULL
);

ALTER TABLE ONLY "public"."user_conversation_ids" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_conversation_ids" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_conversations" (
    "owner" "uuid" NOT NULL,
    "conversation_id" "text" NOT NULL,
    "embeddings" "public"."vector"(1536),
    "content" "text",
    "sender" "text",
    "token_count" integer,
    "heading" "text",
    "id" bigint NOT NULL,
    "modUsed" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "time" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text")
);

ALTER TABLE ONLY "public"."user_conversations" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_conversations" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."user_conversations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."user_conversations_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."user_conversations_id_seq" OWNED BY "public"."user_conversations"."id";

CREATE TABLE IF NOT EXISTS "public"."user_mods" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "mymods" "jsonb",
    "roomcode" "text",
    "mymodpack" "jsonb" DEFAULT '[]'::"jsonb",
    "companions" "jsonb" DEFAULT '[]'::"jsonb"
);

ALTER TABLE "public"."user_mods" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."user_mods_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."user_mods_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."user_mods_id_seq" OWNED BY "public"."user_mods"."id";

ALTER TABLE ONLY "public"."library" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."library_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."memories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."memories_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."user_conversations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_conversations_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."user_mods" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_mods_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."companions"
    ADD CONSTRAINT "companions_chatcode_key" UNIQUE ("chatcode");

ALTER TABLE ONLY "public"."companions"
    ADD CONSTRAINT "companions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."memories"
    ADD CONSTRAINT "memories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."shared_companions"
    ADD CONSTRAINT "shared_companions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_conversation_ids"
    ADD CONSTRAINT "user_conversation_ids_conversation_id_key" UNIQUE ("conversation_id");

ALTER TABLE ONLY "public"."user_conversation_ids"
    ADD CONSTRAINT "user_conversation_ids_pkey" PRIMARY KEY ("user_id", "conversation_id");

ALTER TABLE ONLY "public"."user_conversations"
    ADD CONSTRAINT "user_conversations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_mods"
    ADD CONSTRAINT "user_mods_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_mods"
    ADD CONSTRAINT "user_mods_roomcode_key" UNIQUE ("roomcode");

ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."companions"
    ADD CONSTRAINT "companions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."memories"
    ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");

ALTER TABLE ONLY "public"."shared_companions"
    ADD CONSTRAINT "shared_companions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id");

ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");

ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."user_conversation_ids"
    ADD CONSTRAINT "user_conversation_ids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."user_conversations"
    ADD CONSTRAINT "user_conversations_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."user_mods"
    ADD CONSTRAINT "user_mods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

CREATE POLICY "Allow anyone to select rows" ON "public"."user_conversation_ids" FOR SELECT USING (true);

CREATE POLICY "Allow anyone to update rows" ON "public"."user_conversation_ids" FOR UPDATE USING (true);

CREATE POLICY "Allow public read-only access" ON "public"."prices" FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access." ON "public"."products" FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."shared_companions" TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_conversation_ids" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."customers" FOR SELECT USING (true);

CREATE POLICY "RLS" ON "public"."files" WITH CHECK (true);

CREATE POLICY "User can read own subscription" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can only access their own clients" ON "public"."clients" USING (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."create_sections_from_messages"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_sections_from_messages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_sections_from_messages"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_conversation_parents"("conversation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_parents"("conversation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_parents"("conversation_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."match_companion_memories"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_companion_memories"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_companion_memories"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."match_context_memories"("conversation_id_param" bigint, "min_content_length" integer, "embedding" "public"."vector", "match_threshold" double precision, "companion_id" bigint, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_context_memories"("conversation_id_param" bigint, "min_content_length" integer, "embedding" "public"."vector", "match_threshold" double precision, "companion_id" bigint, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_context_memories"("conversation_id_param" bigint, "min_content_length" integer, "embedding" "public"."vector", "match_threshold" double precision, "companion_id" bigint, "match_count" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."match_conversation_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_conversation_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_conversation_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."match_memories"("companion_id_param" bigint, "query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_memories"("companion_id_param" bigint, "query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_memories"("companion_id_param" bigint, "query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."match_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "companion_id_param" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."match_memories_f"("query_embedding" "public"."vector", "companion_id" "text", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_memories_f"("query_embedding" "public"."vector", "companion_id" "text", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_memories_f"("query_embedding" "public"."vector", "companion_id" "text", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."match_memory"("query_embedding" "public"."vector", "companion_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_memory"("query_embedding" "public"."vector", "companion_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_memory"("query_embedding" "public"."vector", "companion_id" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."match_memory_a"("query_embedding" "public"."vector", "min_content_length" integer, "match_count" integer, "match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_memory_a"("query_embedding" "public"."vector", "min_content_length" integer, "match_count" integer, "match_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_memory_a"("query_embedding" "public"."vector", "min_content_length" integer, "match_count" integer, "match_threshold" double precision) TO "service_role";

GRANT ALL ON FUNCTION "public"."match_page_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "the_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."match_page_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "the_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_page_sections"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "the_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."match_user_conversations"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "conversation_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_user_conversations"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "conversation_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_user_conversations"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "conversation_id_param" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";

GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";

GRANT ALL ON TABLE "public"."companions" TO "anon";
GRANT ALL ON TABLE "public"."companions" TO "authenticated";
GRANT ALL ON TABLE "public"."companions" TO "service_role";

GRANT ALL ON SEQUENCE "public"."companions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."companions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."companions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";

GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";

GRANT ALL ON SEQUENCE "public"."files_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."files_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."files_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."library" TO "anon";
GRANT ALL ON TABLE "public"."library" TO "authenticated";
GRANT ALL ON TABLE "public"."library" TO "service_role";

GRANT ALL ON SEQUENCE "public"."library_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."library_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."library_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."memories" TO "anon";
GRANT ALL ON TABLE "public"."memories" TO "authenticated";
GRANT ALL ON TABLE "public"."memories" TO "service_role";

GRANT ALL ON SEQUENCE "public"."memories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."memories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."memories_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";

GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";

GRANT ALL ON TABLE "public"."shared_companions" TO "anon";
GRANT ALL ON TABLE "public"."shared_companions" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_companions" TO "service_role";

GRANT ALL ON SEQUENCE "public"."shared_companions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shared_companions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shared_companions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";

GRANT ALL ON TABLE "public"."test_results" TO "anon";
GRANT ALL ON TABLE "public"."test_results" TO "authenticated";
GRANT ALL ON TABLE "public"."test_results" TO "service_role";

GRANT ALL ON SEQUENCE "public"."test_results_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test_results_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test_results_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_conversation_ids" TO "anon";
GRANT ALL ON TABLE "public"."user_conversation_ids" TO "authenticated";
GRANT ALL ON TABLE "public"."user_conversation_ids" TO "service_role";

GRANT ALL ON TABLE "public"."user_conversations" TO "anon";
GRANT ALL ON TABLE "public"."user_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_conversations" TO "service_role";

GRANT ALL ON SEQUENCE "public"."user_conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_conversations_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_mods" TO "anon";
GRANT ALL ON TABLE "public"."user_mods" TO "authenticated";
GRANT ALL ON TABLE "public"."user_mods" TO "service_role";

GRANT ALL ON SEQUENCE "public"."user_mods_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_mods_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_mods_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
