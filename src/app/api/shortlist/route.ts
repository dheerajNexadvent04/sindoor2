import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const addToShortlistSchema = z.object({
    profileId: z.string().uuid(),
    notes: z.string().optional()
});

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: shorlistData, error: shortlistError } = await supabase
            .from('shortlist')
            .select(`
            id,
            created_at,
            shortlisted_profile:shortlisted_profile_id (
                id, first_name, last_name, gender, date_of_birth, 
                religion_name,
                caste_name,
                photo_url,
                photos
            )
        `)
            .eq('user_id', session.user.id);

        if (shortlistError) {
            throw shortlistError;
        }

        return NextResponse.json({
            success: true,
            data: shorlistData
        });

    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = addToShortlistSchema.parse(body);

        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('shortlist')
            .insert({
                user_id: session.user.id,
                shortlisted_profile_id: validatedData.profileId,
                notes: validatedData.notes
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ success: false, error: 'Already shortlisted' }, { status: 400 });
            }
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
