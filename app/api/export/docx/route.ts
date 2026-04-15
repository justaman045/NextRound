import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '../../../../lib/generateDocx';

export async function POST(req: NextRequest) {
    try {
        const { data, title, templateId } = await req.json();

        if (!data) {
            return NextResponse.json({ error: "Missing resume data" }, { status: 400 });
        }

        const buffer = await generateDocx(data, templateId);

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${title || 'Resume'}.docx"`,
            },
        });

    } catch (error: any) {
        console.error("DOCX Export Error:", error);
        return NextResponse.json({ error: error.message || "Failed to export DOCX" }, { status: 500 });
    }
}
