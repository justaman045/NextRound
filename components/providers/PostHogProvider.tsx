"use client";

import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PostHogPageView({ client }: { client: any }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname && client) {
            let url = window.origin + pathname;
            if (searchParams && searchParams.toString()) {
                url = url + `?${searchParams.toString()}`;
            }
            client.capture('$pageview', {
                '$current_url': url,
            });
        }
    }, [pathname, searchParams, client]);

    return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
    const [client, setClient] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (
            process.env.NEXT_PUBLIC_POSTHOG_KEY &&
            process.env.NEXT_PUBLIC_POSTHOG_HOST
        ) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
                person_profiles: 'identified_only',
                capture_pageview: false,
                persistence: 'localStorage'
            });
            setClient(posthog);
        }
    }, []);

    // On server or before mount, just render children to avoid mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    // On client, if we have a client, use Provider. 
    // If no key was provided, client will be null, so we just return children.
    if (!client) {
        return <>{children}</>;
    }

    return (
        <Provider client={client}>
            <Suspense fallback={null}>
                <PostHogPageView client={client} />
            </Suspense>
            {children}
        </Provider>
    );
}
