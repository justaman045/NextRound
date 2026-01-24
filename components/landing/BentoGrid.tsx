import { FileText, Shield, Zap, Target } from "lucide-react";

export default function BentoGrid() {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">

                {/* Large Item */}
                <div className="md:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                            <Target className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Targeted Keywords</h3>
                            <p className="text-gray-400 text-lg">
                                We extract the exact skills required from the job description and inject them naturally into your resume&apos;s experience section.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tall Item */}
                <div className="row-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent" />
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Instant Generation</h3>
                        <p className="text-gray-400 mb-8 flex-grow">
                            Don&apos;t waste hours rewriting. Get a tailored PDF in less than 5 seconds.
                        </p>
                        {/* Mock Progress Bars */}
                        <div className="space-y-4">
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-3/4 animate-pulse" />
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-1/2 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Standard Item */}
                <div className="glass-panel p-8 rounded-3xl group hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">100% Private</h3>
                    <p className="text-gray-400">Your data never leaves your personal Firestore database.</p>
                </div>

                {/* Standard Item */}
                <div className="glass-panel p-8 rounded-3xl group hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ATS Formatting</h3>
                    <p className="text-gray-400">Clean, simple templates that robots can read easily.</p>
                </div>

            </div>
        </section>
    );
}
