import { NextResponse } from 'next/server';
import { approveEvent } from '@/lib/data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await approveEvent(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error approving event:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve event' }, { status: 500 });
  }
}
