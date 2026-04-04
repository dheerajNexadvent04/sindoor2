require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("Inspecting profiles table columns...");
    // We can use a query that intentionally fails to see column names or use a metadata query if supported
    // But since we are on anon, we can't see pg_catalog easily.
    // Let's try to select everything from a specific row if possible.

    // Specific checks for reported missing fields
    const missingFields = ['profile_for', 'looking_for', 'blood_group', 'body_type'];
    for (const field of missingFields) {
        try {
            const { error } = await supabase.from('profiles').select(field).limit(1);
            console.log(`${field} exists:`, !error);
        } catch (e) {
            console.log(`${field} check failed`);
        }
    }
    // Check for photos column
    const { data: d2, error: e2 } = await supabase.from('profiles').select('photos').limit(1);
    console.log("photos exists:", !e2);

    // Check for photo_url column
    const { data: d3, error: e3 } = await supabase.from('profiles').select('photo_url').limit(1);
    console.log("photo_url exists:", !e3);

    // List all columns by trying to select a non-existent column and seeing the error message (trick)
    const { error: trickError } = await supabase.from('profiles').select('non_existent_column_123').limit(1);
    console.log("Column inspection trick output:", trickError?.message);
}

inspect();
