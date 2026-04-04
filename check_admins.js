const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAdmins() {
    console.log("Fetching admin users...");
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, email, first_name');
    if (pError) console.error(pError);

    const { data: admins, error: aError } = await supabase.from('admin_users').select('*');
    if (aError) {
        console.error("Error fetching admins (likely RLS):", aError.message);
        return;
    }
    
    console.log(`Found ${admins.length} admin users.`);
    admins.forEach(a => {
        const p = profiles?.find(prof => prof.id === a.user_id);
        console.log(`- User ID: ${a.user_id}, Email: ${p?.email || 'Unknown'}, Role: ${a.role}, Active: ${a.is_active}`);
    });
}

checkAdmins();
