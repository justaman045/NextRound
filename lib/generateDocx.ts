import { 
    Document, Packer, Paragraph, TextRun, HeadingLevel, 
    AlignmentType, SectionType, BorderStyle, Table, 
    TableRow, TableCell, WidthType, VerticalAlign,
    BorderStyle as BS,
    TabStopType,
    ShadingType
} from "docx";
import { UserProfile } from "@/types";

export async function generateDocx(data: UserProfile, templateId: string = "modern"): Promise<Buffer> {
    const doc = new Document({
        title: `${data.fullName} - Resume`,
        creator: "NextRound AI",
        description: "AI Generated Resume",
        sections: [{
            properties: {
                type: SectionType.CONTINUOUS,
            },
            children: renderTemplate(data, templateId),
        }],
    });

    return await Packer.toBuffer(doc);
}

function renderTemplate(data: UserProfile, templateId: string): any[] {
    switch (templateId) {
        case "creative":
        case "faangpath":
            return renderTwoColumnLayout(data, templateId);
        case "minimalist":
            return renderMinimalistLayout(data);
        default:
            return renderModernLayout(data);
    }
}

// --------------------------------------------------------------------------
// MODERN LAYOUT
// --------------------------------------------------------------------------
function renderModernLayout(data: UserProfile): any[] {
    return [
        // Header
        new Paragraph({
            text: data.fullName.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: `${data.email} | ${data.phone} | ${data.location}`, size: 18 }),
            ],
            spacing: { after: 40 },
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: data.website, size: 18, color: "0000FF", underline: {} }),
            ],
            spacing: { after: 240 },
        }),

        ...renderSection("PROFESSIONAL SUMMARY", [
            new Paragraph({ text: data.summary, spacing: { after: 120 } })
        ]),

        ...renderSection("CORE SKILLS", [
            new Paragraph({ text: data.skills, spacing: { after: 120 } })
        ]),

        ...renderSection("EXPERIENCE", data.experience.flatMap(exp => [
            new Paragraph({
                children: [
                    new TextRun({ text: exp.role.toUpperCase(), bold: true }),
                    new TextRun({ text: `\t${exp.startDate} - ${exp.endDate}`, bold: true }),
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
                spacing: { before: 120 },
            }),
            new Paragraph({
                children: [new TextRun({ text: exp.company, italics: true, color: "444444" })],
                spacing: { after: 60 },
            }),
            ...renderBullets(exp.description)
        ])),

        ...renderSection("PROJECTS", (data.projects || []).flatMap(proj => [
            new Paragraph({
                children: [
                    new TextRun({ text: proj.name, bold: true }),
                    new TextRun({ text: proj.technologies ? ` | ${proj.technologies}` : "", italics: true, color: "666666" }),
                ],
                spacing: { before: 120 },
            }),
            ...renderBullets(proj.description)
        ])),

        ...renderSection("EDUCATION", data.education.map(edu => 
            new Paragraph({
                children: [
                    new TextRun({ text: `${edu.degree}, ${edu.school}`, bold: true }),
                    new TextRun({ text: `\t${edu.year}`, bold: true }),
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
                spacing: { before: 60 },
            })
        )),
    ];
}

// --------------------------------------------------------------------------
// MINIMALIST LAYOUT (Just cleaner fonts and spacing)
// --------------------------------------------------------------------------
function renderMinimalistLayout(data: UserProfile): any[] {
    return renderModernLayout(data); // Can refine later if needed
}

// --------------------------------------------------------------------------
// TWO COLUMN LAYOUT (Creative / FaangPath)
// --------------------------------------------------------------------------
function renderTwoColumnLayout(data: UserProfile, templateId: string): any[] {
    // We use a single-row table with two cells to force columns that work across all Word viewers
    const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    // LEFT COLUMN (Sidebar)
                    new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        shading: { fill: "f8f9fa", type: ShadingType.CLEAR },
                        children: [
                            new Paragraph({
                                text: data.fullName,
                                heading: HeadingLevel.HEADING_2,
                                spacing: { after: 120 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "CONTACT", bold: true, size: 16, color: "444444" }),
                                ],
                                spacing: { before: 240, after: 60 },
                            }),
                            new Paragraph({ text: data.email, size: 16 }),
                            new Paragraph({ text: data.phone, size: 16 }),
                            new Paragraph({ text: data.location, size: 16 }),
                            
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "SKILLS", bold: true, size: 16, color: "444444" }),
                                ],
                                spacing: { before: 400, after: 60 },
                            }),
                            ...data.skills.split(/[,|•]/).map(s => new Paragraph({ text: s.trim(), size: 16 })),
                            
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "EDUCATION", bold: true, size: 16, color: "444444" }),
                                ],
                                spacing: { before: 400, after: 60 },
                            }),
                            ...data.education.map(edu => new Paragraph({ text: `${edu.degree}\n${edu.school}`, size: 16, spacing: { after: 60 } })),
                        ],
                        verticalAlign: VerticalAlign.TOP,
                        margins: { top: 200, left: 200, bottom: 200, right: 200 },
                    }),
                    
                    // RIGHT COLUMN (Main Content)
                    new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: "SUMMARY", bold: true, color: templateId === 'creative' ? "9333ea" : "000000" })],
                                border: { bottom: { color: "cccccc", style: BorderStyle.SINGLE, size: 1 } },
                                spacing: { after: 120 },
                            }),
                            new Paragraph({ text: data.summary, spacing: { after: 240 } }),

                            new Paragraph({
                                children: [new TextRun({ text: "EXPERIENCE", bold: true, color: templateId === 'creative' ? "9333ea" : "000000" })],
                                border: { bottom: { color: "cccccc", style: BorderStyle.SINGLE, size: 1 } },
                                spacing: { after: 120 },
                            }),
                            ...data.experience.flatMap(exp => [
                                new Paragraph({
                                    children: [new TextRun({ text: exp.role, bold: true }), new TextRun({ text: ` | ${exp.company}`, italics: true })],
                                    spacing: { before: 120 },
                                }),
                                new Paragraph({ text: `${exp.startDate} - ${exp.endDate}`, size: 16, color: "666666" }),
                                ...renderBullets(exp.description)
                            ]),

                            new Paragraph({
                                children: [new TextRun({ text: "PROJECTS", bold: true, color: templateId === 'creative' ? "9333ea" : "000000" })],
                                border: { bottom: { color: "cccccc", style: BorderStyle.SINGLE, size: 1 } },
                                spacing: { before: 240, after: 120 },
                            }),
                            ...(data.projects || []).flatMap(proj => [
                                new Paragraph({
                                    children: [new TextRun({ text: proj.name, bold: true })],
                                    spacing: { before: 60 },
                                }),
                                ...renderBullets(proj.description)
                            ]),
                        ],
                        verticalAlign: VerticalAlign.TOP,
                        margins: { top: 200, left: 400, bottom: 200, right: 200 },
                    }),
                ],
            }),
        ],
    });

    return [table];
}

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------
function renderSection(title: string, content: any[]): any[] {
    return [
        new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 20 })],
            border: {
                bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { before: 240, after: 120 },
        }),
        ...content
    ];
}

function renderBullets(text: string): Paragraph[] {
    return text.split("\n")
        .filter(line => line.trim())
        .map(line => {
            const cleanLine = line.trim().replace(/^[•\-\*]\s*/, "");
            return new Paragraph({
                text: cleanLine,
                bullet: { level: 0 },
                spacing: { before: 40 },
                indent: { left: 360, hanging: 180 },
            });
        });
}
