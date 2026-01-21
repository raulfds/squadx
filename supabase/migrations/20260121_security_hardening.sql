-- Security Hardening Migration
-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- 3. Swipes Policies
DROP POLICY IF EXISTS "Users can insert own swipes" ON public.swipes;
CREATE POLICY "Users can insert own swipes" 
ON public.swipes FOR INSERT 
WITH CHECK ( auth.uid() = swiper_id );

DROP POLICY IF EXISTS "Users can view own swipes" ON public.swipes;
CREATE POLICY "Users can view own swipes" 
ON public.swipes FOR SELECT 
USING ( auth.uid() = swiper_id OR auth.uid() = swiped_id );

-- 4. User Favorites Policies
DROP POLICY IF EXISTS "Favorites are viewable by everyone" ON public.user_favorites;
CREATE POLICY "Favorites are viewable by everyone" 
ON public.user_favorites FOR SELECT 
USING ( true );

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" 
ON public.user_favorites FOR ALL 
USING ( auth.uid() = user_id );

-- 5. Helper function to check availability (Anti-bot / throttling placeholder)
-- This is a placeholder for future implementation of stricter logic
