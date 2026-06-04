import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  // Vite requires static analysis for import.meta.env, so dynamic key access (env[name]) fails in production builds.
  if (name === 'VITE_SUPABASE_URL') {
    return import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined);
  }
  if (name === 'VITE_SUPABASE_ANON_KEY') {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined);
  }
  return undefined;
};

let supabaseInstance: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  console.log('Supabase Initializing with URL:', supabaseUrl ? 'Found' : 'Missing');

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    throw new Error(`Supabase 설정이 완료되지 않았습니다. (현재 감지된 URL: "${supabaseUrl || '없음'}", KEY: "${supabaseAnonKey ? '감지됨' : '없음'}") Vercel의 Environment Variables에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 올바르게 등록되어 있는지 확인해 주세요.`);
  }

  // URL 유효성 간단 체크 (공백 제거 등)
  const cleanUrl = supabaseUrl.trim().replace(/\/$/, '');
  const cleanKey = supabaseAnonKey.trim();

  supabaseInstance = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  
  return supabaseInstance;
};

// 프록시를 사용하여 기존의 'supabase.from()' 스타일 코드를 그대로 유지하면서 지연 초기화 수행
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    try {
      const client = getSupabase();
      const value = (client as any)[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    } catch (e) {
      // 초기화 실패 시 에러를 던져서 호출 부의 try-catch에서 잡히도록 함
      console.error('Supabase initialization failed:', e);
      throw e;
    }
  }
});
