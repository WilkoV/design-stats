-- Retrive all designs and sources
SELECT d.id, d.title, s.source, s.source_id
FROM designs d
LEFT OUTER JOIN sources s ON d.id = s.designs_id
ORDER BY d.id, s.source