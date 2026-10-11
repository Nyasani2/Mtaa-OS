-- Run this in Supabase SQL Editor to check the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'streets_posts' 
AND column_name LIKE '%creator%' OR column_name LIKE '%user%';
