import { useState, useEffect } from "react";
import { TemplateFile } from "@/types";
import { Plus, Trash2, FileCode, File, Save, Wand2, Loader2 } from "lucide-react";
import { convertLatexToTemplate } from "@/actions/convertLatex";

interface Props {
    files: TemplateFile[];
    onChange: (files: TemplateFile[]) => void;
}

export default function LatexCodeEditor({ files, onChange }: Props) {
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
    const [newFileName, setNewFileName] = useState("");
    const [isAddingFile, setIsAddingFile] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    // Ensure there's always at least one file if empty
    useEffect(() => {
        if (files.length === 0) {
            onChange([{ path: "main.tex", content: "% Start writing your LaTeX here..." }]);
        }
    }, [files, onChange]);

    const activeFile = files[selectedFileIndex] || files[0];

    const handleContentChange = (content: string) => {
        const newFiles = [...files];
        if (newFiles[selectedFileIndex]) {
            newFiles[selectedFileIndex] = { ...newFiles[selectedFileIndex], content };
            onChange(newFiles);
        }
    };

    const addFile = () => {
        if (!newFileName.trim()) return;
        // Check for duplicate
        if (files.some(f => f.path === newFileName)) {
            alert("File already exists");
            return;
        }

        const newFiles = [...files, { path: newFileName, content: "" }];
        onChange(newFiles);
        setSelectedFileIndex(newFiles.length - 1);
        setNewFileName("");
        setIsAddingFile(false);
    };

    const deleteFile = (index: number) => {
        if (files.length <= 1) {
            alert("You must have at least one file.");
            return;
        }
        if (!confirm("Delete this file?")) return;

        const newFiles = files.filter((_, i) => i !== index);
        onChange(newFiles);
        setSelectedFileIndex(0);
    };

    const handleAutoConvert = async () => {
        if (!activeFile) return;
        if (!confirm("This will replace the current file content with an AI-generated template. Continue?")) return;

        setIsConverting(true);
        try {
            const converted = await convertLatexToTemplate(activeFile.content);

            // Check if output is multi-file JSON
            try {
                const parsedFiles = JSON.parse(converted);
                if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
                    // Multi-file output - replace all files
                    onChange(parsedFiles);
                    setSelectedFileIndex(0);
                    alert(`Successfully converted! Generated ${parsedFiles.length} files.`);
                } else {
                    // Single file output
                    handleContentChange(converted);
                }
            } catch {
                // Not JSON, treat as single file
                handleContentChange(converted);
            }
        } catch (error) {
            console.error("Conversion failed:", error);
            alert("Failed to convert template. Check the console for details.");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[500px] border border-white/10 rounded-xl overflow-hidden bg-[#1e1e1e]">
            {/* Sidebar: File Explorer */}
            <div className="w-full md:w-64 bg-[#252526] flex flex-col border-b md:border-b-0 md:border-r border-white/5">
                <div className="p-3 bg-[#333333] text-xs font-bold text-gray-300 uppercase tracking-wider flex justify-between items-center">
                    <span>Explorer</span>
                    <button
                        onClick={() => setIsAddingFile(true)}
                        className="text-gray-400 hover:text-white"
                        title="New File"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {isAddingFile && (
                    <div className="p-2 bg-[#3c3c3c]">
                        <input
                            autoFocus
                            type="text"
                            placeholder="filename.tex"
                            className="w-full bg-black/20 text-white text-xs p-1 rounded border border-white/10 focus:border-purple-500 outline-none"
                            value={newFileName}
                            onChange={e => setNewFileName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') addFile();
                                if (e.key === 'Escape') setIsAddingFile(false);
                            }}
                            onBlur={() => { if (!newFileName) setIsAddingFile(false) }}
                        />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {files.map((file, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedFileIndex(idx)}
                            className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-[#2a2d2e] group ${selectedFileIndex === idx ? 'bg-[#37373d] text-white' : 'text-gray-400'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {file.path.endsWith('.tex') ? <FileCode className="w-4 h-4 text-blue-400" /> : <File className="w-4 h-4 text-gray-500" />}
                                <span className="truncate">{file.path}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteFile(idx); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main: Code Editor */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                {activeFile ? (
                    <>
                        <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-4 text-xs text-gray-400 border-b border-black/20">
                            <span>{activeFile.path}</span>
                            {/* Magic Wand Button */}
                            {activeFile.path.endsWith('.tex') && (
                                <button
                                    onClick={handleAutoConvert}
                                    disabled={isConverting}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                >
                                    {isConverting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    Auto-Convert to Template
                                </button>
                            )}
                        </div>
                        <textarea
                            className="flex-1 w-full bg-[#1e1e1e] text-gray-300 p-4 font-mono text-sm resize-none outline-none focus:ring-0 leading-relaxed"
                            value={activeFile.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            spellCheck={false}
                            placeholder="% Enter your LaTeX code here..."
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                        Select a file to edit
                    </div>
                )}
            </div>
        </div>
    );
}
