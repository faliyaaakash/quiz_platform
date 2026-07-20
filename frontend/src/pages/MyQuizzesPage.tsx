import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreVertical, Plus, BookOpen, Clock, CheckCircle, FileText, X, Calendar, Download, Eye, Copy, Share2, Trash2, BarChart2, ListFilter, Loader2, CheckCheck, Check, AlertCircle, Edit2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { quizService } from '../services/quizService';
import { jsPDF } from 'jspdf';

// --- Mock Data ---

interface Quiz {
    id: string;
    title: string;
    category: string;
    questionCount: number;
    timeLimit: number; // in mins
    marks: number;
    status: 'draft' | 'published';
    createdAt: string;
    publishedAt?: string;
    attempts: number;
    avgScore: number;
    tags: string[];
    startDate?: string;
    endDate?: string;
}

interface AttemptedQuiz {
    id: string;
    quizTitle: string;
    category: string;
    score: number;
    totalMarks: number;
    timeTaken: number; // in mins
    submittedAt: string;
    status: 'passed' | 'failed' | 'completed';
}


const MyQuizzesPage: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResultsLoading, setIsResultsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'most_responses' | 'highest_avg'>('newest');

    const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
    const [attemptedQuizzes, setAttemptedQuizzes] = useState<AttemptedQuiz[]>([]);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'created' | 'attempted'>('created');
    const navigate = useNavigate();
    
    // Deletion Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    // Expire/Restart Modal State
    const [isExpireModalOpen, setIsExpireModalOpen] = useState(false);
    const [quizToExpire, setQuizToExpire] = useState<Quiz | null>(null);
    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    const [quizToRestart, setQuizToRestart] = useState<Quiz | null>(null);
    const [newEndDate, setNewEndDate] = useState('');
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    // Fetch user quizzes
    useEffect(() => {
        const fetchQuizzes = async () => {
            setIsLoading(true);
            try {
                const data = await quizService.getMyQuizzes();
                const formattedQuizzes: Quiz[] = data.map((q: any) => ({
                    id: q._id,
                    title: q.title,
                    category: q.category || 'Uncategorized',
                    questionCount: q.questions?.length || 0,
                    timeLimit: q.timeLimit || 0,
                    marks: q.totalMarks || 0,
                    status: q.isPublished ? 'published' : 'draft',
                    createdAt: q.createdAt,
                    publishedAt: q.publishedAt,
                    attempts: q.attempts || 0,
                    avgScore: q.avgScore || 0,
                    tags: q.tags || [],
                    startDate: q.startDate,
                    endDate: q.endDate,
                }));

                setQuizzes(formattedQuizzes);
            } catch (error) {
                // Error handled silently
                showToast("Failed to load quizzes", "error");
            } finally {
                setIsLoading(false);
            }
        };
        if (activeTab === 'created') {
            fetchQuizzes();
        }
    }, [activeTab]);

    // Fetch user results
    useEffect(() => {
        const fetchResults = async () => {
            setIsResultsLoading(true);
            try {
                const data = await quizService.getUserStats();
                const formattedResults: AttemptedQuiz[] = data.attemptHistory.map((a: any) => ({
                    id: a.id,
                    quizTitle: a.title,
                    category: a.category || 'Uncategorized',
                    score: a.score,
                    totalMarks: a.totalMarks,
                    timeTaken: 0, // Not provided by this endpoint currently
                    submittedAt: new Date(a.date).toLocaleString(),
                    status: a.isPassed ? 'passed' : 'failed'
                }));
                setAttemptedQuizzes(formattedResults);
            } catch (error) {
                // Error handled silently
            } finally {
                setIsResultsLoading(false);
            }
        };

        if (activeTab === 'attempted') {
            fetchResults();
        }
    }, [activeTab]);

    // Click outside to close active dropdown
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);

    const handleDownloadPDF = async (quiz: Quiz) => {
        setIsGeneratingPDF(quiz.id);
        try {
            const fullQuiz = await quizService.getQuiz(quiz.id);
            const doc = new jsPDF();
            
            // --- Header (Simple Word Style) ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            const title = fullQuiz.title.toUpperCase();
            const titleWidth = doc.getTextWidth(title);
            doc.text(title, (210 - titleWidth) / 2, 25);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Category: ${fullQuiz.category || 'General'}  |  Time: ${fullQuiz.timeLimit} Mins  |  Total Marks: ${fullQuiz.totalMarks}`, 20, 35);
            
            doc.setLineWidth(0.5);
            doc.line(20, 38, 190, 38);
            
            let currentY = 50;
            
            if (fullQuiz.description) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'italic');
                const descLines = doc.splitTextToSize(fullQuiz.description, 170);
                doc.text(descLines, 20, currentY);
                currentY += (descLines.length * 6) + 10;
            }
            
            // --- Questions List ---
            fullQuiz.questions.forEach((q: any, index: number) => {
                // Check for page break
                if (currentY > 260) {
                    doc.addPage();
                    currentY = 25;
                }
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                const questionLines = doc.splitTextToSize(`${index + 1}. ${q.text}`, 170);
                doc.text(questionLines, 20, currentY);
                currentY += (questionLines.length * 7);
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                if (q.options && q.options.length > 0) {
                    q.options.forEach((opt: string, optIdx: number) => {
                        if (currentY > 275) {
                            doc.addPage();
                            currentY = 25;
                        }
                        const label = String.fromCharCode(65 + optIdx);
                        doc.text(`${label}) ${opt}`, 25, currentY);
                        currentY += 7;
                    });
                }
                currentY += 8;
            });
            
            // --- Footer ---
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
            }
            
            doc.save(`${fullQuiz.title.replace(/\s+/g, '_')}_Question_Paper.pdf`);
            showToast("PDF Generated Successfully", "success");
        } catch (err) {
            console.error(err);
            showToast("Failed to generate PDF", "error");
        } finally {
            setIsGeneratingPDF(null);
        }
    };

    // Filtering & Sorting
    const filteredQuizzes = quizzes
        .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.category.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(q => statusFilter === 'all' ? true : q.status === statusFilter)
        .sort((a, b) => {
            const getSortTime = (q: Quiz) => {
                // Prioritize published time for published quizzes, otherwise creation time
                if (q.status === 'published' && q.publishedAt) return new Date(q.publishedAt).getTime();
                return new Date(q.createdAt).getTime();
            };

            if (sortOption === 'newest') return getSortTime(b) - getSortTime(a);
            if (sortOption === 'oldest') return getSortTime(a) - getSortTime(b);
            if (sortOption === 'most_responses') return b.attempts - a.attempts;
            if (sortOption === 'highest_avg') return b.avgScore - a.avgScore;
            return 0;
        });

    const isQuizActive = (quiz: Quiz) => {
        if (quiz.status !== 'published') return false;
        if (!quiz.startDate) return false;
        return new Date() >= new Date(quiz.startDate);
    };

    const isQuizExpired = (quiz: Quiz) => {
        if (quiz.status !== 'published') return false;
        if (!quiz.endDate) return false;
        return new Date() > new Date(quiz.endDate);
    };

    const toggleSelectQuiz = (id: string) => {
        setSelectedQuizzes(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedQuizzes.length === filteredQuizzes.length) setSelectedQuizzes([]);
        else setSelectedQuizzes(filteredQuizzes.map(q => q.id));
    };

    const handleDeleteSelected = () => {
        if (selectedQuizzes.length === 0) return;
        setQuizToDelete(null);
        setIsBulkDelete(true);
        setDeleteConfirmInput('');
        setIsDeleteModalOpen(true);
    };

    const handleDeleteQuiz = (quiz: Quiz) => {
        setQuizToDelete(quiz);
        setIsBulkDelete(false);
        setDeleteConfirmInput('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        const expectedConfirm = isBulkDelete 
            ? `delete ${selectedQuizzes.length} quizzes` 
            : quizToDelete?.title.toLowerCase();

        if (deleteConfirmInput.toLowerCase() !== expectedConfirm) return;

        setIsDeleting(true);
        try {
            if (isBulkDelete) {
                await quizService.deleteQuizzesBatch(selectedQuizzes);
                setQuizzes(quizzes.filter(q => !selectedQuizzes.includes(q.id)));
                setSelectedQuizzes([]);
                showToast(`Deleted ${selectedQuizzes.length} quizzes`, "success");
            } else if (quizToDelete) {
                await quizService.deleteQuiz(quizToDelete.id);
                setQuizzes(quizzes.filter(q => q.id !== quizToDelete.id));
                setSelectedQuizzes(prev => prev.filter(qId => qId !== quizToDelete.id));
                showToast("Quiz deleted successfully", "success");
            }
            
            setIsDeleteModalOpen(false);
            setQuizToDelete(null);
            setIsBulkDelete(false);
        } catch (error) {
            // Error handled silently
            showToast("Failed to delete", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExpireQuiz = (quiz: Quiz) => {
        setQuizToExpire(quiz);
        setIsExpireModalOpen(true);
    };

    const confirmExpire = async () => {
        if (!quizToExpire) return;
        setIsProcessingAction(true);
        try {
            await quizService.expireQuiz(quizToExpire.id);
            setQuizzes(prev => prev.map(q => 
                q.id === quizToExpire.id 
                ? { ...q, endDate: new Date().toISOString() } 
                : q
            ));
            showToast("Quiz link expired successfully", "success");
            setIsExpireModalOpen(false);
            setQuizToExpire(null);
        } catch (error) {
            showToast("Failed to expire quiz", "error");
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleRestartQuiz = (quiz: Quiz) => {
        setQuizToRestart(quiz);
        // Default to 7 days from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setNewEndDate(defaultDate.toISOString().split('T')[0] + 'T23:59');
        setIsRestartModalOpen(true);
    };

    const confirmRestart = async () => {
        if (!quizToRestart || !newEndDate) return;
        setIsProcessingAction(true);
        try {
            await quizService.restartQuiz(quizToRestart.id, new Date(newEndDate));
            setQuizzes(prev => prev.map(q => 
                q.id === quizToRestart.id 
                ? { ...q, endDate: new Date(newEndDate).toISOString(), status: 'published' } 
                : q
            ));
            showToast("Quiz restarted successfully!", "success");
            setIsRestartModalOpen(false);
            setQuizToRestart(null);
        } catch (error) {
            showToast("Failed to restart quiz", "error");
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handlePublishQuiz = async (id: string) => {
        try {
            await quizService.publishQuiz(id);
            setQuizzes(prev => prev.map(q => q.id === id ? { ...q, status: 'published' } : q));
            showToast("Quiz published successfully!", "success");
        } catch (error) {
            // Error handled silently
            showToast("Failed to publish quiz", "error");
        }
    };

    const handleShareLink = (id: string) => {
        const link = `${window.location.origin}/quiz-rules/${id}`;
        navigator.clipboard.writeText(link).then(() => {
            showToast("Link copied to clipboard!", "success");
        }).catch(_err => {
            // Error handled silently
            showToast("Failed to copy link", "error");
        });
    };

    const handleEditQuiz = (quiz: Quiz) => {
        if (isQuizActive(quiz)) {
            if (window.confirm("This quiz is currently active. Any changes you make will be reflected immediately and might affect students who are currently taking the quiz. Do you want to proceed?")) {
                navigate(`/create-quiz?edit=${quiz.id}`);
            }
        } else {
            navigate(`/create-quiz?edit=${quiz.id}`);
        }
    };

    // Toast State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto pb-12">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-slate-800 mb-1 leading-tight">My Quizzes</h1>
                        <p className="text-slate-500 text-sm">Manage quizzes you created and view responses</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Main header button removed as per request to move it to created section */}
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 mb-8">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'created' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Created Quizzes
                    </button>
                    <button
                        onClick={() => setActiveTab('attempted')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'attempted' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        My Results
                    </button>
                </div>

                {activeTab === 'created' ? (
                    <>


                        {/* Filters & Actions Bar */}
                        <div className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center z-20 relative">

                            {/* Search */}
                            <div className="relative w-full lg:max-w-md">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search quizzes by title or category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 outline-hidden focus:border-indigo-400 focus:bg-white transition-colors"
                                />
                            </div>

                            {selectedQuizzes.length > 0 ? (
                                <div className="flex items-center gap-3 w-full lg:w-auto animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{selectedQuizzes.length} selected</span>
                                    <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors">
                                        <CheckCircle size={15} /> Publish
                                    </button>
                                    <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors">
                                        <Download size={15} /> Export
                                    </button>
                                    <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors">
                                        <Trash2 size={15} /> Delete
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button 
                                            onClick={toggleSelectAll}
                                            className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 border ${selectedQuizzes.length === filteredQuizzes.length && filteredQuizzes.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-600'}`}
                                            title={selectedQuizzes.length === filteredQuizzes.length ? "Deselect All" : "Select All"}
                                        >
                                            <CheckCheck size={18} strokeWidth={2.5} className={`transition-transform duration-300 ${selectedQuizzes.length === filteredQuizzes.length && filteredQuizzes.length > 0 ? 'scale-110' : 'scale-100'}`} />
                                        </button>
                                        <Filter size={16} className="text-slate-400 hidden sm:block ml-1" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="flex-1 sm:w-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-hidden focus:border-indigo-400 appearance-none min-w-[120px]"
                                        >
                                            <option value="all">Status: All</option>
                                            <option value="published">Status: Published</option>
                                            <option value="draft">Status: Draft</option>
                                        </select>
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                                    <select
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value as any)}
                                        className="flex-1 sm:w-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-hidden focus:border-indigo-400 appearance-none min-w-[150px]"
                                    >
                                        <option value="newest">Sort by: Newest</option>
                                        <option value="oldest">Sort by: Oldest</option>
                                        <option value="most_responses">Sort by: Most Responses</option>
                                        <option value="highest_avg">Sort by: Highest Score</option>
                                    </select>
                                    <button 
                                        onClick={() => navigate('/create-quiz')}
                                        className="hidden sm:flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold items-center justify-center gap-2 shadow-[0_2px_10px_rgba(79,70,229,0.15)] transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap ml-2"
                                    >
                                        <Plus size={16} strokeWidth={3} /> Create Quiz
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Create Button */}
                        <div className="sm:hidden mb-6">
                            <button 
                                onClick={() => navigate('/create-quiz')}
                                className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-sm"
                            >
                                <Plus size={18} strokeWidth={3} /> Create New Quiz
                            </button>
                        </div>

                        {/* Quiz Grid */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                                <p className="text-slate-500 font-medium">Loading your quizzes...</p>
                            </div>
                        ) : filteredQuizzes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {filteredQuizzes.map(quiz => (
                                    <div key={quiz.id} onClick={() => { if (quiz.status === 'published') navigate(`/quiz-rules/${quiz.id}`); else navigate(`/create-quiz?edit=${quiz.id}`); }} className={`cursor-pointer bg-white rounded-[24px] border p-5 flex flex-col gap-4 transition-all duration-300 relative group overflow-visible ${selectedQuizzes.includes(quiz.id) ? 'border-indigo-400 shadow-[0_0_0_3px_rgba(99,102,241,0.1)]' : 'border-[#e2e8f0] hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1'}`}>
                                        
                                        {/* Top Header: Checkbox, Status, Dropdown */}
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleSelectQuiz(quiz.id); }}
                                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${selectedQuizzes.includes(quiz.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-300 text-transparent hover:border-indigo-400 hover:bg-indigo-50'}`}
                                                >
                                                    <Check size={14} strokeWidth={3} className={selectedQuizzes.includes(quiz.id) ? 'scale-100' : 'scale-0'} />
                                                </button>
                                                <div className={`px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                                    isQuizExpired(quiz) ? 'bg-red-50 text-red-600 border border-red-100' : isQuizActive(quiz) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : quiz.status === 'published' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                    {isQuizExpired(quiz) ? <AlertCircle size={10} /> : isQuizActive(quiz) ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                    {isQuizExpired(quiz) ? 'Expired' : isQuizActive(quiz) ? 'Active' : quiz.status}
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === quiz.id ? null : quiz.id); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <MoreVertical size={18} />
                                                </button>
                                                {/* Dropdown menu */}
                                                {activeDropdown === quiz.id && (
                                                    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-top-2 zoom-in-95">
                                                        <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2" onClick={() => handleEditQuiz(quiz)}><Plus size={15} className="rotate-45" /> Edit Quiz</button>
                                                        <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2" onClick={() => navigate(`/create-quiz?edit=${quiz.id}&duplicate=true`)}><Copy size={15} /> Duplicate Quiz</button>
                                                        {quiz.status === 'published' && (
                                                            <button 
                                                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                                                                onClick={() => handleShareLink(quiz.id)}
                                                            >
                                                                <Share2 size={15} /> Share Link
                                                            </button>
                                                        )}
                                                         <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2" onClick={() => navigate(`/quiz-rules/${quiz.id}`)}><Eye size={15} /> Preview</button>
                                                        
                                                        {/* Expire/Restart Options */}
                                                        {quiz.status === 'published' && (
                                                            <>
                                                                {!isQuizExpired(quiz) ? (
                                                                    <button 
                                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2" 
                                                                        onClick={() => handleExpireQuiz(quiz)}
                                                                    >
                                                                        <Clock size={15} /> Expire Link
                                                                    </button>
                                                                ) : (
                                                                    <button 
                                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2" 
                                                                        onClick={() => handleRestartQuiz(quiz)}
                                                                    >
                                                                        <Plus size={15} /> Restart Quiz
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        <button 
                                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 disabled:opacity-50" 
                                                            onClick={() => handleDownloadPDF(quiz)}
                                                            disabled={isGeneratingPDF === quiz.id}
                                                        >
                                                            {isGeneratingPDF === quiz.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} 
                                                            Download PDF
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1"></div>
                                                        <button className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => handleDeleteQuiz(quiz)}><Trash2 size={15} /> Delete Quiz</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Body: Title, Meta */}
                                        <div className="flex-1 min-h-[80px]">
                                            <h3 className="text-[1.1rem] font-extrabold text-slate-800 line-clamp-2 leading-tight mb-3 group-hover:text-indigo-700 transition-colors">{quiz.title}</h3>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 font-semibold">
                                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><FileText size={12} className="text-indigo-400" /> {quiz.category}</span>
                                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><ListFilter size={12} className="text-amber-400" /> {quiz.questionCount} Qs</span>
                                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><Clock size={12} className="text-emerald-400" /> {quiz.timeLimit}m</span>
                                            </div>
                                        </div>

                                        {/* Stats (Grid row) */}
                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100/80">
                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                                                <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Attempts</p>
                                                <p className="font-black text-slate-700 text-lg">{quiz.attempts}</p>
                                            </div>
                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                                                <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Avg Score</p>
                                                <p className={`font-black text-lg ${quiz.avgScore >= 80 ? 'text-emerald-500' : quiz.avgScore >= 50 ? 'text-amber-500' : 'text-slate-700'}`}>{quiz.avgScore}%</p>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditQuiz(quiz); }}
                                                className={`flex-1 py-2 border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                                    isQuizActive(quiz) 
                                                    ? 'border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300' 
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600'
                                                }`}
                                            >
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            {quiz.status === 'draft' ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePublishQuiz(quiz.id); }}
                                                    className="flex-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <CheckCircle size={14} /> Publish
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/quiz/${quiz.id}/responses`); }}
                                                    className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <BarChart2 size={14} /> Results
                                                </button>
                                            )}
                                        </div>
                                        
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="bg-white rounded-[24px] border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-5 line-dashed">
                                    <BookOpen size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No quizzes found</h3>
                                <p className="text-slate-500 mb-6 max-w-sm">
                                    {searchQuery || statusFilter !== 'all' ? "Try adjusting your filters or search query to find what you're looking for." : "You haven't created any quizzes yet. Start building your first quiz now!"}
                                </p>
                                {searchQuery || statusFilter !== 'all' ? (
                                    <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold transition-colors">
                                        Clear Filters
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => navigate('/create-quiz')}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Plus size={18} strokeWidth={3} /> Create Your First Quiz
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        {isResultsLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                                <p className="text-slate-500 font-medium">Loading your results...</p>
                            </div>
                        ) : attemptedQuizzes.length > 0 ? (
                            <>
                                <div className="hidden md:flex items-center px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="flex-1 min-w-0">Quiz Details</div>
                                    <div className="w-32 text-center">Score</div>
                                    <div className="w-32 text-center">Status</div>
                                    <div className="w-48 text-right pr-12">Actions</div>
                                </div>

                                {attemptedQuizzes.map(quiz => (
                            <div key={quiz.id} className="bg-white rounded-[20px] border border-[#e2e8f0] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center justify-between md:hidden w-full mb-1">
                                        <div className={`px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider ${quiz.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : quiz.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                            {quiz.status}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 truncate">{quiz.quizTitle}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-1.5"><FileText size={14} className="text-indigo-400" /> {quiz.category}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={14} /> {quiz.timeTaken}m</span>
                                        <span className="flex items-center gap-1.5 hidden lg:flex"><Calendar size={14} /> {quiz.submittedAt}</span>
                                    </div>
                                </div>

                                <div className="hidden md:flex w-32 justify-center shrink-0">
                                    <div className="text-center">
                                        <p className={`font-bold ${quiz.score >= 80 ? 'text-emerald-600' : quiz.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{quiz.score} / {quiz.totalMarks}</p>
                                        <p className="text-xs text-slate-400 font-medium">Score</p>
                                    </div>
                                </div>

                                <div className="hidden md:flex w-32 justify-center shrink-0">
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${quiz.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : quiz.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                        {quiz.status === 'passed' ? <CheckCircle size={12} /> : quiz.status === 'failed' ? <X size={12} /> : <Clock size={12} />}
                                        {quiz.status}
                                    </div>
                                </div>

                                {/* Mobile Stats (Row) */}
                                <div className="flex items-center justify-between w-full md:hidden pt-3 border-t border-slate-100">
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Score</p>
                                        <p className={`font-bold text-sm ${quiz.score >= 80 ? 'text-emerald-600' : quiz.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{quiz.score} / {quiz.totalMarks}</p>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === quiz.id ? null : quiz.id); }}
                                            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {activeDropdown === quiz.id && (
                                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-bottom-2 zoom-in-95">
                                                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2" onClick={() => navigate(`/quiz/result/${quiz.id}`)}><Eye size={15} /> View Details</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center justify-end gap-2 w-48 shrink-0">
                                    <button 
                                        onClick={() => navigate(`/quiz/result/${quiz.id}`)}
                                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button className="p-2 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                                ))}
                            </>
                        ) : (
                            /* Empty State for Results */
                            <div className="bg-white rounded-[24px] border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mb-5 line-dashed">
                                    <BarChart2 size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No results yet</h3>
                                <p className="text-slate-500 mb-6 max-w-sm">
                                    You haven't attempted any quizzes yet. Start learning today!
                                </p>
                                <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                                    Browse Quizzes
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (quizToDelete || isBulkDelete) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        {/* Close button added to fix user feedback */}
                        <button onClick={() => { setIsDeleteModalOpen(false); setIsBulkDelete(false); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all z-10">
                            <X size={20} />
                        </button>
                        
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <Trash2 size={32} />
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-800 text-center mb-2">
                                {isBulkDelete ? `Delete ${selectedQuizzes.length} Quizzes?` : 'Delete Quiz?'}
                            </h3>
                            <p className="text-slate-500 text-center mb-8 leading-relaxed">
                                {isBulkDelete ? (
                                    <>This will permanently remove <span className="font-bold text-slate-800">{selectedQuizzes.length} selected quizzes</span> and all their associated data. This cannot be undone.</>
                                ) : (
                                    <>This action is <span className="text-red-600 font-bold italic">permanent</span>. All data, responses, and links for <span className="font-bold text-slate-800">"{quizToDelete?.title}"</span> will be gone forever.</>
                                )}
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                                        Type <span className="text-red-500 font-black">{isBulkDelete ? `delete ${selectedQuizzes.length} quizzes` : quizToDelete?.title.toLowerCase()}</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={isBulkDelete ? `delete ${selectedQuizzes.length} quizzes` : quizToDelete?.title.toLowerCase()}
                                        value={deleteConfirmInput}
                                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-hidden focus:border-red-400 focus:bg-white transition-all placeholder:opacity-30"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setIsDeleteModalOpen(false); setIsBulkDelete(false); }}
                                        className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deleteConfirmInput.toLowerCase() !== (isBulkDelete ? `delete ${selectedQuizzes.length} quizzes` : quizToDelete?.title.toLowerCase()) || isDeleting}
                                        className="flex-1 px-6 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete Forever'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-4 duration-300">
                    <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                        toast.type === 'success' 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-red-600 border-red-500 text-white'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                    </div>
                </div>
            )}
            {/* Expire Confirmation Modal */}
            {isExpireModalOpen && quizToExpire && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setIsExpireModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <Clock size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 text-center mb-2">Expire Quiz Link?</h3>
                            <p className="text-slate-500 text-center mb-8 leading-relaxed">
                                This will immediately end the quiz. Students will no longer be able to start new attempts using the current link.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsExpireModalOpen(false)}
                                    className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                                    disabled={isProcessingAction}
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={confirmExpire}
                                    disabled={isProcessingAction}
                                    className="flex-1 px-6 py-4 bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    {isProcessingAction ? <Loader2 size={18} className="animate-spin" /> : 'Expire Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Restart Modal */}
            {isRestartModalOpen && quizToRestart && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setIsRestartModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 text-center mb-2">Restart Quiz</h3>
                            <p className="text-slate-500 text-center mb-6 leading-relaxed">
                                Set a new expiration date to re-activate the quiz link for students.
                            </p>
                            
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">
                                        New Expiration Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-hidden focus:border-indigo-400 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsRestartModalOpen(false)}
                                    className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                                    disabled={isProcessingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRestart}
                                    disabled={isProcessingAction || !newEndDate}
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    {isProcessingAction ? <Loader2 size={18} className="animate-spin" /> : 'Restart Quiz'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout >
    );
};

export default MyQuizzesPage;
