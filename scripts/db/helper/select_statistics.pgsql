
-- show all downloads from a certain month
SELECT s.year, s.month, d.id, d.title, s.source, s.statistic_type, s.last_1d, s.last_7d, s.last_30d, s.this_month, s.last_365d, s.this_year, s.total
FROM statistics s
JOIN designs d ON s.design_id = d.id
WHERE s.year = 2022 AND s.month = 6
AND s.statistic_type = 'downloads'
AND s.last_1d > 0
ORDER BY s.last_1d desc;

-- get daily sums
SELECT  to_char(import_date, 'YYYY/MM/DD') as date, source,
        sum(downloads) as downloads, sum(likes) as likes, sum(views) as views, sum(makes) as makes, sum(remixes) as remixes, 
        sum(comments) as comments, sum(collections) as collections
FROM daily_statistics
WHERE import_date > '2022/05/31'
AND import_date = '2022/06/02'
GROUP BY import_date, source
ORDER BY import_date, source;

-- get total sums
SELECT  to_char(import_date, 'YYYY/MM/DD') as date, source,
        sum(downloads) as downloads, sum(likes) as likes, sum(views) as views, sum(makes) as makes, sum(remixes) as remixes, 
        sum(comments) as comments, sum(collections) as collections
FROM imports
WHERE import_date > '2022/05/31'
AND import_date = '2022/06/02'
GROUP BY import_date, source
ORDER BY import_date, source;

-- compare daily downloads per thing between platforms
SELECT to_char(t.import_date, 'YYYY/MM/DD') as date, d.id, d.title, t.downloads AS "Thingiverse", c.downloads AS "Cults3d", p.downloads AS "Printables"
FROM daily_statistics t
JOIN daily_statistics c ON t.design_id = c.design_id AND t.import_date = c.import_date AND c.source = 'Cults3d'
JOIN daily_statistics p ON t.design_id = p.design_id AND t.import_date = p.import_date AND p.source = 'Printables'
JOIN designs d ON t.design_id = d.id
WHERE t.source = 'Thingiverse'
AND t.downloads > 0
AND t.import_date = '2022/06/02'
UNION 
SELECT to_char(t.import_date, 'YYYY/MM/DD'), d.id, d.title, t.downloads AS "Thingiverse", c.downloads AS "Cults3d", p.downloads AS "Printables"
FROM daily_statistics c
JOIN daily_statistics t ON t.design_id = c.design_id AND t.import_date = c.import_date AND t.source = 'Thingiverse'
JOIN daily_statistics p ON c.design_id = p.design_id AND c.import_date = p.import_date AND p.source = 'Printables'
JOIN designs d ON t.design_id = d.id
WHERE c.source = 'Cults3d'
AND c.downloads > 0
AND c.import_date = '2022/06/02'
UNION
SELECT to_char(t.import_date, 'YYYY/MM/DD'), d.id, d.title, t.downloads AS "Thingiverse", c.downloads AS "Cults3d", p.downloads AS "Printables"
FROM daily_statistics p
JOIN daily_statistics c ON p.design_id = c.design_id AND p.import_date = c.import_date AND c.source = 'Cults3d'
JOIN daily_statistics t ON t.design_id = p.design_id AND t.import_date = p.import_date AND t.source = 'Thingiverse'
JOIN designs d ON t.design_id = d.id
WHERE p.source = 'Printables'
AND p.downloads > 0
AND p.import_date = '2022/06/02'
ORDER BY 4 desc, 5 desc, 6 desc;
