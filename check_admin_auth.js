require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAdminExists() {
    console.log("Checking if a profile exists for admin@sindoor.com...");
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name')
        .eq('email', 'admin@sindoor.com')
        .single();
    
    if (error) {
        console.log("No profile found for admin@sindoor.com (Error: " + error.message + ")");
        console.log("This means the user probably does not exist in Auth either.");
    } else {
        console.log("Found profile:", data);
    }
}
checkAdminExists();
