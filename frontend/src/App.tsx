import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from './services/authService';

// Specialized components
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Lazy load all page components
const SigninPage = lazy(() => import('./pages/SigninPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CreateQuizPage = lazy(() => import('./pages/CreateQuizPage'));
const MyQuizzesPage = lazy(() => import('./pages/MyQuizzesPage'));
const QuizRulesPage = lazy(() => import('./pages/QuizRulesPage'));
const QuizTakePage = lazy(() => import('./pages/QuizTakePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const QuizResponsesPage = lazy(() => import('./pages/QuizResponsesPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ResultDetailsPage = lazy(() => import('./pages/ResultDetailsPage'));

// Loading component for Suspense fallback
const PageLoader = () => (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-4 text-text-white">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-muted animate-pulse">Loading...</p>
    </div>
);

const getCookie = (name: string): string | undefined => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

function App() {
    console.log('💡 App.tsx: Rendering App component...');
    useEffect(() => {
        // On app load, proactively verify the session if the hint exists.
        const verifyAuth = async () => {
            const isLoggedIn = getCookie('is_logged_in') === 'true';
            if (isLoggedIn) {
                try {
                    await authService.getProfile();
                } catch (error) {
                    console.warn('Initial session verification failed. Session might be stale.');
                }
            }
        };
        verifyAuth();
    }, []);

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes - Protected from authenticated users */}
                    <Route path="/login" element={<PublicRoute><SigninPage /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                    <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
                    <Route path="/" element={<HomePage />} />

                    {/* Protected Routes (Require Authentication) */}
                    <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/profile" replace /></ProtectedRoute>} />
                    <Route path="/create-quiz" element={<ProtectedRoute><CreateQuizPage /></ProtectedRoute>} />
                    <Route path="/my-quizzes" element={<ProtectedRoute><MyQuizzesPage /></ProtectedRoute>} />
                    <Route path="/quiz/:id/responses" element={<ProtectedRoute><QuizResponsesPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    
                    {/* Quiz Taking/Rules Routes */}
                    <Route path="/quiz-rules/:id" element={<ProtectedRoute><QuizRulesPage /></ProtectedRoute>} />
                    <Route path="/quiz/take/:id" element={<ProtectedRoute><QuizTakePage /></ProtectedRoute>} />
                    <Route path="/quiz/result/:attemptId" element={<ProtectedRoute><ResultDetailsPage /></ProtectedRoute>} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
