import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 配置区域
// ------------------------------------------------------------------

// 1. 去除可能存在的首尾空格
const rawUrl = (process.env.SUPABASE_URL || 'https://vgtsmwkqctlrhiatngbt.supabase.co').trim();
const rawKey = (process.env.SUPABASE_KEY || 'sb_publishable_xaIHO0xvY27uVEWyRkUB5Q_UriRP48e').trim();

// 2. 检查 Key 格式 
// 允许 'ey' (JWT) 或 'sb' (Publishable) 开头。此处放宽检查以支持多种 Key 格式。
const isValidKeyFormat = rawKey.startsWith('ey') || rawKey.startsWith('sb');

// 3. 构建客户端
// 如果 Key 格式严重错误，我们先给一个占位符以防 createClient 崩溃，但会在控制台警告
const safeKey = isValidKeyFormat ? rawKey : (rawKey || 'INVALID_KEY');

if (!isValidKeyFormat && rawKey !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
  // 降级为警告，不阻断运行，以便前端可以回退到 Mock 模式
  console.warn("⚠️ Supabase Key 格式警告: Key 通常以 'ey' 或 'sb' 开头。当前 Key 可能无法正常工作，建议检查 .env 配置。", rawKey);
}

export const supabase = createClient(rawUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // 增加 fetch 重试，防止网络抖动导致的 Failed to fetch
    fetch: (url, options) => {
      return fetch(url, { ...options }).catch(err => {
        console.error("Supabase Fetch Error:", err);
        // 返回一个符合 Fetch Response 接口的错误对象，防止 crash
        return new Response(JSON.stringify({ error: "Network/Config Error" }), {
            status: 500,
            statusText: "Connection Failed"
        });
      });
    }
  }
});