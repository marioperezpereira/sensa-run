
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://kyjvfgbaidcotatpndpw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5anZmZ2JhaWRjb3RhdHBuZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTMyMDYsImV4cCI6MjA1NzAyOTIwNn0.96KP_zfQiKZz5Ce2-lfOcMTzuYaI52bqHti2Ay84cvI';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
