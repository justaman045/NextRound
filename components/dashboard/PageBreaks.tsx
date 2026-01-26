import React, { useEffect, useState } from 'react';

interface PageBreaksProps {
    contentRef: React.RefObject<HTMLDivElement | null>;
    scale: number;
    onPageCountChange?: (count: number) => void;
}

export default function PageBreaks({ contentRef, scale, onPageCountChange }: PageBreaksProps) {
    const [numPages, setNumPages] = useState(1);
    const PAGE_HEIGHT_MM = 297; // A4 height
    const MM_TO_PX = 3.7795275591;

    useEffect(() => {
        if (!contentRef.current) return;

        const updatePages = () => {
            if (contentRef.current) {
                const height = contentRef.current.scrollHeight;
                // The visual page height in the content's coordinate system increases as we scale down.
                // If scale is 0.5, we fit 2x more content, so the break is at 297 / 0.5 mm.
                const effectivePageHeightMm = PAGE_HEIGHT_MM / scale;
                const pageHeightPx = effectivePageHeightMm * MM_TO_PX;

                const pages = Math.ceil(height / pageHeightPx);
                const newCount = Math.max(1, pages);

                setNumPages(newCount);
                if (onPageCountChange) {
                    onPageCountChange(newCount);
                }
            }
        };

        updatePages();

        const observer = new ResizeObserver(updatePages);
        observer.observe(contentRef.current);

        return () => observer.disconnect();
    }, [contentRef, scale, onPageCountChange]);

    if (numPages <= 1) return null;

    const effectivePageHeightMm = PAGE_HEIGHT_MM / scale;

    return (
        <div className="absolute inset-0 pointer-events-none z-50" aria-hidden="true">
            {Array.from({ length: numPages - 1 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full flex items-center justify-center pointer-events-none print:hidden"
                    style={{
                        top: `${(i + 1) * effectivePageHeightMm}mm`,
                    }}
                >
                    {/* Visual Page Gap simulating separate sheets */}
                    <div className="w-full h-[24px] bg-[#222] border-y border-white/10 shadow-inner flex items-center justify-center relative translate-y-[-50%] backdrop-blur-sm">

                        {/* The Label */}
                        <div className="absolute right-4 text-[10px] font-mono text-gray-500 bg-[#222] px-2 py-0.5 rounded border border-white/5 opacity-70">
                            PAGE {i + 1} END
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
