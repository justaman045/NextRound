import { useEffect } from 'react';

export const useDynamicPagination = (containerRef: React.RefObject<HTMLDivElement | null>, dependency: any, scale: number = 1, enabled: boolean = true) => {
    useEffect(() => {
        if (!enabled) return;

        const container = containerRef.current;
        if (!container) return;

        // Configuration
        const PAGE_HEIGHT_MM = 297;
        const MM_TO_PX = 3.7795275591; // Standard 96 DPI
        const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX;
        const BUFFER_PX = 20; // Increased buffer

        // Helper to get total offset relative to the MAIN container
        const getRelativeTop = (el: HTMLElement): number => {
            let offset = 0;
            let current: HTMLElement | null = el;

            while (current && current !== container) {
                offset += current.offsetTop;
                current = current.offsetParent as HTMLElement;
            }
            return offset;
        };

        const runPagination = () => {
            // 1. Reset all manual margins first to get clean measurements
            const elements = container.querySelectorAll('.page-break-inside-avoid');
            elements.forEach((el) => {
                (el as HTMLElement).style.marginTop = '0px';
            });

            // 2. Measure and shift using Recursive Offset (Scale Independent & Nesting Safe)
            elements.forEach((el) => {
                const element = el as HTMLElement;

                // Get true layout distance from the top of the container
                // traversing up through any nested relative/absolute parents
                const relativeTop = getRelativeTop(element);
                const height = element.offsetHeight;
                const relativeBottom = relativeTop + height;

                // Page Calculations
                const pageIndex = Math.floor(relativeTop / PAGE_HEIGHT_PX);
                const nextPageBoundary = (pageIndex + 1) * PAGE_HEIGHT_PX;

                // Visual Bar Zone (24px height, centered on boundary)
                const BAR_HEIGHT = 24;
                const barTop = nextPageBoundary - (BAR_HEIGHT / 2);
                const barBottom = nextPageBoundary + (BAR_HEIGHT / 2);

                let shouldPush = false;

                // Check if element crosses or touches the visual break zone

                // Case A: Crosses boundary (Standard)
                if (relativeTop < nextPageBoundary && relativeBottom > nextPageBoundary) {
                    shouldPush = true;
                }

                // Case B: Overlaps the visual bar
                if (relativeTop < barBottom && relativeBottom > barTop) {
                    shouldPush = true;
                }

                if (shouldPush && height < PAGE_HEIGHT_PX) {
                    // Push to start of next page's safe area (below the visual bar)
                    const targetTop = barBottom + BUFFER_PX;

                    // Calculate margin needed.
                    // IMPORTANT: Margin is applied to the element itself.
                    // So we need to increase its top position by (targetTop - currentTop).
                    const pushAmount = targetTop - relativeTop;

                    if (pushAmount > 0) {
                        element.style.marginTop = `${pushAmount}px`;
                    }
                }
            });
        };

        // Run on load, dependency change, OR scale change
        const timer = setTimeout(runPagination, 100);

        // Also run on window resize ensures responsiveness
        window.addEventListener('resize', runPagination);

        return () => {
            window.removeEventListener('resize', runPagination);
            clearTimeout(timer);
        };
    }, [containerRef, dependency, scale]);
};
