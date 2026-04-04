const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogin() {
    console.log('--- Auth Diagnostic ---');
    console.log('Email: admin@sindoor.com');
    console.log('Attempting login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@sindoor.com',
        password: 'secure_admin_password_123'
    });

    if (error) {
        console.error('Login Failed:', error.message);
        if (error.message.includes('Invalid login credentials')) {
            console.log('CAUSE: Password incorrect or user does not exist.');
        }
    } else {
        console.log('Login Successful!');
        console.log('User ID:', data.user.id);
        console.log('Email Confirmed:', !!data.user.email_confirmed_at);
        
        // Check if in admin_users
        const { data: admin, error: adminErr } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
        if (adminErr || !admin) {
            console.log('Admin Record: NOT FOUND in public.admin_users.');
        } else {
            console.log('Admin Record: FOUND. Role:', admin.role);
        }
    }
}

checkLogin();
