const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAdmins() {
    console.log('Checking profiles for admin@sindoor.com...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name')
        .eq('email', 'admin@sindoor.com')
        .maybeSingle();
        
    if (data) {
        console.log('Found profile for admin@sindoor.com! ID:', data.id);
    } else {
        console.log('No profile found for admin@sindoor.com.');
    }
}

listAdmins();
