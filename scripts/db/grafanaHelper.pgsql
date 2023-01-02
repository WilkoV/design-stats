


SELECT rank() over (order by import_date, downloads desc) as my_rank, s.import_date, d.title, s.source, s.downloads
FROM daily_statistics as s
JOIN designs d ON s.design_id = d.id
WHERE s.downloads > 0

SELECT DISTINCT r.import_date, r.title, r.thingiverse_downloads, r.cults3d_downloads, r.printables_downloads
FROM (
        SELECT 
            s.import_date,
            rank() OVER (PARTITION BY s.import_date ORDER BY s.thingiverse_downloads desc) as grouped_rank, 
            d.title, 
            s.thingiverse_downloads, 
            s.cults3d_downloads, 
            s.printables_downloads
        FROM compare_monthly_design_downloads as s
        JOIN designs d ON s.design_id = d.id
        WHERE s.import_date <> '2022/05/31'
        UNION
        SELECT 
            s.import_date,
            rank() OVER (PARTITION BY s.import_date ORDER BY s.cults3d_downloads desc) as grouped_rank, 
            d.title, 
            s.thingiverse_downloads, 
            s.cults3d_downloads, 
            s.printables_downloads
        FROM compare_monthly_design_downloads as s
        JOIN designs d ON s.design_id = d.id
        WHERE s.import_date <> '2022/05/31'
        UNION 
        SELECT 
            s.import_date,
            rank() OVER (PARTITION BY s.import_date ORDER BY s.printables_downloads desc) as grouped_rank, 
            d.title, 
            s.thingiverse_downloads, 
            s.cults3d_downloads, 
            s.printables_downloads
        FROM compare_monthly_design_downloads as s
        JOIN designs d ON s.design_id = d.id
        WHERE s.import_date <> '2022/05/31'
        ORDER BY 1 DESC,2 ASC
    ) AS r
WHERE r.grouped_rank <= 10
ORDER BY 1, 2



SELECT r.import_date, r.grouped_rank, r.title, r.thingiverse_downloads, r.cults3d_downloads, r.printables_downloads
FROM (
        SELECT 
            s.import_date,
            rank() OVER (PARTITION BY s.import_date ORDER BY s.thingiverse_downloads desc) as grouped_rank, 
            d.title, 
            s.thingiverse_downloads, 
            s.cults3d_downloads, 
            s.printables_downloads
        FROM compare_daily_design_downloads as s
        JOIN designs d ON s.design_id = d.id
        WHERE s.thingiverse_downloads > 0
        AND s.import_date = '2022/06/28'
        UNION
        SELECT 
            s.import_date,
            rank() OVER (PARTITION BY s.import_date ORDER BY s.cults3d_downloads desc) as grouped_rank, 
            d.title, 
            s.thingiverse_downloads, 
            s.cults3d_downloads, 
            s.printables_downloads
        FROM compare_daily_design_downloads as s
        JOIN designs d ON s.design_id = d.id
        WHERE s.cults3d_downloads > 0
        AND s.import_date = '2022/06/28'
        UNION 
        SELECT 
            s.import_date,
            rank() OVER (PARTITION BY s.import_date ORDER BY s.printables_downloads desc) as grouped_rank, 
            d.title, 
            s.thingiverse_downloads, 
            s.cults3d_downloads, 
            s.printables_downloads
        FROM compare_daily_design_downloads as s
        JOIN designs d ON s.design_id = d.id
        WHERE s.printables_downloads > 0
        AND s.import_date = '2022/06/28'
        ORDER BY 1 DESC,2 ASC
    ) AS r
WHERE grouped_rank <= 10
ORDER BY 1,2

SELECT  d.title, s.source, s.import_date, s.downloads
FROM    daily_statistics s
JOIN    designs d ON s.design_id = d.id
WHERE   s.downloads > 0
ORDER BY s.import_date desc, s.downloads desc


SELECT R.*
FROM (
    SELECT  
        d.title, 
        s.source, 
        rank() OVER (PARTITION BY s.import_date ORDER BY import_date DESC, s.downloads DESC) AS grouped_rank, 
        s.import_date, 
        s.downloads
    FROM    daily_statistics s
    JOIN    designs d ON s.design_id = d.id
    WHERE   s.downloads > 0
) AS r
ORDER BY r.import_date DESC, r.grouped_rank ASC

SELECT * FROM daily_statistics WHERE downloads > 0 ORDER BY import_date DESC, downloads DESC

SELECT distinct TO_CHAR(import_date :: DATE, 'yyyy/mm/dd') from imports order by TO_CHAR(import_date :: DATE, 'yyyy/mm/dd') desc

SELECT s.year, s.month, d.title, s.last_30d as likes_last_30d, w.last_30d as downloads_last_30d
FROM design_statistics s
JOIN designs d ON s.design_id = d.id
JOIN design_statistics w ON s.design_id = w.design_id and s.source = w.source and s.year = w.year and s.month = w.month and w.statistic_type = 'downloads'
WHERE s.source = 'Printables'
AND s.statistic_type = 'likes'
AND s.last_30d > 0
ORDER BY s.last_30d DESC
JOIN

SELECT s.year, s.month, d.title, s.source, s.last_1d as downloads_last_1d, w.last_1d as likes_last_1d, s.last_7d as downloads_last_7d, w.last_7d as likes_last_7d, s.last_30d as downloads_last_30d, w.last_30d as likes_last_30d
FROM design_statistics s
JOIN designs d ON s.design_id = d.id
JOIN design_statistics w ON s.design_id = w.design_id and s.source = w.source and s.year = w.year and s.month = w.month and w.statistic_type = 'likes'
WHERE s.statistic_type = 'downloads'
AND  s.source = 'Printables'
AND s.last_1d > 0
AND s.month = 7
ORDER BY s.last_30d DESC
LIMIT 15

SELECT *
FROM (
    SELECT 
        s.import_date,
        s.source,
        d.title,
        s.downloads,
        rank() OVER (PARTITION BY s.source ORDER BY s.source, s.downloads DESC) AS ranked
    FROM imports s
    JOIN designs d ON s.design_id = d.id
    WHERE s.import_date = (SELECT MAX(import_date) FROM imports)
) AS R
WHERE r.ranked <= 10

SELECT s.import_date, s.source, d.title, s.downloads
FROM imports s
JOIN designs d ON s.design_id = d.id
WHERE design_id in (
    SELECT DISTINCT design_id
    FROM (
        SELECT 
            s.import_date,
            s.source,
            s.design_id,
            d.title,
            s.downloads,
            rank() OVER (PARTITION BY s.source ORDER BY s.source, s.downloads DESC) AS ranked
        FROM imports s
        JOIN designs d ON s.design_id = d.id
        WHERE s.import_date = (SELECT MAX(import_date) FROM imports)
    ) AS R
    WHERE r.ranked <= 10
)

SELECT DISTINCT design_id
FROM (
    SELECT 
        s.import_date,
        s.design_id,
        s.source,
        d.title,
        s.downloads,
        rank() OVER (PARTITION BY s.source ORDER BY s.source, s.downloads DESC) AS ranked
    FROM imports s
    JOIN designs d ON s.design_id = d.id
    WHERE s.import_date = (SELECT MAX(import_date) FROM imports)
) AS R
WHERE r.ranked <= 10

SELECT * FROM imports where design_id IN (146, 84, 112, 127, 149, 73, 125, 72, 165, 134, 66, 62, 75, 126, 142, 157, 78, 154, 76, 110, 148)


SELECT s.year, s.month, d.title, s.source, s.last_30d as downloads_last_30d, w.last_30d as likes_last_30d, s.last_1d as downloads_last_1d, w.last_1d as likes_last_1d, s.last_7d as downloads_last_7d, w.last_7d as likes_last_7d
FROM design_statistics s
JOIN designs d ON s.design_id = d.id
JOIN design_statistics w ON s.design_id = w.design_id and s.source = w.source and s.year = w.year and s.month = w.month and w.statistic_type = 'likes'
WHERE s.statistic_type = 'downloads'
AND  s.source = 'Printables'
AND s.last_1d > 0
AND s.month = 7
ORDER BY s.last_1d DESC
LIMIT 30

SELECT s.year, s.month, d.title, s.source, s.last_1d as downloads_last_1d, w.last_1d as likes_last_1d, s.last_7d as downloads_last_7d, w.last_7d as likes_last_7d, s.last_30d as downloads_last_30d, w.last_30d as likes_last_30d
FROM design_statistics s
JOIN designs d ON s.design_id = d.id
JOIN design_statistics w ON s.design_id = w.design_id and s.source = w.source and s.year = w.year and s.month = w.month and w.statistic_type = 'likes'
WHERE s.statistic_type = 'downloads'
AND  s.source = 'Printables'
AND s.last_30d > 0
AND s.month = 7
ORDER BY s.last_30d DESC
LIMIT 30

SELECT TO_CHAR(s.import_date, 'dd/mm/yyyy'), s.downloads 
FROM imports s
JOIN designs d ON s.design_id = d.id
WHERE d.title = 'C-Clamp / G-Clamp 01 - 03'
AND s.import_date > '2022/06/23'
AND s.source = 'Printables'

SELECT s.year, s.month, d.title, s.source, s.last_1d as downloads_last_1d, w.last_1d as likes_last_1d
FROM design_statistics s
JOIN designs d ON s.design_id = d.id
JOIN design_statistics w ON s.design_id = w.design_id and s.source = w.source and s.year = w.year and s.month = w.month and w.statistic_type = 'likes'
WHERE s.statistic_type = 'downloads'
AND  s.source = 'Printables'
AND s.last_1d > 0
AND s.month = 8
ORDER BY s.last_1d DESC
LIMIT 30;

SELECT s.year, s.month, d.title, s.source, s.this_month as downloads_this_month, w.this_month as likes_this_month, s.last_30d as downloads_last_30d, w.last_30d as likes_last_30d
FROM design_statistics s
JOIN designs d ON s.design_id = d.id
JOIN design_statistics w ON s.design_id = w.design_id and s.source = w.source and s.year = w.year and s.month = w.month and w.statistic_type = 'likes'
WHERE s.statistic_type = 'downloads'
AND  s.source = 'Printables'
AND s.last_30d > 0
AND s.month = 8
ORDER BY s.this_month DESC LIMIT 30


SELECT max(import_date) FROM imports

SELECT * FROM imports where design_id = 202 ORDER BY import_date desc, design_id  LIMIT 30

select * from sources where source = 'Cults3d'



SELECT *
FROM imports
WHERE design_id in (139, 142, 156, 157)
AND source = 'Printables' 
AND import_date = '2022-10-25'

SELECT count(*)
FROM imports
WHERE source = 'Printables' 
AND import_date = '2022-10-15'