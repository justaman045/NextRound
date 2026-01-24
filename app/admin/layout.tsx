"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Menu, X, Triangle, LayoutDashboard, Users, FileStack, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || user.email !== ADMIN_EMAIL) {
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Simple Sidebar for Admin */}
            <aside className="w-64 border-r border-white/10 p-6 hidden md:flex flex-col">
                <div className="mb-8 flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <Triangle className="w-4 h-4 text-black fill-current" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            NextRound
                        </h2>
                        <div className="text-xs text-purple-200/50 uppercase tracking-widest mt-0.5">Admin Console</div>
                    </div>
                </div>

                <nav className="space-y-4">
                    <Link
                        href="/admin"
                        className={`block px-4 py-2 rounded-lg transition-colors font-medium ${pathname === '/admin'
                            ? 'bg-white/5 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Overview
                    </Link>
                    <Link
                        href="/admin/users"
                        className={`block px-4 py-2 rounded-lg transition-colors font-medium ${pathname?.startsWith('/admin/users')
                            ? 'bg-white/5 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Users
                    </Link>
                    <Link
                        href="/admin/templates"
                        className={`block px-4 py-2 rounded-lg transition-colors font-medium ${pathname?.startsWith('/admin/templates')
                            ? 'bg-white/5 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Templates
                    </Link>
                    <Link
                        href="/admin/integrations"
                        className={`block px-4 py-2 rounded-lg transition-colors font-medium ${pathname?.startsWith('/admin/integrations')
                            ? 'bg-white/5 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Integrations
                    </Link>
                </nav>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 p-4 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Triangle className="w-3 h-3 text-black fill-current" />
                    </div>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">NextRound</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400">
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black pt-20 p-6 animate-in slide-in-from-top duration-300">
                    <nav className="space-y-4">
                        <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/admin' ? 'bg-white/5 text-white' : 'text-gray-400'}`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Overview
                        </Link>
                        <Link
                            href="/admin/users"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname?.startsWith('/admin/users') ? 'bg-white/5 text-white' : 'text-gray-400'}`}
                        >
                            <Users className="w-5 h-5" />
                            Users
                        </Link>
                        <Link
                            href="/admin/templates"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname?.startsWith('/admin/templates') ? 'bg-white/5 text-white' : 'text-gray-400'}`}
                        >
                            <FileStack className="w-5 h-5" />
                            Templates
                        </Link>
                        <Link
                            href="/admin/integrations"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname?.startsWith('/admin/integrations') ? 'bg-white/5 text-white' : 'text-gray-400'}`}
                        >
                            <LinkIcon className="w-5 h-5" />
                            Integrations
                        </Link>
                    </nav>
                </div>
            )}

            <main className="flex-1 p-8 overflow-y-auto mt-16 md:mt-0">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
