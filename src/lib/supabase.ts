import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log more helpful error if keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase configuration is missing. \n' +
    'If you are on Netlify, ensure you have set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Site Settings > Environment Variables.'
  );
}

// Initialize with fallbacks to prevent top-level crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
