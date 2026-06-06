/* global supabase */
/* exported db */

const SUPABASE_URL = 'https://iohwgqjzqbnfyyzaehrs.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_jAXnBsdmhO4swuPkTKBJGg_789U-9jB'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

window.db = db;
