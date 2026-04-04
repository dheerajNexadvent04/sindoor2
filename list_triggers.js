require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listTriggers() {
    console.log("Attempting to list triggers via information_schema (might fail if no permission)...");
    
    // We try to use a RPC if possible, or just a trick
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    // Trick to get schema info: try to select from pg_trigger
    const { error: e2 } = await supabase.from('pg_trigger').select('*').limit(1);
    console.log("Can see pg_trigger:", !e2);
    
    if (e2) {
        console.log("Anon user cannot see triggers. Trying another way...");
    }
}
listTriggers();
