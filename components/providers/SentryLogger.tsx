"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * SentryLogger interceptor
 * Automatically routes console.error and console.warn to Sentry in production.
 */
export default function SentryLogger() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;

        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args: any[]) => {
            // Capture the error in Sentry
            Sentry.captureMessage(`Console Error: ${args.map(a => 
                typeof a === 'object' ? JSON.stringify(a) : String(a)
            ).join(" ")}`, "error");
            
            // Still call the original console.error
            originalError.apply(console, args);
        };

        console.warn = (...args: any[]) => {
            // Capture the warning in Sentry
            Sentry.captureMessage(`Console Warn: ${args.map(a => 
                typeof a === 'object' ? JSON.stringify(a) : String(a)
            ).join(" ")}`, "warning");
            
            // Still call the original console.warn
            originalWarn.apply(console, args);
        };

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return null; // Side-effect only component
}
