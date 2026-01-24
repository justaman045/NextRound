import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: "Service Unavailable" }, { status: 503 });
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        // 1. Delete Firestore Data
        // Delete User Doc
        await adminDb.collection("users").doc(uid).delete();

        // Delete Resumes Subcollection manually (Firestore doesn't auto-recursive delete)
        const resumesSnapshot = await adminDb.collection("users").doc(uid).collection("resumes").get();
        const batch = adminDb.batch();
        resumesSnapshot.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 2. Delete Auth Account
        await adminAuth.deleteUser(uid);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete Account Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 });
    }
}
