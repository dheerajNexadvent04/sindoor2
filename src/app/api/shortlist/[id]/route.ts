import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const profileIdToRemove = params.id;
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('shortlist')
            .delete()
            .eq('user_id', session.user.id)
            .eq('shortlisted_profile_id', profileIdToRemove);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Removed from shortlist'
        });

    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
