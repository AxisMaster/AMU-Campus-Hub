import { NextResponse } from 'next/server';
import { supabase, createAdminClient } from '@/lib/supabase';
import { Novu } from '@novu/node';

const novu = new Novu(process.env.NOVU_API_KEY || '');

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Parse options
        let testMode = false;
        try {
            const body = await request.clone().json();
            testMode = body.testMode === true;
        } catch (e) { }

        // 1. Fetch pending notifications
        let query = adminClient
            .from('saved_events')
            .select(`
                user_id,
                event_id,
                reminder_24h_sent,
                reminder_1h_sent,
                events!inner (
                    title,
                    date,
                    time,
                    venue
                )
            `);

        if (testMode) {
            query = query.eq('user_id', user.id); // Only admin's saved events
        } else {
            query = query.or('reminder_24h_sent.eq.false,reminder_1h_sent.eq.false');
        }

        const { data: pending, error: dbError } = await query;

        if (dbError) throw dbError;
        if (!pending || pending.length === 0) {
            return NextResponse.json({ message: 'No pending reminders', processed: 0 });
        }

        const now = new Date();
        const results = { sent24h: 0, sent1h: 0, errors: 0 };
        const updates: any[] = [];

        for (const item of pending) {
            const event: any = item.events;
            // Parse event date and time
            const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}:00`);
            const diffMs = eventDateTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            let changed = false;
            let trigger24 = false;
            let trigger1 = false;

            if (testMode) {
                // In test mode, force trigger a 1h simulated alert regardless of event time
                trigger1 = true;
                changed = true;
            } else {
                // 24 Hour Window (23h to 25h)
                if (!item.reminder_24h_sent && diffHours > 23 && diffHours <= 25) {
                    trigger24 = true;
                    changed = true;
                }

                // 1 Hour Window (0h to 1.5h)
                if (!item.reminder_1h_sent && diffHours > 0 && diffHours <= 1.5) {
                    trigger1 = true;
                    changed = true;
                }
            }

            if (changed) {
                try {
                    if (trigger24 || trigger1) {
                        await novu.trigger('event-reminder', {
                            to: { subscriberId: item.user_id },
                            payload: {
                                eventName: event.title,
                                startTime: event.time || 'TBA',
                                venue: event.venue,
                                eventId: item.event_id,
                                type: trigger24 ? '24h' : '1h',
                                title: trigger24
                                    ? `Still planning to go? 📅`
                                    : `Starting in 1 hour! ⏰`,
                                body: trigger24
                                    ? `"${event.title}" starts tomorrow at ${event.time || 'TBA'} in ${event.venue}.`
                                    : `Get ready! "${event.title}" is about to kick off at ${event.venue}.`
                            }
                        });

                        if (trigger24) results.sent24h++;
                        if (trigger1) results.sent1h++;

                        updates.push({
                            user_id: item.user_id,
                            event_id: item.event_id,
                            reminder_24h_sent: trigger24 ? true : item.reminder_24h_sent,
                            reminder_1h_sent: trigger1 ? true : item.reminder_1h_sent
                        });
                    }
                } catch (err) {
                    console.error('Trigger Error for user', item.user_id, err);
                    results.errors++;
                }
            }
        }

        // Batch update database flags
        if (updates.length > 0) {
            const { error: updateError } = await adminClient
                .from('saved_events')
                .upsert(updates, { onConflict: 'user_id,event_id' });

            if (updateError) console.error('Flag Update Error:', updateError);
        }

        return NextResponse.json({
            message: 'Reminder sweep complete',
            results,
            processed: updates.length
        });

    } catch (error: any) {
        console.error('Reminder Engine Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
