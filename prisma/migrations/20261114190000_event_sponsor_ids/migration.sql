-- Sanity sponsor document ids shown on the public event page. Additive; existing rows get an empty list.
ALTER TABLE "events" ADD COLUMN "sponsorSanityIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
