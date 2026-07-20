import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, AlertCircle, ArrowLeft, Loader2, Ban, CheckCircle2, ArrowRight } from 'lucide-react';
import { quizService } from '../services/quizService';

const QuizRulesPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quizTitle, setQuizTitle] = useState('Quiz');
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attemptStatus, setAttemptStatus] = useState<{
        attemptCount: number;
        maxAttempts: number;
        canAttempt: boolean;
    } | null>(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!id) return;
            try {
                const [quizData, status] = await Promise.all([
                    quizService.getQuiz(id),
                    quizService.getAttemptStatus(id)
                ]);
                setQuizTitle(quizData.title);
                setQuiz(quizData);
                setAttemptStatus(status);
            } catch (err: any) {
                setError(err.message || 'Failed to load quiz information');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 text-center max-w-[400px]">
                    <AlertCircle className="text-rose-500 mx-auto mb-6" size={40} />
                    <p className="text-slate-600 font-bold mb-8 text-sm">{error}</p>
                    <button 
                        onClick={() => navigate('/my-quizzes')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-3 rounded-xl font-semibold text-sm"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (attemptStatus && !attemptStatus.canAttempt) {
        const isOneAttemptOnly = attemptStatus.maxAttempts === 1;
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-[420px] w-full bg-white rounded-[24px] overflow-hidden shadow-xl border border-slate-100">
                    <div className="bg-rose-50 p-6 text-center border-b border-rose-100">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_2px_8px_-2px_rgba(225,29,72,0.2)]">
                            <Ban size={24} className="text-rose-600" />
                        </div>
                        <h1 className="text-lg font-bold text-rose-900 mb-1">Access Denied</h1>
                        <p className="text-rose-700 text-xs font-semibold">{quizTitle}</p>
                    </div>

                    <div className="p-6">
                        <p className="text-slate-600 text-sm leading-relaxed text-center mb-6">
                            {isOneAttemptOnly
                                ? 'This quiz allows only one attempt and you have already completed it.'
                                : `You have used all ${attemptStatus.maxAttempts} allowed attempts for this quiz.`}
                        </p>

                        <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center shrink-0">
                                <CheckCircle2 size={20} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Attempts Used</p>
                                <p className="text-slate-800 font-bold text-base">
                                    {attemptStatus.attemptCount}
                                    <span className="text-slate-400 font-semibold text-xs ml-1">
                                        / {attemptStatus.maxAttempts === 0 ? '∞' : attemptStatus.maxAttempts}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/my-quizzes')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200/50 text-sm"
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Check for Scheduled (Future) Quiz
    const isFutureQuiz = quiz?.startDate && new Date() < new Date(quiz.startDate);
    if (isFutureQuiz) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-[420px] w-full bg-white rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
                    <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                            <Clock size={32} className="text-indigo-600" />
                        </div>
                        <h1 className="text-xl font-black text-white mb-1">Quiz Not Started</h1>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80">{quizTitle}</p>
                    </div>

                    <div className="p-8 text-center">
                        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Opens at</p>
                            <p className="text-indigo-900 font-black text-lg">
                                {new Date(quiz.startDate).toLocaleString(undefined, { 
                                    weekday: 'long',
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            This quiz is scheduled to start in the future. Please return at the time listed above to begin your attempt.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 text-sm"
                            >
                                Check Again
                            </button>
                            <button
                                onClick={() => navigate('/my-quizzes')}
                                className="w-full bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-500 py-3.5 rounded-xl font-bold transition-all text-sm mb-1"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const rules = [];

    if (quiz?.timeLimit) {
        rules.push({
            icon: <Clock className="text-indigo-600" size={18} />,
            bg: "bg-indigo-50 border-indigo-100",
            title: 'Strict Time Limit',
            description: `You have ${quiz.timeLimit} minutes. The timer cannot be paused once started.`
        });
    }

    if (quiz?.antiCheat?.disableTabSwitching || quiz?.antiCheat?.fullscreenMode || quiz?.antiCheat?.webcamMonitoring) {
        rules.push({
            icon: <ShieldAlert className="text-rose-600" size={18} />,
            bg: "bg-rose-50 border-rose-100",
            title: 'Advanced Proctoring',
            description: 'Tab switching or screenshots are restricted. You get ONE warning; a second violation will trigger immediate force-submission.'
        });
    }

    if (quiz?.randomization?.preventBackNavigation) {
        rules.push({
            icon: <AlertCircle className="text-amber-600" size={18} />,
            bg: "bg-amber-50 border-amber-100",
            title: 'No Backtrack',
            description: 'You cannot go back to previous questions once submitted. Review your answers carefully.'
        });
    }

    if (quiz?.negativeMarking?.enabled) {
        rules.push({
            icon: <AlertCircle className="text-red-600" size={18} />,
            bg: "bg-red-50 border-red-100",
            title: 'Negative Marking',
            description: `Incorrect answers result in a penalty of ${quiz.negativeMarking.penalty} marks. Don't guess if unsure.`
        });
    }

    if (attemptStatus && attemptStatus.maxAttempts > 0) {
        rules.push({
            icon: <CheckCircle2 className="text-indigo-600" size={18} />,
            bg: "bg-indigo-50 border-indigo-100",
            title: 'Attempt Limit',
            description: `You have used ${attemptStatus.attemptCount} of ${attemptStatus.maxAttempts} attempts (${attemptStatus.maxAttempts - attemptStatus.attemptCount} remaining).`
        });
    }

    return (
        <div className="flex min-h-screen bg-slate-50 md:py-10 md:px-6 justify-center items-start md:items-center">
            <div className="flex flex-col md:flex-row w-full max-w-[900px] bg-white md:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
                
                {/* 🔵 Left Dashboard Column 🔵 */}
                <div className="bg-indigo-600 w-full md:w-[280px] p-6 md:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-indigo-100 hover:text-white transition-colors text-xs font-semibold w-fit relative z-10"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>

                    <div className="mt-10 md:mt-24 mb-4 relative z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-5 backdrop-blur-sm border border-white/20 shadow-inner">
                            <ShieldAlert size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-white">Exam Mode</h2>
                        <p className="text-indigo-100/80 text-xs leading-relaxed max-w-[200px]">
                            You're entering a secure testing environment governed by strict rules.
                        </p>
                    </div>
                </div>

                {/* ⚪ Right White Column ⚪ */}
                <div className="flex-1 bg-white p-6 md:p-10 flex flex-col justify-center">
                    <div className="mb-8">
                        <p className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase mb-1">Before you start</p>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{quizTitle}</h1>
                    </div>

                    <div className="flex flex-col gap-4 mb-8">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className={`flex-shrink-0 w-9 h-9 ${rule.bg} border rounded-xl flex items-center justify-center`}>
                                    {rule.icon}
                                </div>
                                <div className="pt-0.5">
                                    <h3 className="font-bold text-slate-800 text-sm mb-1">{rule.title}</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">{rule.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl flex items-start gap-3 text-amber-800 mb-8 shadow-sm">
                        <AlertCircle className="flex-shrink-0 mt-0.5 text-amber-500" size={18} />
                        <p className="text-xs font-medium leading-relaxed">
                            <strong className="block mb-0.5 text-amber-900">Agreement</strong> 
                            By clicking "Start Quiz", you agree to the conditions listed above. Breaches will result in immediate disqualification.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] transition-all hover:-translate-y-0.5 w-full md:w-auto justify-center"
                            onClick={() => navigate(`/quiz/take/${id}`)}
                        >
                            Start Quiz Now <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizRulesPage;
