import { createClient } from '@supabase/supabase-js';

// Fallbacks are provided so next build compiles cleanly when env keys are not yet configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Using placeholder keys for build-time compilation.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
