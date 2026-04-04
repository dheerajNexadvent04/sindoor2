import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('religions')
            .select('id, name')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

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
