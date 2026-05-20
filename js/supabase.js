// ⚠️ Reemplazá estos valores con los de tu proyecto en supabase.com
// Los encontrás en: Settings → API
const SUPABASE_URL = 'https://iohwgqjzqbnfyyzaehrs.supabase.co/rest/v1/'
const SUPABASE_ANON_KEY = 'sb_publishable_jAXnBsdmhO4swuPkTKBJGg_789U-9jB'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
