import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
        }

        // Verify Signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            logger.error('[Razorpay Webhook] Invalid Signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        logger.log(`Received event: ${event.event}`);

        // Handle specific events
        if (event.event === 'order.paid' || event.event === 'payment.captured') {
            const data = event.payload.payment.entity;
            const orderId = data.order_id;
            const paymentId = data.id;
            
            // Extract metadata from notes
            const notes = data.notes || {};
            const userId = notes.userId;
            const billingCycle = notes.billingCycle || 'monthly';

            if (!userId) {
                console.error('[Razorpay Webhook] No userId found in notes');
                return NextResponse.json({ error: 'No userId found' }, { status: 400 });
            }

            logger.log(`Upgrading user ${userId} to PRO (${billingCycle})`);

            // Update Firestore using Admin SDK
            const subRef = adminDb.collection('users').doc(userId).collection('subscription').doc('details');
            
            await subRef.set({
                plan: 'pro',
                status: 'active',
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                billingCycle: billingCycle,
                currentPeriodEnd: new Date(Date.now() + (billingCycle === 'semiannual' ? 180 : 30) * 24 * 60 * 60 * 1000).toISOString(),
                usage: {
                    resumesGenerated: 0, // Reset or keep? Usually we keep usage but update limit
                    limit: 99999 // Pro limit
                },
                updatedAt: new Date().toISOString()
            }, { merge: true });

            logger.log(`Successfully updated subscription for ${userId}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Webhook Error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
