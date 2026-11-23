/** JSON contains short URLs so browser lazy loading and image cache can work. */
export const publicImageUrlSql = "CASE WHEN i.url LIKE 'data:image/%' THEN '/api/public/images/' || i.id::text ELSE i.url END";

