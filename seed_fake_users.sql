DO $$
DECLARE
  -- Generate new UUIDs for the users
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
BEGIN
  --------------------------------------------------------------------------------
  -- 1. Insert into auth.users
  -- NOTE: You must run this via the Supabase SQL Editor (Dashboard -> SQL Editor).
  -- This creates the user login. Password is 'password123'.
  --------------------------------------------------------------------------------
  
  -- User 1: Ricardo FPS
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, recovery_sent_at, last_sign_in_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    user1_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'ricardo_fps@test.com', -- UNIQUE EMAIL
    crypt('password123', gen_salt('bf')), 
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"username": "Ricardo FPS"}', 
    now(), now(), 
    '', '', '', ''
  );

  -- User 2: Beatriz RPG
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, recovery_sent_at, last_sign_in_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    user2_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'beatriz_rpg@test.com', -- UNIQUE EMAIL
    crypt('password123', gen_salt('bf')), 
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"username": "Beatriz RPG"}', 
    now(), now(), 
    '', '', '', ''
  );

  --------------------------------------------------------------------------------
  -- 2. Insert/Update Public Profiles
  -- If you have a trigger that creates profiles automatically, 
  -- the defined values here will overwrite the defaults via ON CONFLICT UPDATE.
  --------------------------------------------------------------------------------

  -- User 1 Profile
  INSERT INTO public.profiles (
    id, username, full_name, city, state, bio, avatar_url, photos, game_genres, availability, gender, birth_date
  )
  VALUES (
    user1_id,
    'Ricardo FPS',
    'Ricardo Silva',
    'São Paulo',
    'SP',
    'Focado em subir de elo no Valorant. Jogo sério, mas sem rage.',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&auto=format&fit=crop&q=60',
    ARRAY[
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&auto=format&fit=crop&q=60', 
      'https://images.unsplash.com/photo-1487309078313-fad80c3ec1e5?w=500&auto=format&fit=crop&q=60'
    ],
    ARRAY['FPS', 'Competitivo'],
    '{"Segunda": ["Noite"], "Quarta": ["Noite"], "Sábado": ["Tarde", "Noite"]}'::jsonb,
    'Masculino',
    '2000-01-01'
  ) 
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    photos = EXCLUDED.photos,
    game_genres = EXCLUDED.game_genres,
    availability = EXCLUDED.availability;

  -- User 2 Profile
  INSERT INTO public.profiles (
    id, username, full_name, city, state, bio, avatar_url, photos, game_genres, availability, gender, birth_date
  )
  VALUES (
    user2_id,
    'Beatriz RPG',
    'Beatriz Gomes',
    'Curitiba',
    'PR',
    'Amo explorar mundos abertos e fazer 100% das quests secundárias.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60',
    ARRAY[
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60', 
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=60'
    ],
    ARRAY['RPG', 'Aventura'],
    '{"Domingo": ["Manhã", "Tarde", "Noite"], "Sexta": ["Noite"]}'::jsonb,
    'Feminino',
    '1998-05-15'
  ) 
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    photos = EXCLUDED.photos,
    game_genres = EXCLUDED.game_genres,
    availability = EXCLUDED.availability;

  --------------------------------------------------------------------------------
  -- 3. Insert User Favorites (Games)
  --------------------------------------------------------------------------------

  -- User 1 Games (Valorant, CS:GO)
  INSERT INTO public.user_favorites (user_id, game_id, game_name, game_cover_url)
  VALUES 
    (user1_id, '1337', 'Valorant', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2av4.png'),
    (user1_id, '7331', 'CS:GO', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vct.png');

  -- User 2 Games (Baldur's Gate 3, Witcher 3)
  INSERT INTO public.user_favorites (user_id, game_id, game_name, game_cover_url)
  VALUES 
    (user2_id, '1111', 'Baldur''s Gate 3', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.png'),
    (user2_id, '2222', 'The Witcher 3', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.png');

END $$;
