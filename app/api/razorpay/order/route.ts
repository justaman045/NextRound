import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
    try {
        const { amount, userId, billingCycle = 'monthly', currency = 'INR', receipt } = await req.json();

        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        console.log(`[Razorpay Order] Initializing with KeyID: ${key_id?.substring(0, 12)}... and Secret starting with: ${key_secret?.substring(0, 3)}...`);

        if (!key_id || !key_secret || key_id.includes('YourKeyIdHere')) {
            console.error('Razorpay keys missing or still using placeholders');
            return NextResponse.json({ error: 'Razorpay configuration error: Valid Keys not found in environment.' }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in subunits (paise)
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: {
                userId,
                billingCycle
            }
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Razorpay Order Error Details:', error);
        // Razorpay SDK errors often nest the descriptive error inside an 'error' property
        const description = error.error?.description || error.description || error.metadata || 'Unknown error';
        return NextResponse.json({
            error: error.message || 'Failed to create order',
            details: description
        }, { status: 500 });
    }
}
