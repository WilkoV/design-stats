--
-- PostgreSQL database dump
--

-- Dumped from database version 14.3 (Debian 14.3-1.pgdg110+1)
-- Dumped by pg_dump version 14.3 (Debian 14.3-1.pgdg110+1)

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

--
-- Name: imports_type; Type: TYPE; Schema: public; Owner: ds
--

CREATE TYPE public.imports_type AS ENUM (
    'initial',
    'regular',
    'calculated',
    'adjusted date'
);


ALTER TYPE public.imports_type OWNER TO ds;

--
-- Name: sources_type; Type: TYPE; Schema: public; Owner: ds
--

CREATE TYPE public.sources_type AS ENUM (
    'Cults3d',
    'Printables',
    'Thingiverse'
);


ALTER TYPE public.sources_type OWNER TO ds;

--
-- Name: statistics_type; Type: TYPE; Schema: public; Owner: ds
--

CREATE TYPE public.statistics_type AS ENUM (
    'downloads',
    'likes',
    'views',
    'makes',
    'remixes',
    'comments',
    'collections'
);


ALTER TYPE public.statistics_type OWNER TO ds;

--
-- Name: versions_types; Type: TYPE; Schema: public; Owner: ds
--

CREATE TYPE public.versions_types AS ENUM (
    'Schema'
);


ALTER TYPE public.versions_types OWNER TO ds;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: daily_statistics; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.daily_statistics (
    import_date date NOT NULL,
    design_id integer NOT NULL,
    source public.sources_type NOT NULL,
    import_type public.imports_type NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    makes integer DEFAULT 0 NOT NULL,
    remixes integer DEFAULT 0 NOT NULL,
    comments integer DEFAULT 0 NOT NULL,
    collections integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.daily_statistics OWNER TO ds;

--
-- Name: designs; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.designs (
    id integer NOT NULL,
    title character varying
);


ALTER TABLE public.designs OWNER TO ds;

--
-- Name: design_id_seq; Type: SEQUENCE; Schema: public; Owner: ds
--

CREATE SEQUENCE public.design_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.design_id_seq OWNER TO ds;

--
-- Name: design_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ds
--

ALTER SEQUENCE public.design_id_seq OWNED BY public.designs.id;


--
-- Name: imports; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.imports (
    import_date date NOT NULL,
    design_id integer NOT NULL,
    source public.sources_type NOT NULL,
    import_type public.imports_type NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    makes integer DEFAULT 0 NOT NULL,
    remixes integer DEFAULT 0 NOT NULL,
    comments integer DEFAULT 0 NOT NULL,
    collections integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.imports OWNER TO ds;

--
-- Name: sources; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.sources (
    design_id integer NOT NULL,
    source public.sources_type NOT NULL,
    source_id character varying(120) NOT NULL
);


ALTER TABLE public.sources OWNER TO ds;

--
-- Name: statistics; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.statistics (
    year integer NOT NULL,
    month integer NOT NULL,
    design_id integer NOT NULL,
    source public.sources_type NOT NULL,
    statistic_type public.statistics_type NOT NULL,
    last_1d integer NOT NULL,
    last_7d integer NOT NULL,
    last_30d integer NOT NULL,
    this_month integer NOT NULL,
    last_365d integer NOT NULL,
    this_year integer NOT NULL,
    total integer NOT NULL
);


ALTER TABLE public.statistics OWNER TO ds;

--
-- Name: versions; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.versions (
    version_type public.versions_types NOT NULL,
    value integer NOT NULL
);


ALTER TABLE public.versions OWNER TO ds;

--
-- Name: designs id; Type: DEFAULT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.designs ALTER COLUMN id SET DEFAULT nextval('public.design_id_seq'::regclass);


--
-- Name: daily_statistics daily_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.daily_statistics
    ADD CONSTRAINT daily_statistics_pkey PRIMARY KEY (import_date, design_id, source);


--
-- Name: designs designs_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.designs
    ADD CONSTRAINT designs_pkey PRIMARY KEY (id);


--
-- Name: imports import_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT import_pkey PRIMARY KEY (design_id, source, import_date);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (design_id, source);


--
-- Name: statistics statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.statistics
    ADD CONSTRAINT statistics_pkey PRIMARY KEY (year, month, design_id, source, statistic_type);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (version_type);


--
-- Name: daily_statistics_import_date_asc_design_id_source_import_type_i; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX daily_statistics_import_date_asc_design_id_source_import_type_i ON public.daily_statistics USING btree (import_date, design_id, source, import_type);


--
-- Name: daily_statistics_import_date_desc_design_id_source_import_type_; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX daily_statistics_import_date_desc_design_id_source_import_type_ ON public.daily_statistics USING btree (import_date DESC, design_id, source, import_type);


--
-- Name: daily_statistics_import_date_downloads_idx; Type: INDEX; Schema: public; Owner: ds
--

CREATE INDEX daily_statistics_import_date_downloads_idx ON public.daily_statistics USING btree (import_date DESC NULLS LAST, downloads DESC NULLS LAST);


--
-- Name: desings_id_idx; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX desings_id_idx ON public.designs USING btree (id);


--
-- Name: desings_title_idx; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX desings_title_idx ON public.designs USING btree (title);


--
-- Name: fki_desgins_sources_fk; Type: INDEX; Schema: public; Owner: ds
--

CREATE INDEX fki_desgins_sources_fk ON public.sources USING btree (design_id);


--
-- Name: imports_import_date_asc_design_id_source_import_type_idx; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX imports_import_date_asc_design_id_source_import_type_idx ON public.imports USING btree (import_date, design_id, source, import_type);


--
-- Name: imports_import_date_desc_design_id_source_import_type_idx; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX imports_import_date_desc_design_id_source_import_type_idx ON public.imports USING btree (import_date DESC, design_id, source, import_type);


--
-- Name: imports_import_date_downloads_idx; Type: INDEX; Schema: public; Owner: ds
--

CREATE INDEX imports_import_date_downloads_idx ON public.imports USING btree (import_date DESC NULLS LAST, downloads DESC NULLS LAST);


--
-- Name: sources_design_id_source; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX sources_design_id_source ON public.sources USING btree (design_id, source);


--
-- Name: sources_sources_id; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX sources_sources_id ON public.sources USING btree (source_id);


--
-- Name: statistics_year_asc_month_asc_design_id_source_statistics_type_; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX statistics_year_asc_month_asc_design_id_source_statistics_type_ ON public.statistics USING btree (year, month, design_id, source, statistic_type);


--
-- Name: statistics_year_desc_month_desc_design_id_source_statistics_typ; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX statistics_year_desc_month_desc_design_id_source_statistics_typ ON public.statistics USING btree (year DESC, month DESC, design_id, source, statistic_type);


--
-- Name: daily_statistics daily_statistics_design_id_source_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.daily_statistics
    ADD CONSTRAINT daily_statistics_design_id_source_fkey FOREIGN KEY (design_id, source) REFERENCES public.sources(design_id, source);


--
-- Name: sources desgins_sources_fk; Type: FK CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT desgins_sources_fk FOREIGN KEY (design_id) REFERENCES public.designs(id) NOT VALID;


--
-- Name: imports import_design_id_source_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT import_design_id_source_fkey FOREIGN KEY (design_id, source) REFERENCES public.sources(design_id, source);


--
-- Name: statistics statistics_design_id_source_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.statistics
    ADD CONSTRAINT statistics_design_id_source_fkey FOREIGN KEY (design_id, source) REFERENCES public.sources(design_id, source) NOT VALID;


--
-- PostgreSQL database dump complete
--


-- 
-- Initialize schema version
-- 

INSERT INTO public.versions (version_type, value) VALUES ('Schema', 1);
