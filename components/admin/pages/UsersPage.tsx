"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { Loader2, Mail, Search } from "lucide-react";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    plan: string;
    lastLogin: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Determine which collection to fetch.
                // Prioritize the real 'users' collection if populated by AuthContext
                const usersRef = collection(db, "users");
                // Note: Indexing might be required for ordering
                const q = query(usersRef);
                const snapshot = await getDocs(q);

                const loadedUsers: UserData[] = [];

                // Fetch all users in parallel
                await Promise.all(snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    let plan = data.plan;

                    // Fallback: Check subcollection if plan is missing or just 'user' default
                    if (!plan || plan === 'user') {
                        try {
                            const subDoc = await getDoc(doc(db, "users", docSnap.id, "subscription", "details"));
                            if (subDoc.exists()) {
                                plan = subDoc.data().plan;
                            }
                        } catch (e) {
                            // ignore error, default to free
                        }
                    }

                    loadedUsers.push({
                        uid: docSnap.id,
                        email: data.email || "",
                        displayName: data.displayName || "Unknown",
                        plan: plan || "free",
                        lastLogin: data.lastLogin
                    });
                }));

                // If no users found (and likely because we just added the sync logic), 
                // we could also fetch 'waitlist' as a fallback or just show empty.
                setUsers(loadedUsers);

            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Directory</h1>
                    <p className="text-gray-400 mt-1">Manage and contact your registered users.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass-input pl-10 pr-4 py-2 rounded-xl text-sm w-64"
                    />
                </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-2xl border border-white/5">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-medium">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Plan</th>
                            <th className="p-4">Last Active</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{user.displayName}</div>
                                        <div className="text-gray-500 text-xs">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${user.plan === 'pro' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700/50 text-gray-400'
                                            }`}>
                                            {user.plan === 'pro' ? 'Pro (Paid)' : user.plan === 'pro_saver' ? 'Pro Saver' : 'Free Tier'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <a
                                            href={`mailto:${user.email}?subject=Message from NextRound Admin`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                                        >
                                            <Mail className="w-3 h-3" /> Email
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No users found. Try singing in via the app to populate this list.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
