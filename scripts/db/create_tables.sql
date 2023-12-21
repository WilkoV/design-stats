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
-- Name: compare_daily_design_downloads; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.compare_daily_design_downloads AS
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.daily_statistics t
     JOIN public.daily_statistics c ON (((t.design_id = c.design_id) AND (t.import_date = c.import_date) AND (c.source = 'Cults3d'::public.sources_type))))
     JOIN public.daily_statistics p ON (((t.design_id = p.design_id) AND (t.import_date = p.import_date) AND (p.source = 'Printables'::public.sources_type))))
     JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE (t.source = 'Thingiverse'::public.sources_type)
UNION
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.daily_statistics c
     JOIN public.daily_statistics t ON (((t.design_id = c.design_id) AND (t.import_date = c.import_date) AND (t.source = 'Thingiverse'::public.sources_type))))
     JOIN public.daily_statistics p ON (((c.design_id = p.design_id) AND (c.import_date = p.import_date) AND (p.source = 'Printables'::public.sources_type))))
     JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE (c.source = 'Cults3d'::public.sources_type)
UNION
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.daily_statistics p
     JOIN public.daily_statistics c ON (((p.design_id = c.design_id) AND (p.import_date = c.import_date) AND (c.source = 'Cults3d'::public.sources_type))))
     JOIN public.daily_statistics t ON (((t.design_id = p.design_id) AND (t.import_date = p.import_date) AND (t.source = 'Thingiverse'::public.sources_type))))
     JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE (p.source = 'Printables'::public.sources_type)
  ORDER BY 1, 2;


ALTER TABLE public.compare_daily_design_downloads OWNER TO ds;

--
-- Name: compare_monthly_design_downloads; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.compare_monthly_design_downloads AS
 SELECT to_char((compare_daily_design_downloads.import_date)::timestamp with time zone, 'YYYY/MM'::text) AS import_date,
    compare_daily_design_downloads.design_id,
    compare_daily_design_downloads.title,
    sum(compare_daily_design_downloads.thingiverse_downloads) AS thingiverse_downloads,
    sum(compare_daily_design_downloads.cults3d_downloads) AS cults3d_downloads,
    sum(compare_daily_design_downloads.printables_downloads) AS printables_downloads
   FROM public.compare_daily_design_downloads
  GROUP BY (to_char((compare_daily_design_downloads.import_date)::timestamp with time zone, 'YYYY/MM'::text)), compare_daily_design_downloads.design_id, compare_daily_design_downloads.title
  ORDER BY (to_char((compare_daily_design_downloads.import_date)::timestamp with time zone, 'YYYY/MM'::text)), compare_daily_design_downloads.design_id, compare_daily_design_downloads.title;


ALTER TABLE public.compare_monthly_design_downloads OWNER TO ds;

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
-- Name: compare_total_design_downloads; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.compare_total_design_downloads AS
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.imports t
     JOIN public.imports c ON (((t.design_id = c.design_id) AND (t.import_date = c.import_date) AND (c.source = 'Cults3d'::public.sources_type))))
     JOIN public.imports p ON (((t.design_id = p.design_id) AND (t.import_date = p.import_date) AND (p.source = 'Printables'::public.sources_type))))
     JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE ((t.source = 'Thingiverse'::public.sources_type) AND (t.import_date = ( SELECT max(imports.import_date) AS max
           FROM public.imports)))
UNION
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.imports c
     JOIN public.imports t ON (((t.design_id = c.design_id) AND (t.import_date = c.import_date) AND (t.source = 'Thingiverse'::public.sources_type))))
     JOIN public.imports p ON (((c.design_id = p.design_id) AND (c.import_date = p.import_date) AND (p.source = 'Printables'::public.sources_type))))
     JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE ((c.source = 'Cults3d'::public.sources_type) AND (c.import_date = ( SELECT max(imports.import_date) AS max
           FROM public.imports)))
UNION
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.imports p
     JOIN public.imports c ON (((p.design_id = c.design_id) AND (p.import_date = c.import_date) AND (c.source = 'Cults3d'::public.sources_type))))
     JOIN public.imports t ON (((t.design_id = p.design_id) AND (t.import_date = p.import_date) AND (t.source = 'Thingiverse'::public.sources_type))))
     JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE ((p.source = 'Printables'::public.sources_type) AND (p.import_date = ( SELECT max(imports.import_date) AS max
           FROM public.imports)))
  ORDER BY 1, 2;


ALTER TABLE public.compare_total_design_downloads OWNER TO ds;

--
-- Name: compare_yearly_design_downloads; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.compare_yearly_design_downloads AS
 SELECT to_char((compare_daily_design_downloads.import_date)::timestamp with time zone, 'YYYY'::text) AS import_date,
    compare_daily_design_downloads.design_id,
    compare_daily_design_downloads.title,
    sum(compare_daily_design_downloads.thingiverse_downloads) AS thingiverse_downloads,
    sum(compare_daily_design_downloads.cults3d_downloads) AS cults3d_downloads,
    sum(compare_daily_design_downloads.printables_downloads) AS printables_downloads
   FROM public.compare_daily_design_downloads
  GROUP BY (to_char((compare_daily_design_downloads.import_date)::timestamp with time zone, 'YYYY'::text)), compare_daily_design_downloads.design_id, compare_daily_design_downloads.title
  ORDER BY (to_char((compare_daily_design_downloads.import_date)::timestamp with time zone, 'YYYY'::text)), compare_daily_design_downloads.design_id, compare_daily_design_downloads.title;


ALTER TABLE public.compare_yearly_design_downloads OWNER TO ds;

--
-- Name: daily_design_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.daily_design_statistics_sums AS
 SELECT to_char((s.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    s.design_id,
    d.title,
    s.source,
    s.downloads,
    s.likes,
    s.views,
    s.makes,
    s.remixes,
    s.comments,
    s.collections
   FROM (public.daily_statistics s
     JOIN public.designs d ON ((s.design_id = d.id)))
  ORDER BY (to_char((s.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text)), s.design_id, s.source;


ALTER TABLE public.daily_design_statistics_sums OWNER TO ds;

--
-- Name: daily_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.daily_statistics_sums AS
 SELECT to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    daily_statistics.source,
    sum(daily_statistics.downloads) AS downloads,
    sum(daily_statistics.likes) AS likes,
    sum(daily_statistics.views) AS views,
    sum(daily_statistics.makes) AS makes,
    sum(daily_statistics.remixes) AS remixes,
    sum(daily_statistics.comments) AS comments,
    sum(daily_statistics.collections) AS collections
   FROM public.daily_statistics
  GROUP BY daily_statistics.import_date, daily_statistics.source
  ORDER BY daily_statistics.import_date, daily_statistics.source;


ALTER TABLE public.daily_statistics_sums OWNER TO ds;

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
-- Name: statistics; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.statistics (
    year integer NOT NULL,
    month integer NOT NULL,
    design_id integer NOT NULL,
    source public.sources_type NOT NULL,
    statistic_type public.statistics_type NOT NULL,
    last_1d integer,
    last_7d integer,
    last_30d integer,
    this_month integer,
    last_365d integer,
    this_year integer NOT NULL,
    total integer NOT NULL
);


ALTER TABLE public.statistics OWNER TO ds;

--
-- Name: design_statistics; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.design_statistics AS
 SELECT s.year,
    s.month,
    s.design_id,
    d.title,
    s.source,
    s.statistic_type,
    s.last_1d,
    s.last_7d,
    s.last_30d,
    s.this_month,
    s.last_365d,
    s.this_year,
    s.total
   FROM (public.statistics s
     JOIN public.designs d ON ((s.design_id = d.id)))
  ORDER BY s.year, s.month, s.design_id, s.source, s.statistic_type;


ALTER TABLE public.design_statistics OWNER TO ds;

--
-- Name: monthly_design_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.monthly_design_statistics_sums AS
 SELECT to_char((s.import_date)::timestamp with time zone, 'YYYY/MM'::text) AS import_date,
    s.design_id,
    d.title,
    s.source,
    sum(s.downloads) AS downloads,
    sum(s.likes) AS likes,
    sum(s.views) AS views,
    sum(s.makes) AS makes,
    sum(s.remixes) AS remixes,
    sum(s.comments) AS comments,
    sum(s.collections) AS collections
   FROM (public.daily_statistics s
     JOIN public.designs d ON ((s.design_id = d.id)))
  GROUP BY (to_char((s.import_date)::timestamp with time zone, 'YYYY/MM'::text)), s.design_id, d.title, s.source
  ORDER BY (to_char((s.import_date)::timestamp with time zone, 'YYYY/MM'::text)), s.design_id, d.title, s.source;


ALTER TABLE public.monthly_design_statistics_sums OWNER TO ds;

--
-- Name: monthly_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.monthly_statistics_sums AS
 SELECT to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY/MM'::text) AS import_date,
    daily_statistics.source,
    sum(daily_statistics.downloads) AS downloads,
    sum(daily_statistics.likes) AS likes,
    sum(daily_statistics.views) AS views,
    sum(daily_statistics.makes) AS makes,
    sum(daily_statistics.remixes) AS remixes,
    sum(daily_statistics.comments) AS comments,
    sum(daily_statistics.collections) AS collections
   FROM public.daily_statistics
  GROUP BY (to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY/MM'::text)), daily_statistics.source
  ORDER BY (to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY/MM'::text)), daily_statistics.source;


ALTER TABLE public.monthly_statistics_sums OWNER TO ds;

--
-- Name: source_statistics; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.source_statistics AS
 SELECT s.year,
    s.month,
    s.source,
    s.statistic_type,
    sum(s.last_1d) AS last_1d,
    sum(s.last_7d) AS last_7d,
    sum(s.last_30d) AS last_30d,
    sum(s.this_month) AS this_month,
    sum(s.last_365d) AS last_365d,
    sum(s.this_year) AS this_year,
    sum(s.total) AS total
   FROM (public.statistics s
     JOIN public.designs d ON ((s.design_id = d.id)))
  GROUP BY s.year, s.month, s.source, s.statistic_type
  ORDER BY s.year, s.month, s.source, s.statistic_type;


ALTER TABLE public.source_statistics OWNER TO ds;

--
-- Name: sources; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.sources (
    design_id integer NOT NULL,
    source public.sources_type NOT NULL,
    source_id character varying(120) NOT NULL,
    createdAd date
);

ALTER TABLE IF EXISTS public.sources
    ADD COLUMN inactive boolean DEFAULT false;

ALTER TABLE public.sources OWNER TO ds;

--
-- Name: total_design_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.total_design_statistics_sums AS
 SELECT s.design_id,
    d.title,
    s.source,
    s.downloads,
    s.likes,
    s.views,
    s.makes,
    s.remixes,
    s.comments,
    s.collections
   FROM (public.imports s
     JOIN public.designs d ON ((d.id = s.design_id)))
  WHERE (s.import_date = ( SELECT max(imports_1.import_date) AS max
           FROM public.imports imports_1))
  ORDER BY s.design_id;


ALTER TABLE public.total_design_statistics_sums OWNER TO ds;

--
-- Name: total_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.total_statistics_sums AS
 SELECT i.source,
    sum(i.downloads) AS downloads,
    sum(i.likes) AS likes,
    sum(i.views) AS views,
    sum(i.makes) AS makes,
    sum(i.remixes) AS remixes,
    sum(i.comments) AS comments,
    sum(i.collections) AS collections
   FROM public.imports i
  WHERE (i.import_date = ( SELECT max(imports_1.import_date) AS max
           FROM public.imports imports_1))
  GROUP BY i.source
  ORDER BY i.source;


ALTER TABLE public.total_statistics_sums OWNER TO ds;

--
-- Name: versions; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.versions (
    version_type public.versions_types NOT NULL,
    value integer NOT NULL
);


ALTER TABLE public.versions OWNER TO ds;

--
-- Name: yearly_design_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.yearly_design_statistics_sums AS
 SELECT to_char((s.import_date)::timestamp with time zone, 'YYYY'::text) AS import_date,
    s.design_id,
    d.title,
    s.source,
    sum(s.downloads) AS downloads,
    sum(s.likes) AS likes,
    sum(s.views) AS views,
    sum(s.makes) AS makes,
    sum(s.remixes) AS remixes,
    sum(s.comments) AS comments,
    sum(s.collections) AS collections
   FROM (public.daily_statistics s
     JOIN public.designs d ON ((s.design_id = d.id)))
  GROUP BY (to_char((s.import_date)::timestamp with time zone, 'YYYY'::text)), s.design_id, d.title, s.source
  ORDER BY (to_char((s.import_date)::timestamp with time zone, 'YYYY'::text)), s.design_id, d.title, s.source;


ALTER TABLE public.yearly_design_statistics_sums OWNER TO ds;

--
-- Name: yearly_statistics_sums; Type: VIEW; Schema: public; Owner: ds
--

CREATE VIEW public.yearly_statistics_sums AS
 SELECT to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY'::text) AS import_date,
    daily_statistics.source,
    sum(daily_statistics.downloads) AS downloads,
    sum(daily_statistics.likes) AS likes,
    sum(daily_statistics.views) AS views,
    sum(daily_statistics.makes) AS makes,
    sum(daily_statistics.remixes) AS remixes,
    sum(daily_statistics.comments) AS comments,
    sum(daily_statistics.collections) AS collections
   FROM public.daily_statistics
  GROUP BY (to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY'::text)), daily_statistics.source
  ORDER BY (to_char((daily_statistics.import_date)::timestamp with time zone, 'YYYY'::text)), daily_statistics.source;


ALTER TABLE public.yearly_statistics_sums OWNER TO ds;

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

