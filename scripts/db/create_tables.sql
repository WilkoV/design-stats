--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2 (Debian 14.2-1.pgdg110+1)
-- Dumped by pg_dump version 14.2 (Debian 14.2-1.pgdg110+1)

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
-- Name: source_type; Type: TYPE; Schema: public; Owner: ds
--

CREATE TYPE public.source_type AS ENUM (
    'Cults3d',
    'Printable',
    'Thingiverse'
);


ALTER TYPE public.source_type OWNER TO ds;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: designs; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.designs (
    id integer NOT NULL,
    title character varying
);


ALTER TABLE public.designs OWNER TO ds;

--
-- Name: designs_id_seq; Type: SEQUENCE; Schema: public; Owner: ds
--

CREATE SEQUENCE public.designs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.designs_id_seq OWNER TO ds;

--
-- Name: designs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ds
--

ALTER SEQUENCE public.designs_id_seq OWNED BY public.designs.id;


--
-- Name: sources; Type: TABLE; Schema: public; Owner: ds
--

CREATE TABLE public.sources (
    designs_id integer NOT NULL,
    source public.source_type NOT NULL,
    source_id character varying(120) NOT NULL
);


ALTER TABLE public.sources OWNER TO ds;

--
-- Name: designs id; Type: DEFAULT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.designs ALTER COLUMN id SET DEFAULT nextval('public.designs_id_seq'::regclass);


--
-- Name: designs designs_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.designs
    ADD CONSTRAINT designs_pkey PRIMARY KEY (id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (designs_id, source);


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

CREATE INDEX fki_desgins_sources_fk ON public.sources USING btree (designs_id);


--
-- Name: sources_designs_id_source; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX sources_designs_id_source ON public.sources USING btree (designs_id, source);


--
-- Name: sources_sources_id; Type: INDEX; Schema: public; Owner: ds
--

CREATE UNIQUE INDEX sources_sources_id ON public.sources USING btree (source_id);


--
-- Name: sources desgins_sources_fk; Type: FK CONSTRAINT; Schema: public; Owner: ds
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT desgins_sources_fk FOREIGN KEY (designs_id) REFERENCES public.designs(id) NOT VALID;


--
-- PostgreSQL database dump complete
--
