import ProfilePageContent from "@/components/dashboard/ProfilePageContent";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}
