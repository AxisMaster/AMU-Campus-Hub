import { NextResponse } from 'next/server';
import { deleteEvent } from '@/lib/data';
import { Novu } from '@novu/node';

const novu = new Novu(process.env.NOVU_API_KEY || '');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedEvent = await deleteEvent(id);

    // Trigger Novu Notification for rejection
    if (deletedEvent && (deletedEvent.userId || deletedEvent.createdBy)) {
      try {
        await novu.trigger('event-rejected', {
          to: {
            subscriberId: deletedEvent.userId || deletedEvent.createdBy,
            email: deletedEvent.createdBy
          },
          payload: {
            eventTitle: deletedEvent.title,
            reason: "Does not meet community guidelines", // Default reason
            url: '/events' // Redirect to events list or past events
          },
          overrides: {
            fcm: {
              data: {
                url: '/events'
              }
            }
          }
        });
      } catch (novuError) {
        console.error('Failed to trigger Novu rejection notification:', novuError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting event:', error);
    return NextResponse.json({ error: error.message || 'Failed to reject event' }, { status: 500 });
  }
}
