-- Migration to add gender and birth_date if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- Update existing known users with sample data if null
UPDATE profiles SET gender = 'Masculino', birth_date = '2000-01-01' WHERE username = 'Ricardo FPS' AND (gender IS NULL OR birth_date IS NULL);
UPDATE profiles SET gender = 'Feminino', birth_date = '1998-05-15' WHERE username = 'Beatriz RPG' AND (gender IS NULL OR birth_date IS NULL);

-- Fallback for any other users
UPDATE profiles SET gender = 'Outro', birth_date = '2000-01-01' WHERE gender IS NULL;
