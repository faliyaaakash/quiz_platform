import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authService.forgotPassword(email);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <AuthLayout
                title="Check your email"
                subtitle="If an account exists with that email, a reset link has been sent."
            >
                <div className="flex flex-col items-center gap-8 py-4">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle2 size={40} />
                    </div>

                    <p className="text-text-muted text-center text-[0.95rem] leading-relaxed">
                        Didn't receive the email? Check your spam folder or try again in a few minutes.
                    </p>

                    <Link
                        to="/login"
                        className="flex items-center gap-2 text-primary hover:underline font-medium transition-all group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Sign in
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot password?"
            subtitle="No worries, we'll send you reset instructions. Just enter the email address you used to sign up."
        >
            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-[0.95rem] font-medium text-text-white">Email address</label>
                    <Input
                        icon={Mail}
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Reset Password'}
                    </Button>

                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors font-medium text-[0.95rem] group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Sign in
                    </Link>
                </div>
            </form>

            <div className="text-center mt-12 text-text-muted text-[0.85rem] select-none">
                <p>© 2026 Passwd Generator Inc. All rights reserved.</p>
            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
