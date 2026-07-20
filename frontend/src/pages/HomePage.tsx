//home page
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Timer, BarChart3, 
  ShieldAlert, Lock, 
  FileText, Globe, 
  Layout, ArrowRight,
  ChevronRight, Play, User as UserIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types/user';
import Footer from '../components/Footer';


const HomePage: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.05], [1, 0.95]);

    const [user, setUser] = useState<User | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            authService.getProfile()
                .then(profile => setUser(profile))
                .catch(() => { /* handled globally by apiClient */ });
        }
    }, [token]);

    const features = [
        {
            icon: ShieldAlert,
            title: "Proctored Environment",
            description: "Advanced anti-cheat measures including tab-switching detection, copy-paste disabling, and webcam monitoring to ensure exam integrity.",
            color: "bg-orange-100 text-orange-600"
        },
        {
            icon: Timer,
            title: "Real-Time Timed Tests",
            description: "Precision timing for every quiz. Set overall limits or per-question timers to challenge your audience effectively.",
            color: "bg-emerald-100 text-emerald-600"
        },
        {
            icon: BarChart3,
            title: "Performance Analytics",
            description: "Deep dive into results with detailed metrics, passing rates, and individual performance tracking over time.",
            color: "bg-blue-100 text-blue-600"
        },
        {
            icon: FileText,
            title: "Bulk Import (CSV/PDF)",
            description: "Don't waste time typing. Upload your existing questions via CSV or PDF and have your quiz ready in seconds.",
            color: "bg-purple-100 text-purple-600"
        },
        {
            icon: Layout,
            title: "Six Question Types",
            description: "Choose from MCQ, Multi-Select, True/False, Short Answer, Paragraph, or even Code Snippets for technical assessments.",
            color: "bg-amber-100 text-amber-600"
        },
        {
            icon: Globe,
            title: "Global Accessibility",
            description: "Share your quizzes with a secure, unique link. Control access with start/end windows and attempt limits.",
            color: "bg-indigo-100 text-indigo-600"
        }
    ];

    const steps = [
        { title: "Sign Up", desc: "Create your free account in seconds with Google or email." },
        { title: "Build Your Quiz", desc: "Use our intuitive editor or import questions in bulk." },
        { title: "Configure Integrity", desc: "Enable anti-cheat tools to ensure a fair environment." },
        { title: "Share & Analyze", desc: "Send the secure link and watch real-time results roll in." }
    ];

    const categories = [
        { name: "Programming", icon: "💻", count: "1.2k+ Quizzes" },
        { name: "Aptitude", icon: "🧠", count: "850+ Quizzes" },
        { name: "General Knowledge", icon: "🌍", count: "2.1k+ Quizzes" },
        { name: "Science", icon: "🔬", count: "600+ Quizzes" },
        { name: "Mathematics", icon: "📐", count: "450+ Quizzes" },
        { name: "Design", icon: "🎨", count: "300+ Quizzes" }
    ];

    return (
        <div className="bg-white selection:bg-primary selection:text-white overflow-x-hidden select-none">
            
            {/* 🚀 NAVIGATION */}
            <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="QuizHub Logo" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-black text-text-dark tracking-tighter">Quiz<span className="text-primary">Hub</span></span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'About', 'How it Works', 'Categories'].map(item => (
                            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest">{item}</a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {token ? (
                            <Link to="/my-quizzes" className="flex items-center gap-3 no-underline group p-1.5 pr-4 border border-slate-200 rounded-full hover:border-[#4f46e5] hover:shadow-sm transition-all bg-white">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#eef2ff] group-hover:text-[#4f46e5] transition-all overflow-hidden border border-slate-200">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={16} />
                                    )}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-[0.75rem] font-bold text-slate-700 group-hover:text-[#4f46e5] leading-tight flex flex-col">
                                        <span className="text-[0.65rem] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Dashboard</span>
                                        {user?.fullName || 'My Account'}
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-text-dark hover:text-primary transition-colors">Login</Link>
                                <Link to="/signup" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* 🔥 HERO SECTION */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

                <motion.div 
                    style={{ opacity, scale }}
                    className="max-w-4xl text-center space-y-8"
                >
                    

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black text-text-dark leading-[0.95] tracking-tight"
                    >
                        Assess with <span className="text-primary">Integrity</span>. <br />Learn with Passion.
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        Empower your teaching and testing with real-time proctoring, 
                        deep analytics, and a seamless experience for creators and learners alike.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        {token ? (
                            <Link to="/my-quizzes" className="w-full sm:w-auto px-10 py-5 bg-text-dark text-white rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3">
                                Go to Dashboard <ArrowRight size={20} />
                            </Link>
                        ) : (
                            <Link to="/signup" className="w-full sm:w-auto px-10 py-5 bg-text-dark text-white rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3">
                                Start for Free <ArrowRight size={20} />
                            </Link>
                        )}
                        <button 
                            onClick={() => document.getElementById('app-walkthrough')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-100 text-text-dark rounded-2xl font-black text-lg hover:border-primary/30 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Play size={20} className="fill-current group-hover:text-primary transition-colors" /> View Demo
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 🧠 ABOUT SECTION */}
            <section id="about" className="py-32 px-6 bg-slate-50/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-black text-text-dark tracking-tight">Mission Critical: <br /><span className="text-primary text-3xl md:text-4xl">Academic Integrity Reimagined</span></h2>
                            <p className="text-lg text-text-muted leading-relaxed font-medium">
                                In an era of digital learning, maintaining the sanctity of assessments is harder than ever. 
                                QuizHub was born from the need for a platform that doesn't just deliver questions, 
                                but build a trustworthy environment for feedback and evaluation.
                            </p>
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div>
                                    <h4 className="text-2xl font-black text-text-dark mb-1 underline decoration-primary decoration-4 underline-offset-4">Secure</h4>
                                    <p className="text-sm text-text-muted font-bold uppercase tracking-widest">By Design</p>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-text-dark mb-1 underline decoration-primary decoration-4 underline-offset-4">Data-Driven</h4>
                                    <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Real Results</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="aspect-square bg-linear-to-br from-primary to-indigo-600 rounded-[4rem] rotate-3 opacity-10 absolute inset-0"></div>
                        <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 z-10 transition-transform hover:-rotate-1 duration-500">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-text-dark text-xl leading-none">Smart Proctoring</h3>
                                    <p className="text-text-muted text-sm font-bold mt-1">AI-Powered Monitoring</p>
                                </div>
                             </div>
                             <div className="space-y-4">
                                {[
                                    { label: "Tab Switching Detection", val: 100 },
                                    { label: "Webcam Integrity Check", val: 100 },
                                    { label: "Copy-Paste Restrictions", val: 100 }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-sm font-black text-text-dark">
                                            <span>{item.label}</span>
                                            <span>Active</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "100%" }}
                                                transition={{ duration: 1, delay: i * 0.2 }}
                                                className="h-full bg-primary"
                                            ></motion.div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ⚡ DETAILED FEATURES */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-4 mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-text-dark tracking-tight">Everything you need to <span className="text-primary italic">Assess Smarter</span></h2>
                        <p className="text-text-muted max-w-2xl mx-auto font-medium">From classroom teachers to corporate trainers, QuizHub provides the heavy-duty tools required for professional assessments.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-black text-text-dark mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-text-muted leading-relaxed font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 📂 CATEGORIES */}
            <section id="categories" className="py-32 px-6 bg-text-dark text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="grid grid-cols-6 h-full border-x border-white/20">
                        {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white/20 h-full"></div>)}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Explore <span className="text-primary">Domains</span></h2>
                            <p className="text-slate-400 font-medium max-w-md">Find specialized quizzes across 50+ categories curated by industry experts.</p>
                        </div>
                        <button className="flex items-center gap-2 font-black text-primary hover:text-white transition-colors group">
                            View All Categories <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl text-center flex flex-col items-center gap-4 hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <span className="text-4xl">{cat.icon}</span>
                                <div>
                                    <h4 className="font-black text-sm mb-1">{cat.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{cat.count}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🛠 HOW IT WORKS */}
            <section id="how-it-works" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-text-dark tracking-tight">Your Journey to <span className="text-primary">Success</span></h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden lg:block absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-slate-100 -z-10"></div>
                        
                        {steps.map((step, i) => (
                            <div key={i} className="text-center flex flex-col items-center group">
                                <div className="w-14 h-14 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-text-dark mb-6 group-hover:border-primary/20 group-hover:text-primary transition-all shadow-xl shadow-slate-200/50">
                                    {i + 1}
                                </div>
                                <h3 className="text-lg font-black text-text-dark mb-3">{step.title}</h3>
                                <p className="text-text-muted text-sm font-medium leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🖥 APP WALKTHROUGH */}
            <section id="app-walkthrough" className="py-32 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-text-dark tracking-tight">See <span className="text-primary italic">QuizHub</span> in Action</h2>
                        <p className="text-text-muted max-w-2xl mx-auto font-medium lead-relaxed">Experience the seamless flow from quiz creation to real-time proctored assessments. Our platform is designed for precision and ease of use.</p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[3rem] shadow-3xl overflow-hidden border border-slate-200 relative group p-2 md:p-4"
                    >
                         {/* Browser Bar Mockup */}
                         <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center gap-2 rounded-t-[2rem]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                            </div>
                            <div className="mx-auto bg-white px-8 py-1.5 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-200 flex items-center gap-2">
                                <Lock size={12} className="text-emerald-500" /> https://quizhub.com/demo
                            </div>
                         </div>

                         {/* Actual Video Content */}
                         <div className="relative aspect-video rounded-b-[2rem] overflow-hidden bg-text-dark">
                            <img 
                                src="/assets/walkthrough.webp" 
                                className="w-full h-full object-cover"
                                alt="QuizHub Walkthrough Demo"
                                loading="lazy"
                            />
                            
                            {/* Overlay Branding */}
                            <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Demo</span>
                            </div>
                         </div>

                         {/* Floating Caption */}
                         <div className="absolute bottom-10 left-10 right-10 flex justify-center pointer-events-none">
                            <div className="bg-text-dark/80 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl transition-all group-hover:translate-y-[-10px]">
                                <p className="text-white font-bold text-center flex items-center gap-3">
                                    <Globe size={18} className="text-primary" />
                                    Experience the world's most secure quiz platform
                                </p>
                            </div>
                         </div>
                    </motion.div>
                </div>
            </section>

            {/* 🚀 CTA SECTION */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>
                
                <div className="max-w-7xl mx-auto rounded-[3.5rem] bg-primary p-12 md:p-24 text-center text-white relative overflow-hidden">
                    {/* Decorative Circles */}
                    <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
                            Stop Guessing. <br />Start measuring with precision.
                        </h2>
                        <p className="text-primary-foreground/80 text-lg md:text-xl font-medium max-w-xl mx-auto">
                            Join thousands of educators and creators who trust QuizHub for their evaluation needs.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            {token ? (
                                <Link to="/my-quizzes" className="w-full sm:w-auto px-12 py-5 bg-white text-primary rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-xl shadow-black/10">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/signup" className="w-full sm:w-auto px-12 py-5 bg-white text-primary rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-xl shadow-black/10">
                                        Create Free Account
                                    </Link>
                                    <Link to="/login" className="w-full sm:w-auto px-12 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 📌 MODERN FOOTER (Docker Style) */}
            <Footer />


        </div>
    );
};

export default HomePage;
