-- Add CEP column to profiles to persist postal code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep text;
