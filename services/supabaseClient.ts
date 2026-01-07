
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 配置区域
// ------------------------------------------------------------------
// 注意：您提供的 Key (sb_publishable_...) 格式较为特殊。
// 如果无法登录，请确保从 Supabase 后台 -> Project Settings -> API 复制 "anon" public key (通常以 eyJ... 开头)。
// ------------------------------------------------------------------

const PROJECT_URL = process.env.SUPABASE_URL || 'https://vgtsmwkqctlrhiatngbt.supabase.co';
const ANON_KEY = process.env.SUPABASE_KEY || 'sb_publishable_xaIHO0xvY27uVEWyRkUB5Q_UriRP48e';

// ------------------------------------------------------------------

const isConfigured = 
  PROJECT_URL && 
  PROJECT_URL !== 'YOUR_SUPABASE_URL_HERE' && 
  ANON_KEY && 
  ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';

if (!isConfigured) {
  console.warn("⚠️ Supabase 配置不完整，无法保存数据。");
}

// 避免无效 URL 导致应用崩溃
const validUrl = (isConfigured && PROJECT_URL.startsWith('http'))
  ? PROJECT_URL 
  : 'https://placeholder.supabase.co';

export const supabase = createClient(validUrl, ANON_KEY);
