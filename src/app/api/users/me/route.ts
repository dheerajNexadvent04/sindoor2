import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for Profile Update
const profileUpdateSchema = z.object({
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    date_of_birth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    religion_id: z.string().uuid().optional(),
    caste_id: z.string().uuid().optional(),
    sub_caste_id: z.string().uuid().optional().nullable(),
    marital_status: z.enum(['never_married', 'divorced', 'widowed', 'separated']).optional(),
    height: z.number().optional(),
    weight: z.number().optional(),
    complexion: z.enum(['very_fair', 'fair', 'wheatish', 'dark']).optional().nullable(),
    body_type: z.enum(['slim', 'athletic', 'average', 'heavy']).optional().nullable(),
    blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
    mother_tongue: z.string().optional(),
    education: z.any().optional(),
    profession: z.any().optional(),
    location: z.any().optional(),
    contact_info: z.any().optional(),
    family_details: z.any().optional(),
    partner_preferences: z.any().optional(),
    about_me: z.string().optional(),
    horoscope: z.any().optional(),
});

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
        *,
        religions(name),
        castes(name),
        sub_castes(name),
        profile_photos(id, photo_url, is_primary)
      `)
            .eq('id', user.id)
            .single();

        if (error) {
            throw error;
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

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = profileUpdateSchema.parse(body);

        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...validatedData,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
