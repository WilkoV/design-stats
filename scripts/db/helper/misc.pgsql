SELECT to_char(t.import_date, 'YYYY/MM/DD') as date, d.id, d.title, t.downloads AS "thingiverse_downloads", c.downloads AS "cults3d_downloads", p.downloads AS "printables_downloads"
FROM daily_statistics t
JOIN daily_statistics c ON t.design_id = c.design_id AND t.import_date = c.import_date AND c.source = 'Cults3d'
JOIN daily_statistics p ON t.design_id = p.design_id AND t.import_date = p.import_date AND p.source = 'Printables'
JOIN designs d ON t.design_id = d.id
WHERE t.source = 'Thingiverse'
UNION 
SELECT to_char(t.import_date, 'YYYY/MM/DD'), d.id, d.title, t.downloads AS "thingiverse_downloads", c.downloads AS "cults3d_downloads", p.downloads AS "printables_downloads"
FROM daily_statistics c
JOIN daily_statistics t ON t.design_id = c.design_id AND t.import_date = c.import_date AND t.source = 'Thingiverse'
JOIN daily_statistics p ON c.design_id = p.design_id AND c.import_date = p.import_date AND p.source = 'Printables'
JOIN designs d ON t.design_id = d.id
WHERE c.source = 'Cults3d'
UNION
SELECT to_char(t.import_date, 'YYYY/MM/DD'), d.id, d.title, t.downloads AS "thingiverse_downloads", c.downloads AS "cults3d_downloads", p.downloads AS "printables_downloads"
FROM daily_statistics p
JOIN daily_statistics c ON p.design_id = c.design_id AND p.import_date = c.import_date AND c.source = 'Cults3d'
JOIN daily_statistics t ON t.design_id = p.design_id AND t.import_date = p.import_date AND t.source = 'Thingiverse'
JOIN designs d ON t.design_id = d.id
WHERE p.source = 'Printables'
ORDER BY 1, 2;

SELECT to_char(t.import_date, 'YYYY/MM/DD') as date, d.id, d.title, t.downloads AS "thingiverse_downloads", c.downloads AS "cults3d_downloads", p.downloads AS "printables_downloads"
FROM imports t
JOIN imports c ON t.design_id = c.design_id AND t.import_date = c.import_date AND c.source = 'Cults3d'
JOIN imports p ON t.design_id = p.design_id AND t.import_date = p.import_date AND p.source = 'Printables'
JOIN designs d ON t.design_id = d.id
WHERE t.source = 'Thingiverse'
AND t.import_date = (SELECT max(import_date) FROM imports)
UNION 
SELECT to_char(t.import_date, 'YYYY/MM/DD'), d.id, d.title, t.downloads AS "thingiverse_downloads", c.downloads AS "cults3d_downloads", p.downloads AS "printables_downloads"
FROM imports c
JOIN imports t ON t.design_id = c.design_id AND t.import_date = c.import_date AND t.source = 'Thingiverse'
JOIN imports p ON c.design_id = p.design_id AND c.import_date = p.import_date AND p.source = 'Printables'
JOIN designs d ON t.design_id = d.id
WHERE c.source = 'Cults3d'
AND c.import_date = (SELECT max(import_date) FROM imports)
UNION
SELECT to_char(t.import_date, 'YYYY/MM/DD'), d.id, d.title, t.downloads AS "thingiverse_downloads", c.downloads AS "cults3d_downloads", p.downloads AS "printables_downloads"
FROM imports p
JOIN imports c ON p.design_id = c.design_id AND p.import_date = c.import_date AND c.source = 'Cults3d'
JOIN imports t ON t.design_id = p.design_id AND t.import_date = p.import_date AND t.source = 'Thingiverse'
JOIN designs d ON t.design_id = d.id
WHERE p.source = 'Printables'
AND p.import_date = (SELECT max(import_date) FROM imports)
ORDER BY 1, 2;

SELECT to_char(import_date::timestamp with time zone, 'YYYY'::text) , id, title, sum(thingiverse_downloads) AS "thingiverse_downloads", sum(cults3d_downloads) AS "cults3d_downloads", sum(printables_downloads) AS "printables_downloads"
FROM compare_daily_design_downloads
GROUP BY to_char(import_date::timestamp with time zone, 'YYYY'::text) , id, title
ORDER BY to_char(import_date::timestamp with time zone, 'YYYY'::text) , id, title;



SELECT * FROM compare_daily_design_downloads WHERE (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0) ORDER BY import_date, id;
SELECT * FROM compare_monthly_design_downloads WHERE (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0) ORDER BY import_date, id;
SELECT * FROM compare_yearly_design_downloads WHERE (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0) ORDER BY import_date, id;
SELECT * FROM compare_total_design_downloads WHERE (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0) ORDER BY import_date, id;

SELECT sum(thingiverse_downloads) AS "thingiverse_downloads", sum(cults3d_downloads) AS "cults3d_downloads", sum(printables_downloads) AS "printables_downloads"
FROM compare_total_design_downloads;


SELECT to_char(s.import_date, 'YYYY/MM/DD') as import_date, s.design_id, d.title, s.source,
    s.downloads, s.likes, s.views, s.makes, s.remixes, s.comments, s.collections
FROM daily_statistics s
JOIN designs d ON s.design_id = d.id
ORDER BY to_char(s.import_date, 'YYYY/MM/DD'), s.design_id, s.source;


SELECT *
FROM daily_design_statistics_sums
WHERE 1 = 1 AND (downloads > 0 OR likes > 0 OR views > 0 OR makes > 0 OR remixes > 0 OR comments > 0 OR collections > 0)
AND design_id = 86
AND source = 'Printables'
ORDER BY import_date;

SELECT * 
FROM compare_daily_design_downloads
WHERE 1 = 1 
AND (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0)
ORDER BY import_date;

SELECT *
FROM monthly_design_statistics_sums
WHERE 1 = 1 AND (downloads > 0 OR likes > 0 OR views > 0 OR makes > 0 OR remixes > 0 OR comments > 0 OR collections > 0)  
AND title ILIKE '%vase%'  
AND import_date = '2022/06'
ORDER BY import_date;

SELECT *
FROM compare_monthly_design_downloads
WHERE 1 = 1 AND (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0)
AND import_date = '2022/06/05'
ORDER BY import_date;

SELECT * FROM total_design_statistics_sums;

SELECT s.year, s.month, s.design_id, d.title, s.source, s.statistic_type, s.last_1d, s.last_7d, s.last_30d, s.this_month, s.last_365d, s.this_year, s.total
FROM statistics s
JOIN designs d ON s.design_id = d.id
WHERE ( s.last_1d > 0 OR s.last_7d > 0 OR s.last_30d > 0 OR s.this_month > 0 OR s.last_365d > 0 OR s.this_year > 0 OR s.total > 0 )
AND s.statistic_type = 'downloads'
ORDER BY s.year, s.month, s.design_id, s.source, s.statistic_type;


SELECT s.year, s.month, s.design_id, d.title, s.source, s.statistic_type, s.last_1d, s.last_7d, s.last_30d, s.this_month, s.last_365d, s.this_year, s.total
FROM statistics s
JOIN designs d ON s.design_id = d.id
ORDER BY s.year, s.month, s.design_id, s.source, s.statistic_type;


SELECT s.year as year, s.month as month, s.source as source, s.statistic_type as statistic_type,
sum(s.last_1d) as last_1d, sum(s.last_7d) as last_7d, sum(s.last_30d) as last_30d, sum(s.this_month) as this_month, sum(s.last_365d) as last_365d, sum(s.this_year) as this_year, sum(s.total) as total
FROM statistics s 
JOIN designs d ON s.design_id = d.id
GROUP BY s.year, s.month, s.source, s.statistic_type
ORDER BY s.year, s.month, s.source, s.statistic_type;

SELECT *
FROM imports
WHERE design_id = 168;

SELEcT * from statistics where design_id = 168 OR design_id = 167

SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.daily_statistics t
     LEFT  JOIN public.daily_statistics c ON (((t.design_id = c.design_id) AND (t.import_date = c.import_date) AND (c.source = 'Cults3d'::public.sources_type))))
     LEFT JOIN public.daily_statistics p ON (((t.design_id = p.design_id) AND (t.import_date = p.import_date) AND (p.source = 'Printables'::public.sources_type))))
     LEFT JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE (t.source = 'Thingiverse'::public.sources_type)
UNION
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.daily_statistics c
     LEFT JOIN public.daily_statistics t ON (((t.design_id = c.design_id) AND (t.import_date = c.import_date) AND (t.source = 'Thingiverse'::public.sources_type))))
     LEFT JOIN public.daily_statistics p ON (((c.design_id = p.design_id) AND (c.import_date = p.import_date) AND (p.source = 'Printables'::public.sources_type))))
     LEFT JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE (c.source = 'Cults3d'::public.sources_type)
UNION
 SELECT to_char((t.import_date)::timestamp with time zone, 'YYYY/MM/DD'::text) AS import_date,
    d.id AS design_id,
    d.title,
    t.downloads AS thingiverse_downloads,
    c.downloads AS cults3d_downloads,
    p.downloads AS printables_downloads
   FROM (((public.daily_statistics p
     LEFT JOIN public.daily_statistics c ON (((p.design_id = c.design_id) AND (p.import_date = c.import_date) AND (c.source = 'Cults3d'::public.sources_type))))
     LEFT JOIN public.daily_statistics t ON (((t.design_id = p.design_id) AND (t.import_date = p.import_date) AND (t.source = 'Thingiverse'::public.sources_type))))
     LEFT JOIN public.designs d ON ((t.design_id = d.id)))
  WHERE (p.source = 'Printables'::public.sources_type)
  ORDER BY 1, 2;
  

  

select max(import_date) from imports

select * from imports order by 1 desc

select * from daily_statistics where design_id >= 189 and design_id <= 191 order by 1,2

select * from designs where id >= 167

select * from statistics where design_id = 180

select * from daily_statistics where design_id >= 180 order by design_id

select * from  statistics where design_id >= 189 order by design_id

select distinct  import_date from daily_statistics where design_id >= 167 order by 1

select design_id, views, round(views/1000)*1000 from imports where source = 'Printables' and views >= 1000 order by design_id

select * from imports where design_id = 125 and source = 'Printables' order by import_date desc

SELECT import_date, design_id, source, import_type, downloads, likes, views, makes, remixes, comments, collections                 
FROM imports                 
WHERE source = 'Printables'  
AND design_id = 1                  
ORDER BY import_date
LIMIT 400

SELECT source, design_id, date_part('year', import_date) as "year", date_part('month', import_date) as "month", 
sum(downloads), sum(likes), sum(views), sum(makes), sum(remixes), sum(comments), sum(collections)
FROM daily_statistics
WHERE source = 'Printables'
GROUP BY source, design_id, year, month
ORDER BY source, design_id, year, month

SELECT source, date_part('year', import_date) as "year", date_part('month', import_date) as "month", 
sum(downloads), sum(likes), sum(views), sum(makes), sum(remixes), sum(comments), sum(collections)
FROM daily_statistics
WHERE source = 'Printables'
AND import_date > '2022-05-31'
AND design_Id = 1
GROUP BY source, year, month
ORDER BY source, year, month

SELECT source, date_part('year', import_date) as "year", date_part('month', import_date) as "month", 
sum(downloads), sum(likes), sum(views), sum(makes), sum(remixes), sum(comments), sum(collections)
FROM daily_statistics
GROUP BY source, year, month
ORDER BY source, year, month

SELECT *
FROM statistics
WHERE source = 'Printables'
ORDER BY design_id, year, month
LIMIT 300

select 'designs' as "topic", count(*) from designs union
select 'sources' as "topic", count(*) from sources union
select 'imports' as "topic", count(*) from imports union
select 'daily_statistics' as "topic", count(*) from daily_statistics union
select 'statistics' as "topic", count(*) from statistics 
order by 1

select * from sources

select count(*) from imports;

select * from statistics where design_id = 127 and source = 'Printables' limit 3000

select * from daily_statistics where design_id = 127 and source = 'Printables' limit 3000

select * from daily_statistics where design_id = 1 and source = 'Printables' limit 3000

select * from designs

select * from statistics where design_id = 1 and source = 'Printables' and statistic_type = 'downloads' limit 3000

SELECT * FROM designs WHERE title in (
  'Woodturning Basket 01',
'Woodturning Vase 05',
'Cookie Cutter Bobble Hat (2x4)',
'Cookie Cutter Heart (4x1)',
'Vase 10',
'Sphericon 01 (Hexagon Based)',
'Bottle Opener (Smart Infill)',
'RC Fire Monitor 1:15 scale',
'Bailer 02 (1500 ml)'
)

SELECT import_date, design_id, source, import_type, downloads, likes, views, makes, remixes, comments, collections 
FROM imports 
WHERE source = 'Printables'
AND design_id = 1
ORDER BY import_date


SELECT import_date, design_id, source, import_type, downloads, likes, views, makes, remixes, comments, collections                 FROM imports                 WHERE  source = 'Printables'  AND design_id = 1                  ORDER BY import_date

SELECT distinct import_date FROM imports WHERE source = 'Printables' ORDER BY import_date DESC LIMIT 30

SELECT 'ds updateStatistics --source Printables -d ' || id FROM designs WHERE title in (
'ChristmasBauble 04 (Vase Mode)',
'Sanding wheel, Lamellar Grinder',
'Pinwheel / Windmill - 6 wings (Garden / Toy)',
'Kung Fu Panda Planter 01',
'Can Racer 01',
'Snowman 03 (SC)',
'Penguin 03 (SC)'
 )

select * from designs order by id desc

update designs set title = 'Planter 02 - Embossed (MC)' where id = 236

SELECT * FROM designs where title = 'Ring Vase 01'

select distinct import_date from imports order by import_date desc limit 3000



select * from designs order by id desc
