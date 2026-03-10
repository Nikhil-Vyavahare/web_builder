// js/supabase-client.js
const SUPABASE_URL = 'https://ujbuvaufduyodpappnbn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYnV2YXVmZHV5b2RwYXBwbmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDU0NTEsImV4cCI6MjA4Njk4MTQ1MX0.hZuz-P3d62lFjG4hBOHWCBwxHWn8rBy9Q0C-toyFbP4';

// We export the constant so app.js can import it successfully
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);