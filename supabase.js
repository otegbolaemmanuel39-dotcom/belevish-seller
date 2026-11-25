// Paste your project values from Supabase > Project Settings > API
const SUPABASE_URL = "https://tlokyujizwmygwdujfkq.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_7jqsWclATHlAl9ROxLsckw_grGxr5Q-";
var sb = (window.supabase && !SUPABASE_URL.includes("YOUR-"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Paste your Cloudflare store link here so the "View store" button works
const STORE_URL = "https://YOUR-STORE.pages.dev";
