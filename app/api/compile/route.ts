import { NextRequest, NextResponse } from "next/server";
import Handlebars from "handlebars";
import archiver from "archiver";
import { Writable } from "stream";
import { validateAndRepairTemplate } from "@/lib/templateValidator";

// Helper to convert stream to buffer
const streamToBuffer = async (stream: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on("data", (chunk: any) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
};

// Helper to escape LaTeX special characters
const escapeLatex = (text: string): string => {
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');
};

const deepEscape = (obj: any): any => {
    if (typeof obj === 'string') {
        return escapeLatex(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(deepEscape);
    }
    if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = deepEscape(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

export async function POST(request: NextRequest) {
    try {
        const { files, data } = await request.json();

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }
        if (!data) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Validate and auto-repair template structure
        const validationResult = validateAndRepairTemplate(files);

        // Log warnings
        if (validationResult.warnings.length > 0) {
            console.log('Template warnings:', validationResult.warnings);
        }

        // If validation failed, return error
        if (!validationResult.isValid) {
            console.error('Template validation failed:', validationResult.errors);
            return NextResponse.json({
                error: 'Invalid template structure',
                details: validationResult.errors.join('; ')
            }, { status: 400 });
        }

        // Use repaired files if available, otherwise use original
        const filesToCompile = validationResult.repaired || files;

        console.log('Compiling template with', filesToCompile.length, 'files');
        if (validationResult.repaired) {
            console.log('Using auto-repaired template');
        }

        // Register custom Handlebars helper for bullet points
        Handlebars.registerHelper('formatBullets', function (description: string) {
            if (!description) return '';
            return description
                .split('\n')
                .filter((line: string) => line.trim())
                .map((line: string) => `\\item ${line}`)
                .join('\n');
        });

        // 1. Compile Templates with Handlebars
        const sanitizedData = deepEscape(data);
        const compiledFiles = filesToCompile.map((file: any) => {
            // Only process .tex files with Handlebars
            // .cls files are pure LaTeX class definitions and should not be processed
            if (file.path.endsWith('.tex')) {
                try {
                    // Sanitize content before compilation
                    let content = file.content;
                    const beforeFix = content;

                    // Fix 1: Split triple braces into LaTeX brace + Handlebars double braces
                    // {{{ var }}} -> { {{ var }} }
                    // This preserves the LaTeX grouping while fixing the Handlebars syntax
                    content = content.replace(/\{\{\{/g, '{ {{').replace(/\}\}\}/g, '}} }');

                    // Fix 2: {{ var }}} -> {{ var }} (handle remaining extra braces)
                    content = content.replace(/(\{\{[^}]+)\}\}\}/g, '$1}}');

                    if (beforeFix !== content) {
                        console.log(`[Sanitization] Fixed braces in ${file.path}`);
                        console.log(`[Sanitization] Before: ${JSON.stringify(beforeFix.substring(0, 200))}`);
                        console.log(`[Sanitization] After:  ${JSON.stringify(content.substring(0, 200))}`);
                    }

                    // Fix 2: Ensure proper spacing in Handlebars block helpers
                    // {{#if var}} -> {{#if var}}  (already correct, but ensure no extra spaces)
                    content = content.replace(/\{\{\s*#\s*/g, '{{#');
                    content = content.replace(/\{\{\s*\/\s*/g, '{{/');

                    // Fix 3: Fix spacing around LaTeX braces that might confuse Handlebars
                    // { {{ var }} } is correct, but ensure consistency

                    const template = Handlebars.compile(content, { noEscape: true });
                    return {
                        ...file,
                        content: template(sanitizedData)
                    };
                } catch (e: any) {
                    console.error(`Error compiling ${file.path}:`, e);
                    throw new Error(`Handlebars Compilation Error in ${file.path}: ${e.message}`);
                }
            }
            return file;
        });

        // 2. Create TAR GZIP Archive (in memory)
        const archive = archiver('tar', {
            gzip: true,
            gzipOptions: { level: 9 }
        });

        const bufferPromise = new Promise<Buffer>((resolve, reject) => {
            const chunks: any[] = [];
            const outputStream = new Writable({
                write(chunk, encoding, callback) {
                    chunks.push(chunk);
                    callback();
                }
            });
            outputStream.on("finish", () => resolve(Buffer.concat(chunks)));
            outputStream.on("error", reject);
            archive.pipe(outputStream);
        });

        // Append files
        compiledFiles.forEach((file: any) => {
            // Remove leading slash if present to ensure relative paths
            const name = file.path.startsWith('/') ? file.path.slice(1) : file.path;
            archive.append(file.content, { name });
        });

        await archive.finalize();
        const tarBuffer = await bufferPromise;

        // 3. Send to LatexOnline
        // Auto-detect the entry point (looking for \documentclass)
        let targetFile = "main.tex";
        const entryFile = compiledFiles.find((f: any) => f.content.includes('\\documentclass'));
        if (entryFile) {
            targetFile = entryFile.path.startsWith('/') ? entryFile.path.slice(1) : entryFile.path;
        }

        // Use the main latexonline.cc instance
        const latexUrl = `https://latexonline.cc/data?target=${targetFile}&command=pdflatex`;

        // Create FormData
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(tarBuffer)], { type: 'application/gzip' });
        formData.append('file', blob, 'project.tar.gz');

        const response = await fetch(latexUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("LaTeX Compilation Failed:", errorText);
            return NextResponse.json({ error: "Compilation Failed", details: errorText }, { status: 500 });
        }

        const pdfBuffer = await response.arrayBuffer();

        // 4. Return PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="resume.pdf"',
            },
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
