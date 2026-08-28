-- Fold the eleven interests from the original seed into the categorised
-- catalogue. Profile links are repointed first (skipping pairs the profile
-- already holds, which the composite primary key would reject), then the
-- now-unreferenced legacy rows are removed.
WITH mapping(old_slug, new_slug) AS (
  VALUES
    ('movies', 'cinema'),
    ('cooking', 'cuisine'),
    ('dancing', 'danse'),
    ('entrepreneurship', 'entrepreneuriat'),
    ('faith', 'foi'),
    ('reading', 'lecture'),
    ('fashion', 'mode'),
    ('photography', 'photographie'),
    ('travel', 'voyage')
)
UPDATE "ProfileInterest" pi
SET "interestId" = new_i.id
FROM mapping m
JOIN "Interest" old_i ON old_i.slug = m.old_slug
JOIN "Interest" new_i ON new_i.slug = m.new_slug
WHERE pi."interestId" = old_i.id
  AND NOT EXISTS (
    SELECT 1 FROM "ProfileInterest" existing
    WHERE existing."profileId" = pi."profileId"
      AND existing."interestId" = new_i.id
  );

DELETE FROM "ProfileInterest"
WHERE "interestId" IN (
  SELECT id FROM "Interest"
  WHERE slug IN ('movies', 'cooking', 'dancing', 'entrepreneurship', 'faith',
                 'reading', 'fashion', 'photography', 'travel')
);

DELETE FROM "Interest"
WHERE slug IN ('movies', 'cooking', 'dancing', 'entrepreneurship', 'faith',
               'reading', 'fashion', 'photography', 'travel');
