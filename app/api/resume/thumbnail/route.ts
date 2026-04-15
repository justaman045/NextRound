import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { adminStorage, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { userId, resumeId } = await req.json();

        if (!userId || !resumeId) {
            return NextResponse.json({ error: 'Missing userId or resumeId' }, { status: 400 });
        }

        // 1. Launch Browser
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Use the internal preview URL
        // In local dev, it's localhost:3000. In production, we need a base URL.
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const previewUrl = `${baseUrl}/preview/${userId}/${resumeId}`;

        console.log(`[Thumbnail] Generating for ${previewUrl}`);

        await page.setViewport({ width: 800, height: 1100, deviceScaleFactor: 2 });
        await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // 2. Take Screenshot as Buffer
        const buffer = await page.screenshot({ type: 'png', fullPage: false });
        await browser.close();

        // 3. Upload to Firebase Storage via Admin SDK
        const bucket = adminStorage.bucket();
        const fileName = `thumbnails/${userId}/${resumeId}.png`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: { contentType: 'image/png' },
            public: true,
        });

        // Get the Public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // 4. Update Resume in Firestore
        await adminDb
            .collection('users')
            .doc(userId)
            .collection('resumes')
            .doc(resumeId)
            .update({ thumbnailUrl: publicUrl });

        console.log(`[Thumbnail] Successfully generated and uploaded: ${publicUrl}`);

        return NextResponse.json({ success: true, thumbnailUrl: publicUrl });

    } catch (error: any) {
        console.error('[Thumbnail Generation Error]:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate thumbnail' }, { status: 500 });
    }
}
