-- Retrive all designs and sources
SELECT d.id, d.title, s.source, s.source_id
FROM designs d
LEFT OUTER JOIN sources s ON d.id = s.design_id
ORDER BY d.id, s.source;

-- Retrive design by title
SELECT *
FROM designs
-- where title = 'Vase 03';
where id = 131;
