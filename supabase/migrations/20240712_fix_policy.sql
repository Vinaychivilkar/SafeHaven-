-- Fix the policy error by dropping and recreating it correctly
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";

CREATE POLICY "Users can update their own profile"
ON "public"."profiles"
FOR UPDATE
USING (auth.uid() = id);
