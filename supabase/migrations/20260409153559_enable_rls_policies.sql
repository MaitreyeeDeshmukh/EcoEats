-- Row Level Security Policies for EcoEats
-- Run this in Supabase SQL Editor after tables are created

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE
-- =============================================================================

-- Everyone can read basic user info (for displaying host names, etc.)
CREATE POLICY "users_public_read"
ON users FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert their own profile (after signup)
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- =============================================================================
-- LISTINGS TABLE
-- =============================================================================

-- Everyone can read active listings
CREATE POLICY "listings_read_active"
ON listings FOR SELECT
TO authenticated
USING (status IN ('active', 'claimed'));

-- Organizers can create listings
CREATE POLICY "listings_create_organizer"
ON listings FOR INSERT
TO authenticated
WITH CHECK (
  host_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'organizer'
  )
);

-- Only the host can update their listings
CREATE POLICY "listings_update_host"
ON listings FOR UPDATE
TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

-- Only the host can delete their listings
CREATE POLICY "listings_delete_host"
ON listings FOR DELETE
TO authenticated
USING (host_id = auth.uid());

-- =============================================================================
-- CLAIMS TABLE
-- =============================================================================

-- Students can only see their own claims
CREATE POLICY "claims_read_own"
ON claims FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Organizers can see claims on their listings
CREATE POLICY "claims_read_host"
ON claims FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = claims.listing_id
    AND listings.host_id = auth.uid()
  )
);

-- Students can create claims
CREATE POLICY "claims_create_student"
ON claims FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'student'
  )
);

-- Only the claim owner can update their claim
CREATE POLICY "claims_update_student"
ON claims FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Hosts can update claims on their listings (for confirmation)
CREATE POLICY "claims_update_host"
ON claims FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = claims.listing_id
    AND listings.host_id = auth.uid()
  )
);

-- =============================================================================
-- ANONYMOUS ACCESS (for public data - optional)
-- =============================================================================

-- If you want unauthenticated users to see active listings:
-- CREATE POLICY "listings_public_read"
-- ON listings FOR SELECT
-- TO anon
-- USING (status = 'active');

-- =============================================================================
-- VERIFICATION: CHECK RLS IS ENABLED
-- =============================================================================

-- Run this to verify all tables have RLS enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. auth.uid() returns the authenticated user's ID from the JWT
-- 2. TO authenticated = only logged-in users can access
-- 3. TO anon = anyone (including unauthenticated) can access
-- 4. USING = condition for reading/updating/deleting
-- 5. WITH CHECK = condition for inserting/updating

-- =============================================================================
-- SECURITY BEST PRACTICES
-- =============================================================================

-- ✅ All tables have RLS enabled
-- ✅ Users can only modify their own data
-- ✅ Listings can only be modified by their host
-- ✅ Claims can only be seen by owner and listing host
-- ✅ Organizers verified by role check before creating listings
-- ✅ Students verified by role check before claiming

-- =============================================================================
-- TROUBLESHOOTING
-- =============================================================================

-- If you get "new row violates row-level security policy":
-- 1. Check auth.uid() matches the user_id you're trying to insert
-- 2. Check the user has the correct role (student/organizer)
-- 3. Verify JWT is being passed correctly from the app

-- To temporarily disable RLS (development only):
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ⚠️ NEVER do this in production!
