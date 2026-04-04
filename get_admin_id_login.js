require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function getAdminID() {
    console.log("Attempting to login to get ID...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@sindoor.com',
        password: 'secure_admin_password_123'
    });
    
    if (error) {
        console.error("Login failed:", error.message);
    } else {
        console.log("SUCCESS! ADMIN ID:", data.user.id);
    }
}
getAdminID();
