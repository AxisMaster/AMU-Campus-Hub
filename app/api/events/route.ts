import { NextResponse } from 'next/server';
import { getEvents, addEvent, cleanupExpiredEvents } from '@/lib/data';
import { Event } from '@/types';

export async function GET() {
  await cleanupExpiredEvents();
  const events = await getEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newEvent: Event = {
      ...body,
      id: crypto.randomUUID(),
      isApproved: false, // Default to unapproved
    };

    await addEvent(newEvent);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json({ error: error.message || 'Failed to add event' }, { status: 500 });
  }
}
