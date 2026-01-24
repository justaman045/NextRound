/**
 * Template Validator & Auto-Repair Utility
 * 
 * This module validates LaTeX template structure and automatically repairs
 * common issues to prevent compilation errors.
 */

export interface TemplateFile {
    path: string;
    content: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    repaired?: TemplateFile[];
}

/**
 * Validates and repairs a template's structure
 */
export function validateAndRepairTemplate(files: TemplateFile[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let repaired: TemplateFile[] = [...files];

    // 1. Check for .cls files
    const clsFiles = files.filter(f => f.path.endsWith('.cls'));
    const texFiles = files.filter(f => f.path.endsWith('.tex'));

    if (clsFiles.length === 0 && texFiles.length === 0) {
        errors.push('No .tex or .cls files found in template');
        return { isValid: false, errors, warnings };
    }

    // 2. Validate .cls files don't have Handlebars
    clsFiles.forEach(file => {
        if (file.content.includes('{{') || file.content.includes('}}')) {
            warnings.push(`${file.path}: Class file contains Handlebars tags (will be ignored during compilation)`);
        }
    });

    // 3. Find main .tex file
    const mainTexFile = texFiles.find(f => f.path === 'main.tex') || texFiles[0];

    if (!mainTexFile) {
        errors.push('No .tex file found');
        return { isValid: false, errors, warnings };
    }

    // 4. Check if main.tex has proper structure
    const needsRepair = detectStructuralIssues(mainTexFile, clsFiles);

    if (needsRepair.length > 0) {
        warnings.push(`Detected structural issues in ${mainTexFile.path}: ${needsRepair.join(', ')}`);

        // Auto-repair the template
        const repairedTex = repairMainTexStructure(mainTexFile, clsFiles);
        repaired = repaired.map(f =>
            f.path === mainTexFile.path ? repairedTex : f
        );

        warnings.push(`Auto-repaired ${mainTexFile.path}`);
    }

    // 5. Validate that repaired template has proper structure
    const finalValidation = validateTexStructure(
        repaired.find(f => f.path === mainTexFile.path)!
    );

    if (!finalValidation.isValid) {
        errors.push(...finalValidation.errors);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        repaired: needsRepair.length > 0 ? repaired : undefined
    };
}

/**
 * Detects structural issues in main.tex
 */
function detectStructuralIssues(texFile: TemplateFile, _clsFiles: TemplateFile[]): string[] {
    const issues: string[] = [];
    const content = texFile.content;

    // Check for \documentclass
    if (!content.includes('\\documentclass')) {
        issues.push('Missing \\documentclass');
    }

    // Check for \begin{document}
    if (!content.includes('\\begin{document}')) {
        issues.push('Missing \\begin{document}');
    }

    // Check for \end{document}
    if (!content.includes('\\end{document}')) {
        issues.push('Missing \\end{document}');
    }

    // Check if class definition code is in .tex file
    if (content.includes('\\ProvidesClass') || content.includes('\\LoadClass')) {
        issues.push('Class definition code found in .tex file (should be in .cls)');
    }

    // Check if \usepackage appears before \documentclass
    const docclassIndex = content.indexOf('\\documentclass');
    const usepackageIndex = content.indexOf('\\usepackage');
    if (usepackageIndex !== -1 && usepackageIndex < docclassIndex) {
        issues.push('\\usepackage before \\documentclass');
    }

    return issues;
}

/**
 * Repairs main.tex structure
 */
function repairMainTexStructure(texFile: TemplateFile, clsFiles: TemplateFile[]): TemplateFile {
    let content = texFile.content;

    // Extract class name from .cls file if available
    let className = 'article'; // default
    if (clsFiles.length > 0) {
        const clsFile = clsFiles[0];
        const match = clsFile.content.match(/\\ProvidesClass\{([^}]+)\}/);
        if (match) {
            className = match[1];
        } else {
            // Use filename without extension
            className = clsFile.path.replace('.cls', '');
        }
    }

    // Remove class definition code if present
    content = content.replace(/\\ProvidesClass\{[^}]+\}[\s\S]*?(?=\\documentclass|$)/g, '');
    content = content.replace(/\\LoadClass\[[^\]]*\]\{[^}]+\}/g, '');

    // Remove \usepackage, \pagestyle, etc. that appear before \documentclass
    const lines = content.split('\n');
    const bodyLines: string[] = [];
    let foundDocClass = false;

    for (const line of lines) {
        if (line.includes('\\documentclass')) {
            foundDocClass = true;
            bodyLines.push(line);
        } else if (!foundDocClass && (
            line.includes('\\usepackage') ||
            line.includes('\\pagestyle') ||
            line.includes('\\def') ||
            line.includes('\\let') ||
            line.includes('\\newenvironment') ||
            line.includes('\\renewcommand')
        )) {
            // These should be in the class file, skip them
            continue;
        } else {
            bodyLines.push(line);
        }
    }

    content = bodyLines.join('\n');

    // Ensure \documentclass is at the top
    if (!content.trim().startsWith('\\documentclass')) {
        content = `\\documentclass{${className}}\n\n` + content;
    }

    // Ensure \begin{document} exists
    if (!content.includes('\\begin{document}')) {
        // Find where to insert it (after \documentclass and any preamble)
        const docclassMatch = content.match(/\\documentclass\{[^}]+\}/);
        if (docclassMatch) {
            const insertIndex = docclassMatch.index! + docclassMatch[0].length;
            content = content.slice(0, insertIndex) + '\n\n\\begin{document}\n\n' + content.slice(insertIndex);
        }
    }

    // Ensure \end{document} exists
    if (!content.includes('\\end{document}')) {
        content = content.trim() + '\n\n\\end{document}\n';
    }

    return {
        ...texFile,
        content: content.trim() + '\n'
    };
}

/**
 * Validates .tex file structure
 */
function validateTexStructure(texFile: TemplateFile): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const content = texFile.content;

    // Must have \documentclass
    if (!content.includes('\\documentclass')) {
        errors.push('Missing \\documentclass');
    }

    // Must have \begin{document}
    if (!content.includes('\\begin{document}')) {
        errors.push('Missing \\begin{document}');
    }

    // Must have \end{document}
    if (!content.includes('\\end{document}')) {
        errors.push('Missing \\end{document}');
    }

    // \documentclass should come before \begin{document}
    const docclassIndex = content.indexOf('\\documentclass');
    const beginDocIndex = content.indexOf('\\begin{document}');
    if (docclassIndex > beginDocIndex) {
        errors.push('\\documentclass must come before \\begin{document}');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
