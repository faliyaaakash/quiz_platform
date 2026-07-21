import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ShieldAlert, Loader2, Bookmark, Monitor, CheckCircle2} from 'lucide-react';
import { quizService } from '../services/quizService';
import { authService } from '../services/authService';

interface Question {
    id: string;
    text: string;
    image: string | null;
    options: string[];
    isMultiCorrect: boolean;
    marks: number;
    originalOptionsIndices?: number[];
    type?: string;
}

const QuizTakePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showCheatWarning, setShowCheatWarning] = useState(false);
    const [answers, setAnswers] = useState<Record<string, number[]>>({});
    const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
    const [quizInfo, setQuizInfo] = useState({ title: 'Quiz' });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
    const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
    const [proctoringViolations, setProctoringViolations] = useState(0);
    const [warningModalOpen, setWarningModalOpen] = useState(false);
    const [isFullscreenState, setIsFullscreenState] = useState(false);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [previewScore, setPreviewScore] = useState<any>(null);
    const [submittedAttemptId, setSubmittedAttemptId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isOfflineSubmitted, setIsOfflineSubmitted] = useState(false);
    
    // 🔒 Submission Guard Ref (Updates synchronously ⚡)
    const submissionLock = useRef(false);

    // Fisher-Yates (Knuth) Shuffle Algorithm
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!id) return;
            try {
                const [data, profile] = await Promise.all([
                    quizService.getQuiz(id),
                    authService.getProfile()
                ]);

                setQuizInfo(data as any);
                setUserProfile(profile);
                setTimeLeft(data.timeLimit * 60);

                const isCreator = profile && data.creator === (profile as any)._id;
                if (isCreator) {
                    setIsPreviewMode(true);
                }

                if (data.startDate && new Date() < new Date(data.startDate) && !isCreator) {
                    setError(`This quiz is scheduled to start at ${new Date(data.startDate).toLocaleString()}. Please wait until then.`);
                    setLoading(false);
                    return;
                }

                let processedQuestions = data.questions.map((q: any) => {
                    const optionsWithIndices = q.options.map((text: string, idx: number) => ({ text, originalIdx: idx }));
                    const shuffledOptions = shuffleArray<{ text: string; originalIdx: number }>(optionsWithIndices);

                    return {
                        ...q,
                        id: q._id,
                        options: shuffledOptions.map((o: { text: string; originalIdx: number }) => o.text),
                        originalOptionsIndices: shuffledOptions.map((o: { text: string; originalIdx: number }) => o.originalIdx),
                        type: q.type
                    };
                });

                processedQuestions = shuffleArray(processedQuestions);
                setQuestions(processedQuestions);
                setStartTime(new Date().toISOString());
            } catch (err: any) {
                setError(err.message || 'Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [id]);

    // Handle Background Sync when returning online
    useEffect(() => {
        const handleOnline = async () => {
            if (!id) return;
            const pendingSubmission = localStorage.getItem(`pendingQuizSubmission_${id}`);
            if (pendingSubmission && isSubmitted && isOfflineSubmitted) {
                try {
                    const parsed = JSON.parse(pendingSubmission);
                    const result = await quizService.submitQuiz(id, parsed.formattedAnswers, parsed.proctoringViolations, parsed.startTime);
                    
                    localStorage.removeItem(`pendingQuizSubmission_${id}`);
                    setIsOfflineSubmitted(false);
                    
                    if (result.isPreview) {
                        setPreviewScore(result);
                    } else if (result.attemptId) {
                        setSubmittedAttemptId(result.attemptId);
                    }
                    
                    setTimeout(() => {
                        navigate(result.isPreview ? '/my-quizzes' : '/profile', { replace: true });
                    }, 4000);
                } catch (err) {
                    console.error("Background sync failed", err);
                }
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [id, isSubmitted, isOfflineSubmitted, navigate]);

    useEffect(() => {
        setVisitedQuestions(prev => new Set(prev).add(currentIdx));
    }, [currentIdx]);

    const handleSubmit = useCallback(async () => {
        if (submissionLock.current || isSubmitted || !id) return;
        submissionLock.current = true;
        setIsSubmitted(true);
        setWarningModalOpen(false);

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

        try {
            const formattedAnswers = questions.map(q => {
                const selectedShuffledIndices = answers[q.id] || [];
                const selectedOriginalIndices = selectedShuffledIndices.map(shuffledIdx => q.originalOptionsIndices ? q.originalOptionsIndices[shuffledIdx] : shuffledIdx);

                return {
                    questionId: q.id,
                    selectedOptions: selectedOriginalIndices,
                    textAnswer: textAnswers[q.id] || ''
                };
            });

            // OFFLINE HANDLING
            if (!navigator.onLine) {
                localStorage.setItem(`pendingQuizSubmission_${id}`, JSON.stringify({
                    formattedAnswers,
                    proctoringViolations,
                    startTime: startTime || new Date().toISOString()
                }));
                setIsOfflineSubmitted(true);
                return; // Stop here, wait for background sync
            }

            const result = await quizService.submitQuiz(id, formattedAnswers, proctoringViolations, startTime || new Date().toISOString());

            if (result.isPreview) {
                setPreviewScore(result);
            } else if (result.attemptId) {
                setSubmittedAttemptId(result.attemptId);
            }

            if (!showCheatWarning && proctoringViolations < 2) {
                setTimeout(() => {
                    if (!submissionLock.current) return;
                    if (!window.location.pathname.includes('/quiz/take')) return;
                    navigate(result.isPreview ? '/my-quizzes' : '/profile', { replace: true });
                }, 8000);
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit results. Please contact support.");
            setIsSubmitted(false);
            submissionLock.current = false;
        }
    }, [isSubmitted, id, questions, answers, proctoringViolations, startTime, navigate, showCheatWarning]);

    const handleViolation = useCallback(() => {
        if (isSubmitted || questions.length === 0) return;

        setProctoringViolations(prev => {
            const newViolations = prev + 1;
            if (newViolations === 1) {
                setWarningModalOpen(true);
            } else if (newViolations >= 2) {
                setShowCheatWarning(true);
                handleSubmit();
            }
            return newViolations;
        });
    }, [isSubmitted, questions.length, handleSubmit]);

    const enterFullscreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(() => {
                setError("Fullscreen is mandatory for this exam. Please check your browser settings.");
            });
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => { if (document.hidden) handleViolation(); };
        const handleBlur = () => { handleViolation(); };
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreenState(isFs);
            if (!isFs && !isSubmitted && questions.length > 0) {
                handleViolation();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const prohibited = [
                'PrintScreen', 'F12', 
                (e.ctrlKey && e.key === 'c'),
                (e.ctrlKey && e.key === 'v'),
                (e.ctrlKey && e.key === 'u'),
                (e.ctrlKey && e.shiftKey && e.key === 'I'),
                (e.ctrlKey && e.shiftKey && e.key === 'J'),
                (e.ctrlKey && e.shiftKey && e.key === 'C')
            ];

            if (prohibited.some(p => typeof p === 'boolean' ? p : e.key === p)) {
                e.preventDefault();
                handleViolation();
                return false;
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isSubmitted && questions.length > 0) {
                e.preventDefault();
                e.returnValue = "Active quiz session. Leaving will auto-submit progress.";
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        const handlePopState = (_e: PopStateEvent) => {
            window.history.pushState(null, '', window.location.href);
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [handleViolation, isSubmitted, questions.length]);

    useEffect(() => {
        if (loading || error || questions.length === 0) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => { setTimeLeft(prev => prev - 1); }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, handleSubmit, loading, error, questions.length]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optIdx: number) => {
        if (isSubmitted) return;
        const q = questions[currentIdx];
        const currentAnswers = answers[q.id] || [];

        if (q.isMultiCorrect) {
            const newAnswers = currentAnswers.includes(optIdx)
                ? currentAnswers.filter(idx => idx !== optIdx)
                : [...currentAnswers, optIdx];
            setAnswers({ ...answers, [q.id]: newAnswers });
        } else {
            setAnswers({ ...answers, [q.id]: [optIdx] });
        }
    };

    const handleTextAnswer = (text: string) => {
        if (isSubmitted) return;
        setTextAnswers({ ...textAnswers, [questions[currentIdx].id]: text });
    };

    const handleClearResponse = () => {
        if (isSubmitted) return;
        setAnswers({ ...answers, [questions[currentIdx].id]: [] });
        setTextAnswers({ ...textAnswers, [questions[currentIdx].id]: '' });
    };

    const handleSaveAndNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        }
    };

    const handleMarkAndNext = () => {
        const newFlags = new Set(flaggedQuestions);
        newFlags.add(currentIdx);
        setFlaggedQuestions(newFlags);
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
                <Loader2 className="text-[#0096a6] animate-spin mb-4" size={48} />
                <p className="text-gray-600 font-bold uppercase tracking-wider text-sm">Initializing Secure Environment</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
                <div className="bg-white rounded-[16px] p-8 max-w-[500px] w-full text-center shadow-lg border border-gray-200">
                    <AlertTriangle size={48} className="text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
                    <p className="text-red-500 mb-6 font-medium bg-red-50 p-4 rounded-lg text-sm">{error}</p>
                    <button
                        onClick={() => navigate('/my-quizzes', { replace: true })}
                        className="w-full bg-[#0096a6] text-white py-3 font-bold rounded-lg hover:bg-[#007b89] transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
                <div className="bg-white rounded-[24px] p-10 max-w-[600px] w-full text-center shadow-xl border border-gray-200">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg
                        ${showCheatWarning ? 'bg-red-500 text-white shadow-red-200' : 'bg-emerald-500 text-white shadow-emerald-200'}
                    `}>
                        {showCheatWarning ? <ShieldAlert size={48} /> : <CheckCircle2 size={48} />}
                    </div>

                    <h2 className={`text-3xl font-extrabold mb-4 ${showCheatWarning ? 'text-red-600' : 'text-gray-800'}`}>
                        {showCheatWarning ? 'VIOLATION DETECTED' : isOfflineSubmitted ? 'Saved Offline' : 'Assessment Submitted'}
                    </h2>

                    <p className="text-gray-600 font-medium mb-8 leading-relaxed">
                        {showCheatWarning
                            ? "A critical proctoring violation was detected. Your session has been force-interrupted. Penalty: 0 marks."
                            : isOfflineSubmitted
                                ? "You are currently offline. Your submission has been saved locally on this device. Please reconnect to the internet and DO NOT close this tab to automatically sync your results."
                                : isPreviewMode
                                    ? `Review Phase Complete. Final Score: ${previewScore?.score || 0}/${previewScore?.totalMarks || 0}.`
                                    : "Your responses have been securely recorded."}
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                        {!isPreviewMode && !showCheatWarning && submittedAttemptId && (
                            <button
                                onClick={() => navigate(`/result/${submittedAttemptId}`, { replace: true })}
                                className="w-full bg-indigo-600 text-white py-4 font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                VIEW YOUR RESPONSE
                            </button>
                        )}
                        <button
                            onClick={() => navigate(isPreviewMode ? '/my-quizzes' : '/profile', { replace: true })}
                            className="w-full bg-gray-900 text-white py-4 font-bold rounded-xl hover:bg-black transition-colors shadow-md"
                        >
                            RETURN TO DASHBOARD
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIdx];
    const answeredCount = Object.keys(answers).filter(k => answers[k].length > 0).length + 
                          Object.keys(textAnswers).filter(k => textAnswers[k].trim() !== '').length;
    
    // Status counts for legend
    let notAnsweredCount = 0;
    let notVisitedCount = 0;
    let markedForReviewCount = flaggedQuestions.size;

    questions.forEach((_, idx) => {
        const isAnswered = (answers[questions[idx].id] && answers[questions[idx].id].length > 0) || 
                           (textAnswers[questions[idx].id] && textAnswers[questions[idx].id].trim() !== '');
        const isFlagged = flaggedQuestions.has(idx);
        const isVisited = visitedQuestions.has(idx);
        
        if (!isVisited) notVisitedCount++;
        else if (!isAnswered && !isFlagged) notAnsweredCount++;
    });

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-gray-800 font-sans flex flex-col selection:bg-[#0096a6]/20">
            {/* Top Header */}
            <header className="h-[55px] bg-[#0096a6] text-white flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
                <div className="flex items-center gap-4 h-full">
                    <span className="font-semibold text-lg tracking-wide hidden sm:inline shrink-0">Tests</span>
                    <div className="h-5 w-[1px] bg-white/30 hidden sm:block"></div>
                    <h1 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-md md:max-w-xl">
                        {quizInfo.title}
                    </h1>
                </div>
                <div className="flex items-center gap-6 h-full">
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden mt-1">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.05)] z-10 rounded-tl-md">
                    {/* Top Question Info Bar */}
                    <div className="flex items-center justify-between p-3 px-6 border-b border-gray-200 bg-white min-h-[50px] flex-wrap gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="font-extrabold text-sm text-gray-800 tracking-tight">Question No.{currentIdx + 1}</span>
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-bold border border-gray-200 shadow-sm">Marks: {currentQuestion.marks}</span>
                                {flaggedQuestions.has(currentIdx) && (
                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-bold border border-purple-200 shadow-sm">Marked for Review</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                            <div className="flex items-center gap-2 mr-2 border-r border-gray-300 pr-4">
                                 <span className="uppercase tracking-wider hidden sm:inline">Time Left:</span>
                                 <div className="font-mono text-[#0096a6] text-sm font-bold flex items-center gap-1 bg-[#0096a6]/10 px-2 py-1 rounded-md">
                                     <Clock size={14} />
                                     {formatTime(timeLeft)}
                                 </div>
                            </div>
                            <button className="hover:text-gray-800 flex items-center gap-1.5 transition-colors group relative" title="Bookmark this question to view later in your saved questions (Note: this does NOT submit your answer)">
                                <Bookmark size={14} /> Save
                            </button>
                            <button className="hover:text-gray-800 flex items-center gap-1.5 transition-colors" title="Report an issue with this question">
                                <AlertTriangle size={14} /> Report
                            </button>
                        </div>
                    </div>

                    {/* Question Box */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-24">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-[15px] md:text-base text-gray-800 leading-[1.6] mb-8 font-medium whitespace-pre-wrap">
                                {currentQuestion.text}
                            </h2>
                            
                            {currentQuestion.image && (
                                <div className="mb-8">
                                    <img src={currentQuestion.image} alt="Question Resource" className="max-w-[80%] rounded-lg border border-gray-200 shadow-sm" />
                                </div>
                            )}

                            <div className="space-y-4">
                                {['short', 'paragraph', 'code'].includes(currentQuestion.type || '') ? (
                                    <div className="mt-4">
                                        <textarea
                                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#0096a6] focus:ring-1 focus:ring-[#0096a6] min-h-[150px] resize-y text-gray-800 bg-gray-50"
                                            placeholder="Type your answer here..."
                                            value={textAnswers[currentQuestion.id] || ''}
                                            onChange={(e) => handleTextAnswer(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    currentQuestion.options.map((opt, idx) => {
                                        const isSelected = (answers[currentQuestion.id] || []).includes(idx);
                                        return (
                                            <label key={idx} className="flex items-start gap-4 cursor-pointer group hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors">
                                                <div className="mt-[3px] shrink-0">
                                                    <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? 'border-[#0096a6] bg-white' : 'border-gray-400 bg-white group-hover:border-[#0096a6]'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#0096a6]"></div>}
                                                    </div>
                                                </div>
                                                <span className={`text-[15px] leading-[1.5] transition-colors ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                                    {opt}
                                                </span>
                                                <input 
                                                    type="checkbox" 
                                                    className="hidden" 
                                                    checked={isSelected}
                                                    onChange={() => handleOptionSelect(idx)}
                                                />
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div className="border-t border-gray-300 bg-[#f8fafc] min-h-[60px] flex items-center justify-between px-6 sticky bottom-0 z-20 flex-wrap gap-4 py-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
                        <div className="flex gap-3 flex-wrap">
                            <button 
                                onClick={handleMarkAndNext} 
                                className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-[4px] text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                            >
                                Mark for Review & Next
                            </button>
                            <button 
                                onClick={handleClearResponse} 
                                className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-[4px] text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                            >
                                Clear Response
                            </button>
                        </div>
                        
                        <div className="flex gap-3 flex-wrap">
                            <button 
                                onClick={() => setCurrentIdx(prev => prev - 1)} 
                                disabled={currentIdx === 0} 
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-[4px] text-xs font-bold uppercase tracking-wider hover:bg-gray-300 disabled:opacity-50 disabled:hover:bg-gray-200 transition-colors"
                            >
                                Previous
                            </button>
                            {currentIdx === questions.length - 1 ? (
                                <button 
                                    onClick={handleSubmit} 
                                    className="px-8 py-2.5 bg-emerald-600 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    Submit
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSaveAndNext} 
                                    className="px-8 py-2.5 bg-[#0096a6] text-white rounded-[4px] text-xs font-bold uppercase tracking-wider hover:bg-[#007b89] transition-colors shadow-sm"
                                >
                                    Save & Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Navigation & Status) */}
                <div className="w-72 bg-[#f0f4f7] flex flex-col border-l border-gray-300 shrink-0 hidden lg:flex">
                    {/* Legend */}
                    <div className="p-4 border-b border-gray-300 grid grid-cols-2 gap-y-4 gap-x-2 text-[10px] font-bold text-gray-600 uppercase tracking-wide bg-white">
                        <div className="flex items-center gap-2">
                            <div className="w-[26px] h-[26px] rounded-t-[10px] rounded-br-[10px] bg-[#22c55e] text-white flex items-center justify-center shadow-sm text-xs font-bold">{answeredCount}</div>
                            <span className="leading-tight">Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-[26px] h-[26px] rounded-t-[10px] rounded-br-[10px] bg-red-500 text-white flex items-center justify-center shadow-sm text-xs font-bold">{notAnsweredCount}</div>
                            <span className="leading-tight">Not<br/>Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-[26px] h-[26px] rounded-t-[10px] rounded-br-[10px] bg-white border border-gray-300 text-gray-500 flex items-center justify-center shadow-sm text-xs font-bold">{notVisitedCount}</div>
                            <span className="leading-tight">Not<br/>Visited</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-[26px] h-[26px] rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-sm text-xs font-bold">{markedForReviewCount}</div>
                            <span className="leading-tight">Marked for<br/>Review</span>
                        </div>
                    </div>
                    
                    {/* Section Header */}
                    <div className="bg-[#0096a6]/10 px-4 py-3 font-extrabold text-[#0096a6] text-xs border-b border-gray-300 flex justify-between items-center">
                        <span>SECTION : Chapter Test</span>
                    </div>

                    {/* Timer Box Removed and moved to top bar */}
                    
                    {/* Question Palette */}
                    <div className="flex-1 overflow-y-auto p-5 bg-[#e8f1f5]">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((_, idx) => {
                                const isAnswered = (answers[questions[idx].id] && answers[questions[idx].id].length > 0) || 
                                                   (textAnswers[questions[idx].id] && textAnswers[questions[idx].id].trim() !== '');
                                const isFlagged = flaggedQuestions.has(idx);
                                const isVisited = visitedQuestions.has(idx);
                                
                                let shapeClass = "rounded-t-[12px] rounded-br-[12px]"; // default Testbook shape
                                let colorClass = "bg-white text-gray-600 border border-gray-300"; // not visited
                                
                                if (isFlagged) {
                                    shapeClass = "rounded-full";
                                    colorClass = "bg-[#8b5cf6] text-white border border-[#8b5cf6]";
                                } else if (isAnswered) {
                                    colorClass = "bg-[#22c55e] text-white border border-[#22c55e]";
                                } else if (isVisited) {
                                    colorClass = "bg-red-500 text-white border border-red-500";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={`w-[42px] h-[42px] flex items-center justify-center font-bold text-sm shadow-sm transition-transform hover:scale-110
                                            ${shapeClass} ${colorClass}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-gray-300">
                         <button onClick={handleSubmit} className="w-full py-3 bg-[#0096a6] text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-[#007b89] transition-colors shadow-md">
                              Submit Test
                         </button>
                    </div>
                </div>
            </div>

            {/* Warning Modal */}
            {warningModalOpen && !isSubmitted && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-8 max-w-[500px] w-full text-center shadow-2xl">
                        <ShieldAlert size={48} className="text-red-500 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase">Warning: Violation Detected</h3>
                        <p className="text-gray-600 font-medium mb-6">
                            A security breach was detected (tab switch or minimized). 
                            <span className="block mt-2 text-red-600 font-bold">This is your ONLY warning. A second violation will result in immediate automatic submission.</span>
                        </p>
                        <button
                            onClick={() => {
                                setWarningModalOpen(false);
                                if (!document.fullscreenElement) enterFullscreen();
                            }}
                            className="w-full bg-red-600 text-white py-3 font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                        >
                            RE-ENTER EXAM & CONTINUE
                        </button>
                    </div>
                </div>
            )}

            {/* Entry Overlay - Mandatory Fullscreen */}
            {!isFullscreenState && !isSubmitted && questions.length > 0 && !warningModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-white">
                    <div className="max-w-md w-full text-center">
                        <Monitor size={48} className="text-[#0096a6] mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Quiz</h2>
                        <p className="text-gray-600 font-medium mb-8">
                            To ensure exam integrity, this quiz must be taken in Fullscreen Mode. Minimizing or switching tabs will be recorded as a violation.
                        </p>
                        <button
                            onClick={enterFullscreen}
                            className="w-full bg-[#0096a6] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#007b89] transition-all shadow-lg"
                        >
                            START QUIZ NOW
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizTakePage;
