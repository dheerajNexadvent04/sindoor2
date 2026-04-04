import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;
        const supabase = await createClient();

        await supabase.auth.getSession();

        // Determine if we are fetching own profile (allows more data) or other's (limited data)
        // Note: RLS policies in schema.sql already handle:
        // - Viewing own profile: All fields
        // - Viewing others: Only Approved profiles

        // We select public fields for display.
        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
        id,
        first_name,
        last_name,
        gender,
        date_of_birth,
        about_me,
        height,
        weight,
        marital_status,
        religion_id, religions(name),
        caste_id, castes(name),
        sub_caste_id, sub_castes(name),
        education,
        profession,
        location,
        profile_photos(id, photo_url, is_primary)
      `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: "Profile not found or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: profile
        });

    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
