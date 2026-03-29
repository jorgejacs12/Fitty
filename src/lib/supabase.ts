import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wedsktvyzprxumrorjhf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZHNrdHZ5enByeHVtcm9yamhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDQyNzMsImV4cCI6MjA5MDM4MDI3M30.P8AsceEJ9G8N5wdMc7QW_mwEttjrFFlTXv6jrYTXueo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
