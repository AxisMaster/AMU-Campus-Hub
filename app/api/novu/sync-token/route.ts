import { NextResponse } from 'next/server';
import { Novu, PushProviderIdEnum } from '@novu/node';

const novu = new Novu(process.env.NOVU_API_KEY || '');

export async function POST(request: Request) {
    try {
        const { subscriberId, deviceToken, action = 'add' } = await request.json();
        console.log(`Novu Token Sync [${action}]:`, { subscriberId, deviceToken: deviceToken ? 'Yes' : 'No' });

        if (!subscriberId) {
            return NextResponse.json({ error: 'Missing subscriberId' }, { status: 400 });
        }

        if (action === 'remove') {
            // Remove credentials for FCM
            await novu.subscribers.deleteCredentials(subscriberId, PushProviderIdEnum.FCM);

            // Optionally remove from topics
            try {
                await novu.topics.removeSubscribers('all-campus-events', {
                    subscribers: [subscriberId],
                });
            } catch (e) {
                // Topic error is non-blocking
            }

            return NextResponse.json({ success: true, message: 'Unsubscribed' });
        }

        if (!deviceToken) {
            return NextResponse.json({ error: 'Missing deviceToken' }, { status: 400 });
        }

        // Update subscriber credentials for FCM
        await novu.subscribers.setCredentials(subscriberId, PushProviderIdEnum.FCM, {
            deviceTokens: [deviceToken],
        });

        // Auto-subscribe to the campus-wide events topic
        try {
            const topicKey = 'all-campus-events';
            // First ensure the topic exists (upsert behavior)
            try {
                await novu.topics.create({
                    key: topicKey,
                    name: 'All Campus Events'
                });
            } catch (e) {
                // Topic likely already exists, ignore
            }

            await novu.topics.addSubscribers(topicKey, {
                subscribers: [subscriberId],
            });
            console.log(`Subscribed ${subscriberId} to topic: ${topicKey}`);
        } catch (topicError) {
            console.error('Failed to subscribe to topic:', topicError);
            // Non-blocking for the main token sync
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error syncing Novu token:', error);
        return NextResponse.json({ error: error.message || 'Failed to sync token' }, { status: 500 });
    }
}
