export default function ProductShowcase() {
    return (
        <section className="py-20 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 animate-fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">See What Recruiters See</h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Our AI acts like an Applicant Tracking System (ATS), analyzing your resume against the job description to find gaps and optimize keywords.
                    </p>
                </div>

                {/* Glass Dashboard Mockup */}
                <div className="border border-white/10 bg-black/40 backdrop-blur-xl rounded-3xl p-4 md:p-8 shadow-2xl animate-fade-in-up delay-100 relative overflow-hidden">
                    {/* Mock Window Controls */}
                    <div className="flex items-center gap-2 mb-6 opacity-50">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* LEFT: Before */}
                        <div className="glass-panel p-6 rounded-xl border-red-500/20 bg-red-900/5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-red-300">Before Optimization</h3>
                                <span className="text-xs font-bold bg-red-500/20 text-red-300 px-2 py-1 rounded">Score: 45/100</span>
                            </div>
                            <div className="space-y-4 font-mono text-sm text-gray-400">
                                <div className="p-3 bg-black/20 rounded border border-white/5">
                                    &quot;Manage sales for the company.&quot;
                                </div>
                                <div className="p-3 bg-black/20 rounded border border-white/5">
                                    &quot;Used React to build the frontend.&quot;
                                </div>
                                <div className="p-3 bg-black/20 rounded border border-white/5 text-red-400/80">
                                    ⚠ Missing Keywords: SEO, Revenue Growth, TypeScript
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: After */}
                        <div className="glass-panel p-6 rounded-xl border-emerald-500/20 bg-emerald-900/5 relative">
                            {/* Glowing Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur-lg -z-10 opacity-50" />

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-emerald-300">After AI Tailoring</h3>
                                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">Score: 98/100</span>
                            </div>
                            <div className="space-y-4 font-mono text-sm text-gray-300">
                                <div className="p-3 bg-emerald-900/20 rounded border border-emerald-500/30">
                                    &quot;Spearheaded sales strategy generating <span className="text-emerald-400 font-bold">$1.2M in annual revenue</span>, outperforming targets by 15%.&quot;
                                </div>
                                <div className="p-3 bg-emerald-900/20 rounded border border-emerald-500/30">
                                    &quot;Architected scalable frontend using <span className="text-emerald-400 font-bold">React & TypeScript</span>, improving load times by 40%.&quot;
                                </div>
                                <div className="p-3 bg-emerald-900/20 rounded border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                                    ✓ All Keywords Matched
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
