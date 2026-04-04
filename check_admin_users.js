const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
    console.log('Checking public.admin_users table...');
    const { data, error } = await supabase
        .from('admin_users')
        .select('*');
        
    if (error) {
        console.error('Error fetching admin_users:', error.message);
    } else {
        console.log('Total entries in admin_users:', data.length);
        data.forEach(admin => {
            console.log(`- Email: ${admin.email}, Role: ${admin.role}, ID: ${admin.user_id}`);
        });
    }
}

checkAdminUsers();
