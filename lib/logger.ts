/**
 * Centralized logger for NextRound
 * Silences logs in production and provides better labeling in development.
 */

import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    log: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`[NextRound] ${message}`, ...args);
        }
    },
    info: (message: string, ...args: any[]) => {
        if (isDev) {
            console.info(`[NextRound INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: any[]) => {
        if (isDev) {
            console.warn(`[NextRound WARN] ${message}`, ...args);
        }
        // Optionally send warnings to Sentry in production
        if (!isDev) {
            Sentry.captureMessage(message, { level: 'warning', extra: args });
        }
    },
    error: (message: string, error?: any, ...args: any[]) => {
        console.error(`[NextRound ERROR] ${message}`, error, ...args);
        
        // Always send errors to Sentry
        if (error) {
            Sentry.captureException(error, { extra: { message, ...args } });
        } else {
            Sentry.captureMessage(message, { level: 'error', extra: args });
        }
    }
};

export default logger;
