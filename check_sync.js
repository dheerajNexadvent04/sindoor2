require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSync() {
    console.log("Checking profiles table...");
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

    if (error) {
        console.error("Error fetching profiles:", error.message);
        return;
    }

    console.log(`Total profiles found: ${count}`);
    
    if (data.length > 0) {
        console.log("\nRecent profiles:");
        data.slice(-5).forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, Status: ${p.status}, Created: ${p.created_at || 'N/A'}`);
        });
    }

    const { data: pending, count: pCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    
    console.log(`Pending profiles: ${pCount}`);

    const { data: approved, count: aCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
    
    console.log(`Approved profiles: ${aCount}`);
}

checkSync();
