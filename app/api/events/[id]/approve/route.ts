import { NextResponse } from 'next/server';
import { approveEvent } from '@/lib/data';
import { Novu, TriggerRecipientsTypeEnum } from '@novu/node';

const novu = new Novu(process.env.NOVU_API_KEY || '');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedEvent = await approveEvent(id);

    // Trigger Novu Notification
    if (updatedEvent && (updatedEvent.userId || updatedEvent.createdBy)) {
      try {
        await novu.trigger('event-approved', {
          to: {
            subscriberId: updatedEvent.userId || updatedEvent.createdBy,
            email: updatedEvent.createdBy
          },
          payload: {
            eventTitle: updatedEvent.title,
            venue: updatedEvent.venue,
            date: updatedEvent.date,
            url: `/events/${updatedEvent.id}`
          },
          overrides: {
            fcm: {
              data: {
                url: `/events/${updatedEvent.id}`
              }
            }
          }
        });
      } catch (novuError) {
        console.error('Failed to trigger Novu notification:', novuError);
      }

      // 2. Broadcast to ALL users (Topic)
      try {
        await novu.trigger('new-event-live', {
          to: [{ type: TriggerRecipientsTypeEnum.TOPIC, topicKey: 'all-campus-events' }],
          payload: {
            eventTitle: updatedEvent.title,
            organizer: updatedEvent.organizer,
            venue: updatedEvent.venue,
            url: `/events/${updatedEvent.id}`
          },
          overrides: {
            fcm: {
              data: {
                url: `/events/${updatedEvent.id}`
              }
            }
          }
        });
        console.log('Broadcast notification triggered for topic: all-campus-events');
      } catch (broadcastError) {
        console.error('Failed to broadcast new event notification:', broadcastError);
      }
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    console.error('Error approving event:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve event' }, { status: 500 });
  }
}
