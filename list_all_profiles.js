require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAll() {
    console.log("Fetching ALL profiles...");
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error:", error.message);
        return;
    }
    console.log(`Found ${data.length} profiles.`);
    data.forEach(p => {
        console.log(`[${p.status}] ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, Email: ${p.email}`);
    });

    const { data: authUsers, error: authError } = await supabase.rpc('get_users_count'); // If exists
    if (authError) console.log("Can't check auth.users count directly without service role.");
}

checkAll();
