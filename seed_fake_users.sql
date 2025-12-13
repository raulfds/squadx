-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- Function to create a user safely
create or replace function create_fake_user(
    p_email text,
    p_password text,
    p_username text,
    p_bio text,
    p_city text,
    p_state text,
    p_avatar_url text,
    p_discord text default null,
    p_psn text default null,
    p_xbox text default null,
    p_steam text default null
) returns void as $$
declare
    v_user_id uuid;
begin
    -- 1. Check if user exists in auth.users
    select id into v_user_id from auth.users where email = p_email;
    
    -- 2. If not, insert into auth.users
    if v_user_id is null then
        v_user_id := gen_random_uuid();
        
        insert into auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) values (
            v_user_id,
            '00000000-0000-0000-0000-000000000000', -- Default instance_id
            'authenticated',
            'authenticated',
            p_email,
            crypt(p_password, gen_salt('bf')), -- Hash password
            now(), -- Auto confirm email
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            now(),
            now()
        );
        
        -- Insert identity (needed for some auth flows)
        insert into auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) values (
            v_user_id,
            v_user_id,
            format('{"sub": "%s", "email": "%s"}', v_user_id, p_email)::jsonb,
            'email',
            v_user_id, -- provider_id
            now(),
            now(),
            now()
        );
    end if;

    -- 3. Insert or Update public.profile
    insert into public.profiles (
        id,
        username,
        bio,
        city,
        state,
        avatar_url,
        discord_handle,
        psn_handle,
        xbox_handle,
        steam_handle,
        updated_at
    ) values (
        v_user_id,
        p_username,
        p_bio,
        p_city,
        p_state,
        p_avatar_url,
        p_discord,
        p_psn,
        p_xbox,
        p_steam,
        now()
    )
    on conflict (id) do update set
        username = excluded.username,
        bio = excluded.bio,
        city = excluded.city,
        state = excluded.state,
        avatar_url = excluded.avatar_url,
        discord_handle = excluded.discord_handle,
        psn_handle = excluded.psn_handle,
        xbox_handle = excluded.xbox_handle,
        steam_handle = excluded.steam_handle;

end;
$$ language plpgsql security definer;

-- SEED USERS
-- Password for all is '123456'

-- 1. Dev-Marcos (Male, RPG/Action)
select create_fake_user(
    'marcos@dev.com',
    '123456',
    'Dev-Marcos',
    'Curto RPGs de mundo aberto e jogos de ação. Busco duo para Elden Ring e coop em geral. Jogo sério mas sem rage.',
    'São Paulo',
    'SP',
    'https://i.pravatar.cc/300?u=marcos',
    'marcos_dev#1234',
    'MarcosGamer88',
    null,
    'steam_marcos'
);

-- 2. Dev-Julia (Female, FPS/Competitivo)
select create_fake_user(
    'julia@dev.com',
    '123456',
    'Dev-Julia',
    'Main Valorant e Overwatch. Jogo pra ganhar, ranking Imortal. Se não for pra tryhardar nem chama. Comunicação é tudo.',
    'Rio de Janeiro',
    'RJ',
    'https://i.pravatar.cc/300?u=julia',
    'juju_vali#9999',
    null,
    null,
    null
);

-- 3. Dev-Lucas (Male, Strategy/Indie)
select create_fake_user(
    'lucas@dev.com',
    '123456',
    'Dev-Lucas',
    'Fã de jogos indie e estratégia. Civ VI, Stardew Valley e Factorio. Gosto de conversar sobre game design.',
    'Curitiba',
    'PR',
    'https://i.pravatar.cc/300?u=lucas',
    'lucas_strat',
    null,
    'LucasX',
    'steam_id_lucas'
);

-- 4. Dev-Ana (Female, Cozy/Sim)
select create_fake_user(
    'ana@dev.com',
    '123456',
    'Dev-Ana',
    'Animal Crossing e The Sims são minha vida. Ocasionalmente um Mario Kart. Jogo pra relaxar no fim do dia.',
    'Belo Horizonte',
    'MG',
    'https://i.pravatar.cc/300?u=ana',
    null,
    null,
    'AnaCozy',
    null
);
