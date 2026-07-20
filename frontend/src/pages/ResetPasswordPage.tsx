import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/authService';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (!token) throw new Error('Invalid or missing token');
            
            await authService.resetPassword(token, password);
            setSubmitted(true);
            
            // Auto redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <AuthLayout
                title="Password reset successful"
                subtitle="Your password has been successfully reset. You can now log in with your new password."
            >
                <div className="flex flex-col items-center gap-8 py-4">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle2 size={40} />
                    </div>
                    
                    <p className="text-text-muted text-center text-[0.95rem] leading-relaxed">
                        Redirecting you to the login page in a few seconds...
                    </p>

                    <Link 
                        to="/login" 
                        className="flex items-center gap-2 text-primary hover:underline font-medium transition-all group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Go to Sign in now
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Set new password"
            subtitle="Please enter your new password below. Make sure it's secure."
        >
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-[0.95rem] font-medium text-text-white">New Password</label>
                    <Input
                        icon={Lock}
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[0.95rem] font-medium text-text-white">Confirm New Password</label>
                    <Input
                        icon={Lock}
                        type="password"
                        name="confirm-password"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

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
            </form>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
