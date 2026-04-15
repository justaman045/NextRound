'use server';

import OpenAI from "openai";

const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "" });

export async function convertLatexToTemplate(latexCode: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const prompt = `
    You are an expert LaTeX and Handlebars Code Converter.

    CRITICAL INSTRUCTIONS FOR CLASS FILES:
    - If the input contains \\ProvidesClass or \\LoadClass, it is a CLASS DEFINITION file (.cls)
    - CLASS FILES should be returned UNCHANGED with NO Handlebars variables
    - If you detect a class file, you MUST also create a separate main.tex file that:
      1. Starts with \\documentclass{classname} (use the class name from \\ProvidesClass)
      2. Contains \\begin{document} and \\end{document}
      3. Has the actual resume content with Handlebars variables
    
    OUTPUT FORMAT FOR MULTI-FILE TEMPLATES:
    If you need to output multiple files, use this format:
    
    --- FILE: filename.cls ---
    [class file content - NO HANDLEBARS]
    --- END FILE ---
    
    --- FILE: main.tex ---
    [document content with Handlebars]
    --- END FILE ---

    HANDLEBARS VARIABLES (Use ONLY in .tex files, NOT in .cls files):
    - {{ fullName }}
    - {{ email }}
    - {{ phone }}
    - {{ location }}
    - {{ website }}
    - {{ summary }}
    - {{ skills }} (Comma separated list)

    LOOPS (Use these specific block helpers):
    
    1. EXPERIENCE:
    {{#each experience}}
      ... use {{ role }}, {{ company }}, {{ startDate }}, {{ endDate }}, {{ location }} ...
      ... for the bullets/description, YOU MUST USE THIS HELPER: {{#formatBullets description}}{{/formatBullets}} ...
    {{/each}}

    2. EDUCATION:
    {{#each education}}
      ... use {{ school }}, {{ degree }}, {{ year }}, {{ location }} ...
    {{/each}}

    3. PROJECTS (Look for "Projects" or "Leadership" section):
    {{#each projects}}
       ... use {{ name }} (for project title), {{ description }} (use {{#formatBullets description}}{{/formatBullets}} if it's a list), {{ technologies }} (optional), {{ link }} (optional) ...
    {{/each}}

    4. CUSTOM SECTIONS (Look for generic sections like "Awards", "Certifications", "Volunteering"):
    {{#each customSections}}
       \\section{{{ title }}}  <-- Use the dynamic title
       {{#each items}}
          ... use {{ name }} (item title), {{ subtitle }} (issuer/role), {{ date }}, {{ description }} ...
       {{/each}}
    {{/each}}

    CONVERSION STEPS:
    1. Check if input contains \\ProvidesClass or \\LoadClass
       - If YES: This is a class file. Keep it unchanged and create a separate main.tex
       - If NO: This is a regular .tex file. Convert it normally.
    2. For .tex files only:
       - Replace Name, Contact Info, Summary with variables
       - Replace Experience section with {{#each experience}} loop
       - Replace Education section with {{#each education}} loop
       - Replace Projects section with {{#each projects}} loop
       - Replace other sections with {{#each customSections}} loop
       - Replace Skills with {{ skills }}

    SPECIFIC COMMAND MAPPINGS:
    - \\name{...} -> \\name{ {{ fullName }} }
    - \\address{...} -> \\address{ {{ email }} \\\\ {{ phone }} \\\\ {{ location }} }
    - \\begin{rSection}{...} -> Treat these as section headers.
    
    3. KEEP all LaTeX formatting (packages, geometry, custom commands) EXACTLY AS IS
    4. If you see multiple entries (e.g. 2 Jobs), remove all but one, and wrap that one in the loop
    
    OUTPUT:
    Return ONLY the raw LaTeX code with Handlebars tags. 
    If multiple files, use the --- FILE: filename --- format shown above.
    Do not include markdown code blocks like \`\`\`latex.
    
    RAW LATEX INPUT:
    ${latexCode}
    `;

  try {
    const completion = await openai.chat.completions.create({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }]
    });
    let text = completion.choices[0].message.content || "";

    // Cleanup markdown if present
    text = text.replace(/^```latex/, '').replace(/^```/, '').replace(/```$/, '');

    // FORCE FIX: Split triple braces {{{ var }}} -> { {{ var }} }
    // This prevents Handlebars from seeing triple braces and preserves LaTeX grouping
    text = text.replace(/\{\{\{/g, '{ {{').replace(/\}\}\}/g, '}} }');

    // Check if output contains multiple files
    const fileMarkerRegex = /---\s*FILE:\s*([^\s]+)\s*---\s*([\s\S]*?)---\s*END FILE\s*---/gi;
    const matches = [...text.matchAll(fileMarkerRegex)];

    if (matches.length > 0) {
      // Multi-file output detected
      const files: { path: string; content: string }[] = [];

      for (const match of matches) {
        const filename = match[1].trim();
        let content = match[2].trim();

        // Only apply Handlebars fixes to .tex files, NOT .cls files
        if (filename.endsWith('.tex')) {
          content = applyHandlebarsFixes(content);
        }

        files.push({ path: filename, content });
      }

      // Return as JSON string for the admin panel to parse
      return JSON.stringify(files);
    } else {
      // Single file output - apply fixes
      text = applyHandlebarsFixes(text);
      return text.trim();
    }
  } catch (error: any) {
    console.error("Error converting template:", error);
    throw new Error(`Failed to convert template: ${error.message}`);
  }
}

// Helper function to apply Handlebars fixes
function applyHandlebarsFixes(text: string): string {
  // Unescape Handlebars tags if the AI escaped them (common issue)
  // 1. Unescape TRIPLE braces first to avoid collision
  text = text.replace(/\\\{\\\{\\\{/g, '{{{').replace(/\\\}\\\}\\\}/g, '}}}');
  // 2. Unescape DOUBLE braces
  text = text.replace(/\\\{\\\{/g, '{{').replace(/\\\}\\\}/g, '}}');

  // 3. Fix potential spacing issues in block helpers (e.g. {{ #each }} -> {{#each}})
  text = text.replace(/\{\{\s*([#\/])/g, '{{$1');

  // 4. PREVENT COLLISION: { + {{{ = {{{{ (Raw Block start). Insert space.
  text = text.replace(/\{(\s*)\{\{\{/g, '{ {{{');
  text = text.replace(/\}\}\}(\s*)\}/g, '}}} }');

  // 5. PREVENT TRIPLE STASH COLLISION: { + {{ = {{{ (Raw Var Start).
  // E.g. {\bf {{ name }}} -> { {{ name }} }.
  text = text.replace(/\{(\s*)\{\{(?!\{)/g, '{ {{$1');

  // 6. FIX TRIPLE CLOSING BRACES: {{ var }}} -> {{ var }}
  // This happens when AI generates {{ name }}} instead of {{ name }}
  text = text.replace(/(\{\{[^}]+)\}\}\}/g, '$1}}');

  // 7. PREVENT LATEX COLLISION: {{ \command -> { { \command
  // Handlebars tries to parse {{ \bf }} and fails because \ is invalid in an ID.
  text = text.replace(/\{\{(\s*\\)/g, '{ {$1');

  return text.trim();
}
