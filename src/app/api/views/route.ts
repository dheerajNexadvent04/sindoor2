import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type ViewerRelation = { id: string | null } | { id: string | null }[] | null;

const viewProfileSchema = z.object({
    viewedProfileId: z.string().uuid()
});

const getViewerProfileId = (viewerProfile: ViewerRelation) => {
    if (Array.isArray(viewerProfile)) {
        return viewerProfile[0]?.id ?? null;
    }

    return viewerProfile?.id ?? null;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { viewedProfileId } = viewProfileSchema.parse(body);

        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.id === viewedProfileId) {
            return NextResponse.json({ success: true, ignored: true });
        }

        const { error } = await supabase
            .from('profile_views')
            .insert({
                viewer_id: session.user.id,
                viewed_profile_id: viewedProfileId
            });

        if (error) {
            console.error("View Error", error);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (type === 'by_me') {
            const { data, error } = await supabase
                .from('profile_views')
                .select(`
                    viewed_at,
                    viewed_profile:viewed_profile_id (
                        id, first_name, last_name, gender, date_of_birth, photo_url, photos
                    )
                `)
                .eq('viewer_id', session.user.id)
                .order('viewed_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        const { data, error } = await supabase
            .from('profile_views')
            .select(`
                viewed_at,
                viewer_profile:viewer_id (
                    id
                )
            `)
            .eq('viewed_profile_id', session.user.id)
            .order('viewed_at', { ascending: false });

        if (error) throw error;

        const viewerIds = (data ?? [])
            .map((item) => getViewerProfileId(item.viewer_profile as ViewerRelation))
            .filter((id): id is string => Boolean(id));

        if (viewerIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const { data: viewerProfiles, error: viewerProfilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, gender, date_of_birth, photo_url, photos')
            .in('id', viewerIds);

        if (viewerProfilesError) throw viewerProfilesError;

        const profileMap = new Map((viewerProfiles ?? []).map((profile) => [profile.id, profile]));

        return NextResponse.json({
            success: true,
            data: (data ?? []).map((item) => ({
                viewed_at: item.viewed_at,
                viewer_profile: (() => {
                    const viewerId = getViewerProfileId(item.viewer_profile as ViewerRelation);
                    return viewerId ? profileMap.get(viewerId) ?? null : null;
                })(),
            })),
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
