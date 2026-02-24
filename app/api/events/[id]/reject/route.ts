import { NextResponse } from 'next/server';
import { deleteEvent } from '@/lib/data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting event:', error);
    return NextResponse.json({ error: error.message || 'Failed to reject event' }, { status: 500 });
  }
}
