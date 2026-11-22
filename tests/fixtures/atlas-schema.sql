--
-- PostgreSQL database dump
--

\restrict AtlasCISchemaFixture

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: atlas; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA atlas;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: atlas_catalog_evidence; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_catalog_evidence (
    namespace text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_catalog_items; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_catalog_items (
    namespace text NOT NULL,
    name text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_catalog_namespaces; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_catalog_namespaces (
    namespace text NOT NULL
);


--
-- Name: atlas_classification_batches; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_classification_batches (
    run_id text NOT NULL,
    batch_no bigint NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_classification_run_items; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_classification_run_items (
    run_id text NOT NULL,
    namespace text NOT NULL,
    name text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_classification_runs; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_classification_runs (
    run_id text NOT NULL,
    payload_json text NOT NULL,
    updated_at text NOT NULL
);


--
-- Name: atlas_classifications; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_classifications (
    namespace text NOT NULL,
    name text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_detail_meta; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_detail_meta (
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: atlas_documents; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_documents (
    name text NOT NULL,
    kind text NOT NULL,
    payload_json text NOT NULL,
    updated_at text NOT NULL
);


--
-- Name: atlas_item_details; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_item_details (
    namespace text NOT NULL,
    name text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_item_summaries; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_item_summaries (
    namespace text NOT NULL,
    slug text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_meta; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_meta (
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: atlas_raw_registries; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_raw_registries (
    namespace text NOT NULL,
    ordinal bigint NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_registries; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_registries (
    namespace text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: atlas_source_pages; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.atlas_source_pages (
    namespace text NOT NULL,
    slug text NOT NULL,
    payload_json text NOT NULL
);


--
-- Name: component_url_checks; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.component_url_checks (
    namespace text NOT NULL,
    slug text NOT NULL,
    url text,
    source text NOT NULL,
    title text NOT NULL,
    status text NOT NULL,
    reason text,
    http_status bigint,
    checked_at text,
    attempts bigint DEFAULT 0 NOT NULL
);


--
-- Name: examples; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.examples (
    pattern_id bigint NOT NULL,
    slug text NOT NULL,
    url text NOT NULL
);


--
-- Name: item_routes; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.item_routes (
    namespace text NOT NULL,
    slug text NOT NULL,
    source_url text,
    status text DEFAULT 'unverified'::text NOT NULL,
    pattern_id bigint
);


--
-- Name: metadata; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.metadata (
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: pattern_checks; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.pattern_checks (
    id bigint NOT NULL,
    pattern_id bigint NOT NULL,
    slug text NOT NULL,
    url text NOT NULL,
    status text NOT NULL,
    reason text,
    checked_at text NOT NULL
);


--
-- Name: pattern_checks_id_seq; Type: SEQUENCE; Schema: atlas; Owner: -
--

ALTER TABLE atlas.pattern_checks ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME atlas.pattern_checks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: route_patterns; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.route_patterns (
    id bigint NOT NULL,
    namespace text NOT NULL,
    template text NOT NULL,
    prefix text NOT NULL,
    source text NOT NULL,
    status text DEFAULT 'unverified'::text NOT NULL,
    checked_at text,
    failure text
);


--
-- Name: route_patterns_id_seq; Type: SEQUENCE; Schema: atlas; Owner: -
--

ALTER TABLE atlas.route_patterns ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME atlas.route_patterns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sitemap_links; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.sitemap_links (
    namespace text NOT NULL,
    slug text NOT NULL,
    url text NOT NULL,
    observed_at text NOT NULL
);


--
-- Name: sources; Type: TABLE; Schema: atlas; Owner: -
--

CREATE TABLE atlas.sources (
    namespace text NOT NULL,
    homepage text NOT NULL,
    fingerprint text NOT NULL
);


--
-- Name: atlas_catalog_evidence atlas_catalog_evidence_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_catalog_evidence
    ADD CONSTRAINT atlas_catalog_evidence_pkey PRIMARY KEY (namespace);


--
-- Name: atlas_catalog_items atlas_catalog_items_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_catalog_items
    ADD CONSTRAINT atlas_catalog_items_pkey PRIMARY KEY (namespace, name);


--
-- Name: atlas_catalog_namespaces atlas_catalog_namespaces_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_catalog_namespaces
    ADD CONSTRAINT atlas_catalog_namespaces_pkey PRIMARY KEY (namespace);


--
-- Name: atlas_classification_batches atlas_classification_batches_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_classification_batches
    ADD CONSTRAINT atlas_classification_batches_pkey PRIMARY KEY (run_id, batch_no);


--
-- Name: atlas_classification_run_items atlas_classification_run_items_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_classification_run_items
    ADD CONSTRAINT atlas_classification_run_items_pkey PRIMARY KEY (run_id, namespace, name);


--
-- Name: atlas_classification_runs atlas_classification_runs_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_classification_runs
    ADD CONSTRAINT atlas_classification_runs_pkey PRIMARY KEY (run_id);


--
-- Name: atlas_classifications atlas_classifications_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_classifications
    ADD CONSTRAINT atlas_classifications_pkey PRIMARY KEY (namespace, name);


--
-- Name: atlas_detail_meta atlas_detail_meta_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_detail_meta
    ADD CONSTRAINT atlas_detail_meta_pkey PRIMARY KEY (key);


--
-- Name: atlas_documents atlas_documents_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_documents
    ADD CONSTRAINT atlas_documents_pkey PRIMARY KEY (name);


--
-- Name: atlas_item_details atlas_item_details_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_item_details
    ADD CONSTRAINT atlas_item_details_pkey PRIMARY KEY (namespace, name);


--
-- Name: atlas_item_summaries atlas_item_summaries_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_item_summaries
    ADD CONSTRAINT atlas_item_summaries_pkey PRIMARY KEY (namespace, slug);


--
-- Name: atlas_meta atlas_meta_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_meta
    ADD CONSTRAINT atlas_meta_pkey PRIMARY KEY (key);


--
-- Name: atlas_raw_registries atlas_raw_registries_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_raw_registries
    ADD CONSTRAINT atlas_raw_registries_pkey PRIMARY KEY (namespace);


--
-- Name: atlas_registries atlas_registries_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_registries
    ADD CONSTRAINT atlas_registries_pkey PRIMARY KEY (namespace);


--
-- Name: atlas_source_pages atlas_source_pages_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_source_pages
    ADD CONSTRAINT atlas_source_pages_pkey PRIMARY KEY (namespace, slug);


--
-- Name: component_url_checks component_url_checks_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.component_url_checks
    ADD CONSTRAINT component_url_checks_pkey PRIMARY KEY (namespace, slug);


--
-- Name: examples examples_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.examples
    ADD CONSTRAINT examples_pkey PRIMARY KEY (pattern_id, slug, url);


--
-- Name: item_routes item_routes_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.item_routes
    ADD CONSTRAINT item_routes_pkey PRIMARY KEY (namespace, slug);


--
-- Name: metadata metadata_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.metadata
    ADD CONSTRAINT metadata_pkey PRIMARY KEY (key);


--
-- Name: pattern_checks pattern_checks_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.pattern_checks
    ADD CONSTRAINT pattern_checks_pkey PRIMARY KEY (id);


--
-- Name: route_patterns route_patterns_identity_unique; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.route_patterns
    ADD CONSTRAINT route_patterns_identity_unique UNIQUE (namespace, template, prefix);


--
-- Name: route_patterns route_patterns_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.route_patterns
    ADD CONSTRAINT route_patterns_pkey PRIMARY KEY (id);


--
-- Name: sitemap_links sitemap_links_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.sitemap_links
    ADD CONSTRAINT sitemap_links_pkey PRIMARY KEY (namespace, slug, url);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (namespace);


--
-- Name: atlas_component_checks_status_idx; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX atlas_component_checks_status_idx ON atlas.component_url_checks USING btree (status, namespace);


--
-- Name: atlas_items_status_idx; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX atlas_items_status_idx ON atlas.item_routes USING btree (status);


--
-- Name: atlas_patterns_status_idx; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX atlas_patterns_status_idx ON atlas.route_patterns USING btree (namespace, status);


--
-- Name: idx_pg_atlas_catalog_items_lookup; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX idx_pg_atlas_catalog_items_lookup ON atlas.atlas_catalog_items USING btree (namespace);


--
-- Name: idx_pg_atlas_classifications_lookup; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX idx_pg_atlas_classifications_lookup ON atlas.atlas_classifications USING btree (namespace, name);


--
-- Name: idx_pg_atlas_item_details_lookup; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX idx_pg_atlas_item_details_lookup ON atlas.atlas_item_details USING btree (namespace);


--
-- Name: idx_pg_atlas_source_pages_lookup; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX idx_pg_atlas_source_pages_lookup ON atlas.atlas_source_pages USING btree (namespace, slug);


--
-- Name: idx_pg_item_routes_lookup; Type: INDEX; Schema: atlas; Owner: -
--

CREATE INDEX idx_pg_item_routes_lookup ON atlas.item_routes USING btree (namespace, slug);


--
-- Name: atlas_catalog_evidence atlas_catalog_evidence_registry_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_catalog_evidence
    ADD CONSTRAINT atlas_catalog_evidence_registry_fk FOREIGN KEY (namespace) REFERENCES atlas.atlas_raw_registries(namespace) ON DELETE CASCADE;


--
-- Name: atlas_catalog_items atlas_catalog_items_namespace_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.atlas_catalog_items
    ADD CONSTRAINT atlas_catalog_items_namespace_fk FOREIGN KEY (namespace) REFERENCES atlas.atlas_catalog_namespaces(namespace) ON DELETE CASCADE;


--
-- Name: component_url_checks component_url_checks_route_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.component_url_checks
    ADD CONSTRAINT component_url_checks_route_fk FOREIGN KEY (namespace, slug) REFERENCES atlas.item_routes(namespace, slug) ON DELETE CASCADE;


--
-- Name: component_url_checks component_url_checks_source_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.component_url_checks
    ADD CONSTRAINT component_url_checks_source_fk FOREIGN KEY (namespace) REFERENCES atlas.sources(namespace);


--
-- Name: examples examples_pattern_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.examples
    ADD CONSTRAINT examples_pattern_fk FOREIGN KEY (pattern_id) REFERENCES atlas.route_patterns(id) ON DELETE CASCADE;


--
-- Name: item_routes item_routes_pattern_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.item_routes
    ADD CONSTRAINT item_routes_pattern_fk FOREIGN KEY (pattern_id) REFERENCES atlas.route_patterns(id) ON DELETE SET NULL;


--
-- Name: item_routes item_routes_source_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.item_routes
    ADD CONSTRAINT item_routes_source_fk FOREIGN KEY (namespace) REFERENCES atlas.sources(namespace);


--
-- Name: pattern_checks pattern_checks_pattern_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.pattern_checks
    ADD CONSTRAINT pattern_checks_pattern_fk FOREIGN KEY (pattern_id) REFERENCES atlas.route_patterns(id) ON DELETE CASCADE;


--
-- Name: route_patterns route_patterns_source_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.route_patterns
    ADD CONSTRAINT route_patterns_source_fk FOREIGN KEY (namespace) REFERENCES atlas.sources(namespace);


--
-- Name: sitemap_links sitemap_links_source_fk; Type: FK CONSTRAINT; Schema: atlas; Owner: -
--

ALTER TABLE ONLY atlas.sitemap_links
    ADD CONSTRAINT sitemap_links_source_fk FOREIGN KEY (namespace) REFERENCES atlas.sources(namespace);


--
-- PostgreSQL database dump complete
--

\unrestrict AtlasCISchemaFixture
