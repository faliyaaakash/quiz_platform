import React, { useState, useEffect } from 'react';
import {
    User as UserIcon, BookOpen, Award, Camera,
    Edit2, Github, Linkedin, Twitter, MapPin,
    Globe, ExternalLink, Calendar, Zap, LayoutGrid, History,
    TrendingUp, BadgeCheck, PencilLine, Lock
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import { User, UserStats } from '../types';
import { authService } from '../services/authService';
import { quizService } from '../services/quizService';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'quizzes' | 'achievements' | 'settings'>('overview');

    const [editForm, setEditForm] = useState({
        fullName: '',
        bio: '',
        location: '',
        website: '',
        avatar: '',
        coverImage: '',
        skills: [] as string[],
        socialLinks: {
            github: '',
            linkedin: '',
            twitter: ''
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, statsData] = await Promise.all([
                    authService.getProfile(),
                    quizService.getUserStats()
                ]);

                // Merge with mock/default data for enhanced fields
                const enhancedUser: User = {
                    ...profileData,
                    bio: profileData.bio || "Assessment enthusiast | Lifelong learner | Mastering new skills through interactive quizzes.",
                    location: profileData.location || "San Francisco, CA",
                    website: profileData.website || "https://quizhub.example.com",
                    coverImage: profileData.coverImage || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200",
                    skills: profileData.skills || ["React", "TypeScript", "General Content", "Problem Solving"],
                    socialLinks: profileData.socialLinks || { github: "https://github.com", linkedin: "https://linkedin.com", twitter: "https://twitter.com" }
                };

                setUser(enhancedUser);
                setStats(statsData);
                setEditForm({
                    fullName: enhancedUser.fullName,
                    bio: enhancedUser.bio || '',
                    location: enhancedUser.location || '',
                    website: enhancedUser.website || '',
                    avatar: enhancedUser.avatar || '',
                    coverImage: enhancedUser.coverImage || '',
                    skills: enhancedUser.skills || [],
                    socialLinks: {
                        github: enhancedUser.socialLinks?.github || '',
                        linkedin: enhancedUser.socialLinks?.linkedin || '',
                        twitter: enhancedUser.socialLinks?.twitter || ''
                    }
                });
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = () => {
        if (!user) return;
        const updatedUser = {
            ...user,
            ...editForm
        };
        setUser(updatedUser);
        setActiveTab('overview');
        // Note: API call to save goes here
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="text-slate-400 font-bold animate-pulse">Building your profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!user || !stats) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'quizzes', label: 'Quizzes', icon: History },
        { id: 'achievements', label: 'Achievements', icon: BadgeCheck },
        { id: 'settings', label: 'Settings', icon: Edit2 },
    ] as const;

    return (
        <DashboardLayout>
            <div className="max-w-[1100px] mx-auto pb-20 select-none">

                {/* 🎨 HEADER SECTION */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 mb-8 relative">
                    {/* Cover Image */}
                    <div className="h-48 md:h-64 relative group">
                        <img
                            src={user.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                        <button className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-slate-700 hover:text-primary transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100">
                            <Camera size={20} />
                        </button>
                    </div>

                    {/* Profile Header Info */}
                    <div className="px-6 md:px-12 pb-8 pt-0 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white p-1.5 shadow-2xl">
                                    <div className="w-full h-full rounded-[2.2rem] bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={64} className="text-slate-300" />
                                        )}
                                    </div>
                                </div>
                                <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-primary-hover transition-all scale-90 md:scale-100">
                                    <Camera size={20} />
                                </button>
                            </div>

                            {/* Name & Bio */}
                            <div className="flex-1 text-center md:text-left pt-4 space-y-3">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-text-dark tracking-tight flex items-center justify-center md:justify-start gap-3">
                                        {user.fullName}
                                        <BadgeCheck className="text-primary fill-current bg-white rounded-full" size={24} />
                                    </h1>
                                    <p className="text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">{user.bio}</p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-400">
                                    <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
                                        <MapPin size={16} /> <span>{user.location}</span>
                                    </div>
                                    <a href={user.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors text-slate-500">
                                        <Globe size={16} /> <span>Website</span>
                                    </a>
                                    <div className="flex items-center gap-1.5 cursor-default">
                                        <Calendar size={16} /> <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Socials & Action */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 justify-center md:justify-end">
                                    {user.socialLinks?.github && (
                                        <a href={user.socialLinks.github} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 transition-all border border-slate-100">
                                            <Github size={18} />
                                        </a>
                                    )}
                                    {user.socialLinks?.linkedin && (
                                        <a href={user.socialLinks.linkedin} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:text-[#0077b5] hover:bg-slate-100 transition-all border border-slate-100">
                                            <Linkedin size={18} />
                                        </a>
                                    )}
                                    {user.socialLinks?.twitter && (
                                        <a href={user.socialLinks.twitter} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:text-[#1da1f2] hover:bg-slate-100 transition-all border border-slate-100">
                                            <Twitter size={18} />
                                        </a>
                                    )}
                                </div>
                                <Button onClick={() => setActiveTab('settings')} className="flex items-center gap-2 shadow-xl shadow-primary/20">
                                    <PencilLine size={18} /> Update Profile
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 px-6 md:px-12 border-t border-slate-100 bg-slate-50/30">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-5 text-sm font-black transition-all relative ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="profileTabAlpha"
                                            className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* 📊 OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Core Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: "Quizzes", val: stats.totalQuizzesTaken, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
                                        { label: "Avg. Score", val: `${stats.averageScore}%`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
                                        { label: "Topics", val: stats.completedTopics, icon: Zap, color: "bg-amber-50 text-amber-600" },
                                        { label: "Achievements", val: "12", icon: Award, color: "bg-purple-50 text-purple-600" }
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-lg transition-all group">
                                            <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                <s.icon size={28} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                                                <h3 className="text-2xl font-black text-text-dark">{s.val}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Skills & Bio Details */}
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                                                <Zap className="text-amber-500" size={20} /> Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {user.skills?.map((skill, i) => (
                                                    <span key={i} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-100 hover:border-primary/30 hover:text-primary transition-colors cursor-default">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="h-px bg-slate-100"></div>

                                            <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                                                <MapPin className="text-rose-500" size={20} /> Location
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500">{user.location}</p>
                                        </div>

                                        {/* Activity Heatmap Mockup */}
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                                                <Calendar className="text-primary" size={20} /> Activity
                                            </h3>
                                            <div className="flex gap-[4px] flex-wrap">
                                                {[...Array(96)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-[12px] h-[12px] rounded-sm ${i % 7 === 0 ? 'bg-indigo-500' : i % 5 === 0 ? 'bg-indigo-300' : i % 3 === 0 ? 'bg-indigo-100' : 'bg-slate-50'}`}
                                                    ></div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">Activity in the last 12 months</p>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-2xl font-black text-text-dark">Recent Activity</h3>
                                            <button onClick={() => setActiveTab('quizzes')} className="text-primary font-bold text-sm hover:underline">See full history</button>
                                        </div>
                                        <div className="space-y-4">
                                            {stats.recentActivity.map((activity, i) => (
                                                <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-primary/20 hover:shadow-xl transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-primary text-xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                                            {activity.category ? activity.category[0] : 'Q'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-text-dark group-hover:text-primary transition-colors text-lg">{activity.title}</h4>
                                                            <p className="text-sm text-slate-400 font-bold tracking-tight">
                                                                {activity.category || 'General'} • {new Date(activity.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-xl font-black ${activity.percentage >= 90 ? 'text-emerald-500' : 'text-text-dark'}`}>
                                                            {activity.score}/{activity.totalMarks}
                                                        </div>
                                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Score</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 📚 QUIZZES TAB */}
                        {activeTab === 'quizzes' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-text-dark px-2">Assessment History</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {stats.attemptHistory.map((attempt, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all flex justify-between items-center group">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-text-dark group-hover:text-primary transition-colors">{attempt.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{attempt.category}</span>
                                                    <span>{new Date(attempt.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-text-dark">{attempt.percentage}%</div>
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className={`h-full ${attempt.percentage >= 80 ? 'bg-emerald-500' : attempt.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${attempt.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 🏆 ACHIEVEMENTS TAB */}
                        {activeTab === 'achievements' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { title: "Quiz Maven", desc: "First 10 quizzes done", icon: Award, color: "from-amber-400 to-orange-500", achieved: true },
                                        { title: "Perfect Score", desc: "Get 100% on a quiz", icon: BadgeCheck, color: "from-blue-400 to-indigo-600", achieved: true },
                                        { title: "Fast Hand", desc: "Finish quiz under 1min", icon: Zap, color: "from-purple-400 to-pink-500", achieved: true },
                                        { title: "Streak Master", desc: "7 day login streak", icon: TrendingUp, color: "from-emerald-400 to-teal-600", achieved: false }
                                    ].map((badge, i) => (
                                        <div key={i} className={`p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm text-center space-y-4 relative overflow-hidden group ${!badge.achieved && 'opacity-50 grayscale'}`}>
                                            {!badge.achieved && (
                                                <div className="absolute inset-0 bg-slate-100/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                                                    <Lock size={20} className="text-slate-400" />
                                                </div>
                                            )}
                                            <div className={`w-20 h-20 bg-linear-to-br ${badge.color} rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform duration-500`}>
                                                <badge.icon size={40} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-dark">{badge.title}</h4>
                                                <p className="text-xs text-slate-400 font-medium">{badge.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ⚙️ SETTINGS TAB */}
                        {activeTab === 'settings' && (
                            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <h3 className="text-2xl font-black text-text-dark">Edit Profile</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setActiveTab('overview')}>Cancel</Button>
                                        <Button onClick={handleSave}>Save Changes</Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editForm.fullName}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary transition-all font-bold text-text-dark"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                                        <input
                                            type="text"
                                            value={editForm.location}
                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary transition-all font-bold text-text-dark"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bio</label>
                                        <textarea
                                            rows={3}
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary transition-all font-bold text-text-dark resize-none"
                                        ></textarea>
                                    </div>

                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Social Connections</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                <Github size={14} /> <span className="text-[10px] font-black uppercase">Github</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.socialLinks.github}
                                                onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, github: e.target.value } })}
                                                placeholder="URL"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                <Linkedin size={14} /> <span className="text-[10px] font-black uppercase">Linkedin</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.socialLinks.linkedin}
                                                onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, linkedin: e.target.value } })}
                                                placeholder="URL"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                <Twitter size={14} /> <span className="text-[10px] font-black uppercase">Twitter</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.socialLinks.twitter}
                                                onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, twitter: e.target.value } })}
                                                placeholder="URL"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;
