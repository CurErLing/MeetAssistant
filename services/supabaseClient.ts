
import { createClient } from '@supabase/supabase-js';

// 使用提供的 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://vgtsmwkqctlrhiatngbt.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_xaIHO0xvY27uVEWyRkUB5Q_UriRP48e';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing. The app will not persist data to the cloud.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
