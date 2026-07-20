import React from 'react';
import { ShieldCheck, Timer, TrendingUp, CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: React.ReactNode;
    subtitle: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="auth-container flex-col lg:flex-row">
            {/* Left Section: Form */}
            <div className="flex-1 bg-bg-dark flex items-center justify-center py-12 px-6 md:p-8 text-text-white min-h-screen lg:min-h-0 select-none">
                <div className="max-w-[400px] w-full">
                    <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold mb-4 tracking-tight select-none">
                        {title}
                    </h1>
                    <div className="text-text-muted text-[0.9rem] md:text-[0.95rem] leading-relaxed mb-8 md:mb-10 select-none">
                        {subtitle}
                    </div>
                    {children}
                </div>
            </div>

            {/* Right Section: Branding */}
            <div className="brand-section hidden lg:flex">
                <div className="max-w-[600px] w-full">
                    <div className="relative w-full h-[400px] mb-16">
                        {/* Floating Cards */}
                        <div className="floating-card top-[12%] left-0">
                            <div className="icon-circle bg-linear-to-br from-[#fb923c] to-[#f97316]">
                                <ShieldCheck size={18} />
                            </div>
                            <span className="font-medium text-text-dark">Secure Exam Environment</span>
                        </div>
                        <div className="floating-card top-[35%] left-[-8%]">
                            <div className="icon-circle bg-linear-to-br from-[#4ade80] to-[#22c55e]">
                                <Timer size={18} />
                            </div>
                            <span className="font-medium text-text-dark">Real-Time Timed Tests</span>
                        </div>
                        <div className="floating-card bottom-[25%] right-[5%]">
                            <div className="icon-circle bg-linear-to-br from-[#facc15] to-[#eab308]">
                                <TrendingUp size={18} />
                            </div>
                            <span className="font-medium text-text-dark">Performance Analytics</span>
                        </div>

                        {/* Mockups */}
                        <div className="absolute top-[8%] right-[8%] w-[320px] h-[220px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-[#f1f5f9] p-3 border-b border-[#e2e8f0] flex gap-2">
                                <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f56]"></span>
                                <span className="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]"></span>
                                <span className="w-[10px] h-[10px] rounded-full bg-[#27c93f]"></span>
                            </div>
                            <div className="bg-[#f8fafc] h-full"></div>
                        </div>

                        <div className="absolute bottom-[8%] left-[45%] w-[170px] h-[340px] bg-[#475569] rounded-[32px] p-[14px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] border-2 border-[#64748b]">
                            <div className="bg-linear-to-b from-[#f8fafc] to-white h-full rounded-[20px] flex items-center justify-center">
                                <div className="w-16 h-16 bg-linear-to-br from-[#60a5fa] to-[#3b82f6] rounded-full flex items-center justify-center text-white shadow-[0_10px_15px_-3px_rgba(59,130,246,0.4)]">
                                    <CheckCircle2 size={32} />
                                </div>
                            </div>
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[45px] h-[5px] bg-[#334155] rounded-[3px]"></div>
                        </div>
                    </div>

                    <div className="why-us select-none">
                        <h2 className="text-[2.2rem] font-extrabold text-text-dark mb-[1.2rem] tracking-tight">Why Join Us</h2>
                        <p className="text-[#475569] leading-[1.7] text-lg">Experience the most interactive and data-driven quiz platform. Track your progress, compete with peers, and master new skills effortlessly.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
