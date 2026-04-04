import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const supabase = await createClient();

        // Authentication check
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Filter Parameters
        const gender = searchParams.get('gender');
        const ageMin = searchParams.get('ageMin');
        const ageMax = searchParams.get('ageMax');
        const religionId = searchParams.get('religionId');
        const casteId = searchParams.get('casteId');
        // const location = searchParams.get('location'); // City or State

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Start building query
        let query = supabase
            .from('profiles')
            .select(`
        id,
        first_name,
        last_name,
        gender,
        date_of_birth,
        height,
        education,
        profession,
        location,
        religion_id, religions(name),
        caste_id, castes(name),
        profile_photos(photo_url, is_primary)
      `, { count: 'exact' })
            .eq('status', 'approved') // Only show approved profiles
            .neq('id', session.user.id); // Don't show self

        // Apply Filters
        if (gender) {
            query = query.eq('gender', gender);
        }

        if (religionId) {
            query = query.eq('religion_id', religionId);
        }

        if (casteId) {
            query = query.eq('caste_id', casteId);
        }

        // Age Filter (Calculate Date Range from Age)
        // Age 25 => Born <= Today - 25 years
        // Age 30 => Born >= Today - 31 years (roughly)

        const today = new Date();

        if (ageMin) {
            const maxBirthDate = new Date(today.getFullYear() - parseInt(ageMin), today.getMonth(), today.getDate());
            query = query.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0]);
        }

        if (ageMax) {
            const minBirthDate = new Date(today.getFullYear() - parseInt(ageMax) - 1, today.getMonth(), today.getDate());
            query = query.gte('date_of_birth', minBirthDate.toISOString().split('T')[0]);
        }

        // Location Filter (JSONB contains query)
        // if (location) {
        //   query = query.contains('location', { city: location }); 
        //   // Or use text search if generic
        // }

        // Execute Query with Pagination
        const { data, error, count } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: count ? Math.ceil(count / limit) : 0
            }
        });

    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
