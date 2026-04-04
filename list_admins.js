require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listAdmins() {
    console.log("Fetching all profiles...");
    const { data: profiles } = await supabase.from('profiles').select('id, email, first_name');
    
    console.log("Fetching all admin_users...");
    const { data: admins, error } = await supabase.from('admin_users').select('*');
    if (error) {
        console.error("Error fetching admins:", error.message);
        return;
    }
    
    console.log("\nADMIN USERS:");
    admins.forEach(a => {
        const p = profiles?.find(prof => prof.id === a.user_id);
        console.log(`- Email: ${p?.email || 'Unknown'}, ID: ${a.user_id}, Role: ${a.role}, Active: ${a.is_active}`);
    });
}
listAdmins();
