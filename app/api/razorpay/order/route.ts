import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function POST(req: Request) {
    try {
        const { amount, currency = 'INR', receipt } = await req.json();

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in subunits (paise)
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Razorpay Order Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
