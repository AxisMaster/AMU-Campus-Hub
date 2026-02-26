import { NextResponse } from 'next/server';
import { deepStorageCleanup } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        // Check if user is admin - Fetch from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const result = await deepStorageCleanup();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Admin Cleanup Error:', error);
        return NextResponse.json({ error: error.message || 'Cleanup failed' }, { status: 500 });
    }
}
