import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log more helpful error if keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CRITICAL: Supabase configuration is missing! \n' +
    '1. Go to Netlify Dashboard > Site Settings > Environment Variables \n' +
    '2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY \n' +
    '3. Trigger a new deploy with "Clear cache"'
  );
} else if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('CRITICAL: VITE_SUPABASE_ANON_KEY does not look like a valid Supabase Anon key. It should start with "eyJ".');
}

// Initialize with fallbacks to prevent top-level crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
