import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Download, Eye, Calendar, Clock, CheckCircle, X, Users, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import QuizAnalyticsDashboard from '../components/analytics/QuizAnalyticsDashboard';
import { quizService } from '../services/quizService';

interface ResponseData {
    id: string;
    userName: string;
    email: string;
    score: number;
    rawScore: number;
    totalMarks: number;
    timeTaken: number;
    submittedAt: string;
    status: 'passed' | 'failed' | 'completed' | 'cheated';
}

const QuizResponsesPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [scoreFilter, setScoreFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const handleExportCSV = async () => {
        if (!id) return;
        try {
            const { blob, filename: serverFilename } = await quizService.exportQuizResponses(id);
            // Build filename from quiz title if server header isn't readable (CORS edge case)
            const safeTitle = analyticsData?.title
                ?.replace(/[\\/:*?"<>|]/g, '')
                .replace(/\s+/g, '_')
                .trim();
            const filename = safeTitle ? `${safeTitle}.csv` : (serverFilename || 'quiz_responses.csv');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error('CSV Export Error:', err);
            alert(err.message || 'Failed to export CSV. Please ensure there are student responses.');
        }
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!id) return;
            try {
                const data = await quizService.getQuizAnalytics(id);
                setAnalyticsData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [id]);

    // Memoized Filtering Logic - MUST be before any conditional returns
    const filteredResponses = useMemo(() => {
        if (!analyticsData) return [];
        const responses: ResponseData[] = analyticsData.responses || [];
        
        if (!searchQuery && dateFilter === 'all' && scoreFilter === 'all' && statusFilter === 'all') {
            return responses;
        }

        const query = searchQuery.toLowerCase();
        const now = Date.now();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        return responses.filter(response => {
            const matchesSearch = !query || 
                response.userName.toLowerCase().includes(query) ||
                response.email.toLowerCase().includes(query);
            
            if (!matchesSearch) return false;

            if (statusFilter !== 'all' && response.status !== statusFilter) return false;

            if (scoreFilter !== 'all') {
                const score = response.score;
                if (scoreFilter === '0-40' && (score < 0 || score > 40)) return false;
                if (scoreFilter === '40-70' && (score <= 40 || score > 70)) return false;
                if (scoreFilter === '70-100' && (score <= 70 || score > 100)) return false;
            }

            if (dateFilter !== 'all') {
                const submitDate = new Date(response.submittedAt).getTime();
                const diffDays = (now - submitDate) / MS_PER_DAY;

                if (dateFilter === '7days' && diffDays > 7) return false;
                if (dateFilter === '30days' && diffDays > 30) return false;
            }

            return true;
        });
    }, [analyticsData?.responses, searchQuery, dateFilter, scoreFilter, statusFilter]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !analyticsData) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
                    <X size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">Error Loading Analytics</h2>
                    <p className="text-slate-500 mt-2">{error || "Could not load data for this quiz."}</p>
                    <button onClick={() => navigate('/my-quizzes')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold transition-all">Go Back</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8 pb-8 md:pb-12 px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in duration-500">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex-1">
                        <button
                            onClick={() => navigate('/my-quizzes')}
                            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-3 transition-colors w-fit group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to My Quizzes
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
                            {analyticsData.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] uppercase font-black rounded-md tracking-wider">Analytics</span>
                            <p className="text-xs md:text-sm text-slate-500 font-medium">
                                Tracking performance and individual responses
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-sm">
                            <Users size={18} className="text-indigo-500" /> 
                            <span className="text-slate-400 font-medium mr-1">Total:</span> {analyticsData.totalAttempts}
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="flex-1 sm:flex-initial justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-sm md:text-base"
                        >
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Helpful Tip for New Users */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-4 md:p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-xl">
                            <h2 className="text-lg md:text-xl font-bold mb-1 flex items-center gap-2">
                                <CheckCircle size={20} className="text-indigo-200" /> Welcome to Analytics!
                            </h2>
                            <p className="text-indigo-100 text-xs md:text-sm font-medium leading-relaxed">
                                Here you can see how students are performing. Use the charts to identify difficult questions or download the CSV for offline grading systems.
                            </p>
                        </div>
                        <div className="flex gap-2">
                             <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold border border-white/10">
                                Pass Rate: {analyticsData.passRate}%
                             </div>
                             <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold border border-white/10">
                                Avg: {analyticsData.averageScore}%
                             </div>
                        </div>
                    </div>
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                </div>

                {/* Analytics Dashboard */}
                {analyticsData.totalAttempts > 0 ? (
                    <div className="space-y-8">
                        {/* Charts Dashboard */}
                        <div className="bg-slate-50/50 p-4 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-200">
                            <QuizAnalyticsDashboard 
                                quizTitle={analyticsData.title} 
                                data={analyticsData}
                            />
                        </div>

                        {/* Responses Section */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Detailed Responses</h2>
                                    <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">{filteredResponses.length} Submission{filteredResponses.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all active:scale-95"
                                    >
                                        <Download size={14} />
                                        <span className="hidden sm:inline">Export CSV</span>
                                    </button>
                                </div>
                            </div>

                            {/* Compact Filters Bar - Single line on Desktop */}
                            <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                                <div className="relative flex-1 group min-w-[200px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Search size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search name/email..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-100 transition-all"
                                    />
                                </div>

                                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 flex-[2]">
                                    <div className="relative flex-1 min-w-[120px]">
                                        <select
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:bg-white focus:border-indigo-100 cursor-pointer transition-all"
                                        >
                                            <option value="all">All Dates</option>
                                            <option value="7days">Last 7 Days</option>
                                            <option value="30days">Last 30 Days</option>
                                        </select>
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>

                                    <div className="relative flex-1 min-w-[120px]">
                                        <select
                                            value={scoreFilter}
                                            onChange={(e) => setScoreFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:bg-white focus:border-indigo-100 cursor-pointer transition-all"
                                        >
                                            <option value="all">Any Score</option>
                                            <option value="0-40">0-40% (Low)</option>
                                            <option value="40-70">40-70% (Mid)</option>
                                            <option value="70-100">70-100% (High)</option>
                                        </select>
                                        <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                    </div>

                                    <div className="relative flex-1 min-w-[120px]">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:bg-white focus:border-indigo-100 cursor-pointer transition-all"
                                        >
                                            <option value="all">Any Status</option>
                                            <option value="passed">Passed</option>
                                            <option value="failed">Failed</option>
                                            <option value="cheated">Cheated/Flagged</option>
                                        </select>
                                        <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                    </div>
                                    
                                    <button 
                                        onClick={() => { setSearchQuery(''); setDateFilter('all'); setScoreFilter('all'); setStatusFilter('all'); }} 
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                                        title="Reset Filters"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* High-Density Desktop Table View */}
                            <div className="hidden md:block bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-[0.1em]">
                                            <th className="py-3 px-6">Student Info</th>
                                            <th className="py-3 px-4 text-center">Score</th>
                                            <th className="py-3 px-4 text-center">Result</th>
                                            <th className="py-3 px-4 text-center">Time</th>
                                            <th className="py-3 px-4 text-center">Date</th>
                                            <th className="py-3 px-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredResponses.length > 0 ? (
                                            filteredResponses.map(res => (
                                                <tr key={res.id} className="hover:bg-indigo-50/20 transition-colors group">
                                                    <td className="py-2.5 px-6">
                                                        <div className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{res.userName}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{res.email}</div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <span className={`text-xs font-black ${res.status === 'cheated' ? 'text-red-600' : res.score >= 70 ? 'text-emerald-600' : res.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {res.status === 'cheated' ? '0%' : `${res.score}%`}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                                            res.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                            res.status === 'cheated' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 
                                                            'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                            {res.status}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <div className="text-[10px] font-bold text-slate-500">{res.timeTaken}m</div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                                                        <div className="text-[10px] font-bold text-slate-500">{new Date(res.submittedAt).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="py-2.5 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => navigate(`/quiz/result/${res.id}`)}
                                                                className="px-3 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-black hover:bg-black active:scale-95 transition-all" 
                                                            >
                                                                Review
                                                            </button>
                                                            <button className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors">
                                                                <Download size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} className="py-12 text-center text-slate-300 font-bold text-sm">No student records found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* High-Density Mobile Card View */}
                            <div className="md:hidden flex flex-col gap-2">
                                {filteredResponses.length > 0 ? (
                                    filteredResponses.map(res => (
                                        <div key={res.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-bold text-slate-800 text-xs truncate">{res.userName}</h4>
                                                    <div className={`px-1 rounded text-[8px] font-black uppercase ${
                                                        res.status === 'passed' ? 'text-emerald-500 bg-emerald-50' : 
                                                        res.status === 'cheated' ? 'text-red-600 bg-red-100 border border-red-200' : 
                                                        'text-rose-500 bg-rose-50'
                                                    }`}>
                                                        {res.status}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold">
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {res.timeTaken}m</span>
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(res.submittedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className={`text-sm font-black ${res.status === 'cheated' ? 'text-red-600' : res.score >= 70 ? 'text-emerald-600' : res.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                    {res.status === 'cheated' ? '0%' : `${res.score}%`}
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/quiz/result/${res.id}`)}
                                                    className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg active:scale-90 transition-transform"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Matches</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Existing Empty State logic */
                    <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-12 md:p-32 flex flex-col items-center text-center shadow-inner">
                        <Users size={64} className="text-indigo-100 mb-6" />
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2">Patience is Key!</h3>
                        <p className="text-slate-500 text-sm md:text-base font-medium max-w-sm">No submissions have been recorded for this quiz yet. Once students start taking the quiz, their results will appear here in real-time.</p>
                        <button className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:-translate-y-1 transition-all">Tell your students!</button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QuizResponsesPage;
