const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAll() {
    console.log("Fetching ALL profiles...");
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        fs.writeFileSync('debug_output.json', JSON.stringify({ error: error.message }));
        return;
    }
    fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
    console.log(`Found ${data.length} profiles. Saved to debug_output.json`);
}

checkAll();
