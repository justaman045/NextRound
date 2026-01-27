"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { Loader2, Plus, Trash2, Edit2, Check, X, Layout, FileCode, Code, Save } from "lucide-react";
import { Template, TemplateFile } from "@/types";
import LatexCodeEditor from "@/components/admin/LatexCodeEditor";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Template>>({
        name: "",
        description: "",
        componentKey: "modern",
        imageUrl: "",
        isActive: true,
        type: 'react',
        files: []
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "templates"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Template[];
            setTemplates(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async () => {
        try {
            const dataToSave = { ...formData };
            if (dataToSave.type === 'react') {
                delete dataToSave.files;
            } else {
                delete dataToSave.componentKey;
                if (!dataToSave.files || dataToSave.files.length === 0) {
                    dataToSave.files = [{ path: "main.tex", content: "" }];
                }

                // WARNING CHECK: If .tex files don't have {{ or }}, warn the user
                const hasHandlebars = dataToSave.files.some(f => f.path.endsWith('.tex') && (f.content.includes('{{') || f.content.includes('}}')));
                if (!hasHandlebars && !confirm("Warning: Your LaTeX files do not appear to contain any Handlebars variables (like {{ fullName }}). This means the resume will be static and WON'T assume user data.\n\nAre you sure you want to save without auto-converting?")) {
                    return;
                }
            }

            if (editingId) {
                await updateDoc(doc(db, "templates", editingId), dataToSave);
            } else {
                await addDoc(collection(db, "templates"), dataToSave);
            }

            resetForm();
            fetchTemplates();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            componentKey: "modern",
            imageUrl: "",
            isActive: true,
            type: 'react',
            files: []
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const startEdit = (template: Template) => {
        setFormData(template);
        setEditingId(template.id || null);
        setIsEditing(true);
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const ref = doc(db, "templates", id);
            await updateDoc(ref, { isActive: !currentStatus });
            setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
        } catch (error) {
            console.error("Error toggling template:", error);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "templates", id));
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const seedReactDefaults = async () => {
        if (!confirm("Add missing default React templates?")) return;
        setLoading(true);
        try {
            const defaults = [
                {
                    name: "Modern Professional",
                    description: "Clean, professional layout with a focus on readability.",
                    type: "react",
                    componentKey: "modern",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=500"
                },
                {
                    name: "Minimalist Elegant",
                    description: "Simple, elegant design for creative professionals.",
                    type: "react",
                    componentKey: "minimalist",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1626197031507-c17099753214?auto=format&fit=crop&q=80&w=500"
                },
                {
                    name: "Creative Sidebar",
                    description: "Modern two-column layout with a sidebar for skills and contacts.",
                    type: "react",
                    componentKey: "creative",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&q=80&w=500"
                },
                {
                    name: "FaangPath (React)",
                    description: "The popular FAANG layout, now fully editable in React.",
                    type: "react",
                    componentKey: "faangpath",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=500"
                }
            ];

            let addedCount = 0;
            for (const t of defaults) {
                // Check if exists by componentKey
                const exists = templates.some(existing => existing.componentKey === t.componentKey);
                if (!exists) {
                    await addDoc(collection(db, "templates"), t);
                    addedCount++;
                }
            }

            fetchTemplates();
            alert(addedCount > 0 ? `Added ${addedCount} new templates!` : "All defaults already exist.");
        } catch (e) {
            console.error(e);
            alert("Failed to seed templates");
        } finally {
            setLoading(false);
        }
    };

    const seedLatexDefaults = async () => {
        if (!confirm("This will add default LaTeX templates to Firestore. Continue?")) return;
        setLoading(true);
        try {
            const defaults = [
                {
                    name: "Academic Professional",
                    description: "Standard LaTeX resume perfect for academic and research roles.",
                    type: "latex",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=500",
                    files: [
                        {
                            path: "main.tex",
                            content: `\\documentclass[a4paper,10pt]{article}
\\usepackage[left=1in,right=1in,top=1in,bottom=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

\\begin{center}
    {\\huge \\textbf{ {{ fullName }} }} \\\\
    \\vspace{2mm}
    {{ email }} | {{ phone }} | {{ location }} \\\\
    \\href{ {{ website }} }{Portfolio/Website}
\\end{center}

\\section*{Summary}
\\hrule
\\vspace{2mm}
{{ summary }}

\\section*{Experience}
\\hrule
\\vspace{2mm}
{{#each experience}}
\\noindent \\textbf{ {{ role }} } \\hfill {{ startDate }} - {{ endDate }} \\\\
\\emph{ {{ company }} } \\hfill {{ location }}
\\begin{itemize}[noitemsep]
    {{#formatBullets description}}{{/formatBullets}}
\\end{itemize}
\\vspace{3mm}
{{/each}}

\\section*{Education}
\\hrule
\\vspace{2mm}
{{#each education}}
\\noindent \\textbf{ {{ school }} } \\hfill {{ location }} \\\\
{{ degree }} \\hfill {{ year }}
\\vspace{3mm}
{{/each}}

\\section*{Projects}
\\hrule
\\vspace{2mm}
{{#each projects}}
\\noindent \\textbf{ {{ name }} } \\\\
{{ description }}
\\vspace{3mm}
{{/each}}

\\section*{Skills}
\\hrule
\\vspace{2mm}
{{ skills }}

\\end{document}`
                        }
                    ]
                },
                {
                    name: "Modern CV (LaTeX)",
                    description: "A clean, modern LaTeX layout with a sidebar effect using minipages.",
                    type: "latex",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=500",
                    files: [
                        {
                            path: "main.tex",
                            content: `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
    \\textbf{\\Huge {{ fullName }} } \\\\
    \\vspace{5pt}
    {{ email }} $|$ {{ phone }} $|$ {{ location }}
\\end{center}

\\section{Summary}
{{ summary }}

\\section{Experience}
{{#each experience}}
\\textbf{ {{ role }} } \\hfill {{ startDate }} -- {{ endDate }} \\\\
\\emph{ {{ company }} } \\\\
\\begin{itemize}[noitemsep,topsep=0pt]
    {{#formatBullets description}}{{/formatBullets}}
\\end{itemize}
\\vspace{5pt}
{{/each}}

\\section{Education}
{{#each education}}
\\textbf{ {{ school }} } \\hfill {{ year }} \\\\
{{ degree }} \\\\
\\vspace{5pt}
{{/each}}

\\section{Skills}
{{ skills }}

\\end{document}`
                        }
                    ]
                },
                {
                    name: "FaangPath (FAANG)",
                    description: "Popular single-column template used by FAANG candidates. Clean, dense, and effective.",
                    type: "latex",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=500",
                    files: [
                        {
                            path: "resume.cls",
                            content: `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Medium Length Professional CV - RESUME CLASS FILE
%
% This template has been downloaded from:
% http://www.LaTeXTemplates.com
%
% This class file defines the structure and design of the template. 
%
% Original header:
% Copyright (C) 2010 by Trey Hunner
%
% Copying and distribution of this file, with or without modification,
% are permitted in any medium without royalty provided the copyright
% notice and this notice are preserved. This file is offered as-is,
% without any warranty.
%
% Created by Trey Hunner and modified by www.LaTeXTemplates.com
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\ProvidesClass{resume}[2010/07/10 v0.9 Resume class]

\\LoadClass[11pt,letterpaper]{article} % Font size and paper type

\\usepackage[parfill]{parskip} % Remove paragraph indentation
\\usepackage{array} % Required for boldface (\\bf and \\bfseries) tabular columns
\\usepackage{ifthen} % Required for ifthenelse statements

\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,      
    urlcolor=blue,
}

\\pagestyle{empty} % Suppress page numbers

%----------------------------------------------------------------------------------------
%	HEADINGS COMMANDS: Commands for printing name and address
%----------------------------------------------------------------------------------------

\\def \\name#1{\\def\\@name{#1}} % Defines the \\name command to set name
\\def \\@name {} % Sets \\@name to empty by default

\\def \\addressSep {$\\diamond$} % Set default address separator to a diamond

% One, two or three address lines can be specified 
\\let \\@addressone \\relax
\\let \\@addresstwo \\relax
\\let \\@addressthree \\relax

% \\address command can be used to set the first, second, and third address (last 2 optional)
\\def \\address #1{
  \\@ifundefined{@addresstwo}{
    \\def \\@addresstwo {#1}
  }{
  \\@ifundefined{@addressthree}{
  \\def \\@addressthree {#1}
  }{
     \\def \\@addressone {#1}
  }}
}

% \\printaddress is used to style an address line (given as input)
\\def \\printaddress #1{
  \\begingroup
    \\def \\\\ {\\addressSep\\ }
    \\centerline{#1}
  \\endgroup
  \\par
  \\addressskip
}

% \\printname is used to print the name as a page header
\\def \\printname {
  \\begingroup
    \\hfil{\\MakeUppercase{\\namesize\\bf \\@name}}\\hfil
    \\nameskip\\break
  \\endgroup
}

%----------------------------------------------------------------------------------------
%	PRINT THE HEADING LINES
%----------------------------------------------------------------------------------------

\\let\\ori@document=\\document
\\renewcommand{\\document}{
  \\ori@document  % Begin document
  \\printname % Print the name specified with \\name
  \\@ifundefined{@addressone}{}{ % Print the first address if specified
    \\printaddress{\\@addressone}}
  \\@ifundefined{@addresstwo}{}{ % Print the second address if specified
    \\printaddress{\\@addresstwo}}
     \\@ifundefined{@addressthree}{}{ % Print the third address if specified
    \\printaddress{\\@addressthree}}
}

%----------------------------------------------------------------------------------------
%	SECTION FORMATTING
%----------------------------------------------------------------------------------------

% Defines the rSection environment for the large sections within the CV
\\newenvironment{rSection}[1]{ % 1 input argument - section name
  \\sectionskip
  \\MakeUppercase{{\\bf #1}} % Section title
  \\sectionlineskip
  \\hrule % Horizontal line
  \\begin{list}{}{ % List for each individual item in the section
    \\setlength{\\leftmargin}{0em} % Margin within the section
  }
  \\item[]
}{
  \\end{list}
}

%----------------------------------------------------------------------------------------
%	WORK EXPERIENCE FORMATTING
%----------------------------------------------------------------------------------------

\\newenvironment{rSubsection}[4]{ % 4 input arguments - company name, year(s) employed, job title and location
 {\\bf #1} \\hfill {#2} % Bold company name and date on the right
 \\ifthenelse{\\equal{#3}{}}{}{ % If the third argument is not specified, don't print the job title and location line
  \\\\
  {\\em #3} \\hfill {\\em #4} % Italic job title and location
  }\\smallskip
  \\begin{list}{$\\cdot$}{\\leftmargin=0em} % \\cdot used for bullets, no indentation
   \\itemsep -0.5em \\vspace{-0.5em} % Compress items in list together for aesthetics
  }{
  \\end{list}
  \\vspace{0.5em} % Some space after the list of bullet points
}

% The below commands define the whitespace after certain things in the document - they can be \\smallskip, \\medskip or \\bigskip
\\def\\namesize{\\LARGE} % Size of the name at the top of the document
\\def\\addressskip{\\smallskip} % The space between the two address (or phone/email) lines
\\def\\sectionlineskip{\\medskip} % The space above the horizontal line for each section 
\\def\\nameskip{\\medskip} % The space after your name at the top
\\def\\sectionskip{\\medskip} % The space after the heading section`
                        },
                        {
                            path: "main.tex",
                            content: `\\documentclass{resume} % Use the custom resume.cls style

\\usepackage[left=0.4 in,top=0.4in,right=0.4 in,bottom=0.4in]{geometry} % Document margins
\\newcommand{\\tab}[1]{\\hspace{.2667\\textwidth}\\rlap{#1}} 
\\newcommand{\\itab}[1]{\\hspace{0em}\\rlap{#1}}
\\name{ {{ fullName }} } 
\\address{ {{ email }} \\\\ {{ phone }} \\\\ {{ location }} }
\\address{\\href{ {{ website }} }{ {{ website }} } } 

\\begin{document}

\\begin{rSection}{Summary}
{{ summary }}
\\end{rSection}

\\begin{rSection}{Education}
{{#each education}}
{\\bf {{ degree }} }, {{ school }} \\hfill { {{ year }} } \\\\
{{ location }}
\\smallskip
{{/each}}
\\end{rSection}

\\begin{rSection}{SKILLS}
{{ skills }}
\\end{rSection}

\\begin{rSection}{EXPERIENCE}

{{#each experience}}
\\textbf{ {{ role }} } \\hfill {{ startDate }} - {{ endDate }}\\\\
{{ company }} \\hfill \\textit{ {{ location }} }
 \\begin{itemize}
    \\itemsep -3pt {} 
     {{#formatBullets description}}{{/formatBullets}}
 \\end{itemize}
{{/each}}

\\end{rSection} 

\\begin{rSection}{PROJECTS}
{{#each projects}}
\\item \\textbf{ {{ name }} } { {{ description }} }
{{/each}}
\\end{rSection} 

\\end{document}`
                        }
                    ]
                }
            ];

            for (const t of defaults) {
                await addDoc(collection(db, "templates"), t);
            }
            fetchTemplates();
            alert("LaTeX templates seeded!");
        } catch (error) {
            console.error("Error seeding LaTeX:", error);
            alert("Failed to seed LaTeX templates");
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Template Manager</h1>
                    <p className="text-gray-400 mt-1">Control which resume designs are available to users.</p>
                </div>
                {!isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={seedReactDefaults}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium border border-white/10"
                        >
                            <Layout className="w-4 h-4" /> Seed React Defaults
                        </button>
                        <button
                            onClick={seedLatexDefaults}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium border border-white/10"
                        >
                            <FileCode className="w-4 h-4" /> Seed LaTeX Defaults
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Template
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Template Form */}
            {isEditing && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Template' : 'Add New Template'}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'react' })}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formData.type === 'react' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400'}`}
                            >
                                React Component
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'latex' })}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formData.type === 'latex' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-800 text-gray-400'}`}
                            >
                                LaTeX Studio
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Template Name"
                            value={formData.name || ""}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="glass-input p-3 rounded-xl"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={formData.description || ""}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="glass-input p-3 rounded-xl"
                        />
                        <input
                            type="text"
                            placeholder="Preview Image URL"
                            value={formData.imageUrl || ""}
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="glass-input p-3 rounded-xl"
                        />
                        {formData.type === 'react' && (
                            <input
                                type="text"
                                placeholder="Component Key (e.g. 'modern')"
                                value={formData.componentKey || ""}
                                onChange={e => setFormData({ ...formData, componentKey: e.target.value })}
                                className="glass-input p-3 rounded-xl border-blue-500/30"
                            />
                        )}
                    </div>

                    {/* LaTeX Editor Area */}
                    {formData.type === 'latex' && (
                        <div className="mb-6">
                            <div className="text-xs text-gray-400 mb-2 flex justify-between">
                                <span>LaTeX Source Files</span>
                                <span className="text-orange-400">Handlebars syntax supported: {"\\name{ {{fullName}} }"}</span>
                            </div>
                            <LatexCodeEditor
                                files={formData.files || []}
                                onChange={(files) => setFormData({ ...formData, files })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Template
                        </button>
                    </div>
                </div>
            )}

            {/* Template List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="h-48 bg-gray-900 relative">
                                {template.imageUrl ? (
                                    <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-gray-600">
                                        <Layout className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${template.type === 'latex' ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' : 'bg-blue-500/20 border-blue-500/50 text-blue-200'}`}>
                                        {template.type === 'latex' ? 'LaTeX' : 'React'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${template.isActive ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {template.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <button
                                        onClick={() => startEdit(template)}
                                        className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => toggleActive(template.id!, template.isActive)}
                                        className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        {template.isActive ? (
                                            <><X className="w-4 h-4" /> Disable</>
                                        ) : (
                                            <><Check className="w-4 h-4" /> Enable</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(template.id!)}
                                        className="text-sm font-medium text-red-500/50 hover:text-red-500 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No templates found. Add your first one above!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
