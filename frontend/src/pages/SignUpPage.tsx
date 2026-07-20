import React, { useState } from 'react';
import { Mail, User, Lock, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';

const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/profile';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [blockedUntil, setBlockedUntil] = useState<number | null>(() => {
        const ipBlocked = localStorage.getItem('signup_ip_blocked_until');
        const dailyBlocked = localStorage.getItem('signup_blocked_until');
        
        const now = Date.now();
        const ipTime = ipBlocked ? parseInt(ipBlocked, 10) : 0;
        const dailyTime = dailyBlocked ? parseInt(dailyBlocked, 10) : 0;
        
        if (ipTime > now) return ipTime;
        if (dailyTime > now) return dailyTime;
        return null;
    });

    const [remainingTime, setRemainingTime] = useState<number>(0);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });

    React.useEffect(() => {
        if (!blockedUntil) return;

        const interval = setInterval(() => {
            const now = Date.now();
            if (now >= blockedUntil) {
                setBlockedUntil(null);
                localStorage.removeItem('signup_blocked_until');
                localStorage.removeItem('signup_ip_blocked_until');
                setRemainingTime(0);
                clearInterval(interval);
            } else {
                setRemainingTime(Math.ceil((blockedUntil - now) / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [blockedUntil]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blockedUntil && Date.now() < blockedUntil) return;

        setLoading(true);
        setError(null);

        try {
            await authService.signUp(formData);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            if (err.status === 429) {
                let blockDuration = 24 * 60 * 60 * 1000; // Default 24h
                let storageKey = 'signup_blocked_until';

                // Check for the 1-hour block messages
                if (err.message.includes('1 hour') || err.message.includes('device is now blocked')) {
                    blockDuration = 60 * 60 * 1000; // 1 hour
                    storageKey = 'signup_ip_blocked_until';
                }

                const blockTime = Date.now() + blockDuration;
                setBlockedUntil(blockTime);
                localStorage.setItem(storageKey, blockTime.toString());
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle={
                <>
                    Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </>
            }
        >
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[0.95rem] font-medium text-text-white">Password</label>
                    <Input
                        icon={Lock}
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[0.95rem] font-medium text-text-white">Full name</label>
                    <Input
                        icon={User}
                        type="text"
                        name="name"
                        placeholder="Username"
                        required
                        autoComplete="name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                </div>

                <Button type="submit" disabled={loading || (!!blockedUntil && remainingTime > 0)}>
                    {loading ? (
                        <Loader2 className="animate-spin mx-auto" size={20} />
                    ) : (!!blockedUntil && remainingTime > 0) ? (
                        `Blocked (${formatTime(remainingTime)})`
                    ) : (
                        'Create account'
                    )}
                </Button>

                {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <>
                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-border-color"></div>
                            <span className="flex-shrink mx-4 text-text-muted text-[0.85rem]">Or continue with</span>
                            <div className="flex-grow border-t border-border-color"></div>
                        </div>

                        <div className="flex justify-center w-full">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        try {
                                            setLoading(true);
                                            await authService.googleLogin(credentialResponse.credential);
                                            navigate(from, { replace: true });
                                        } catch (err: any) {
                                            setError(err.message || 'Google Sign up failed');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                onError={() => {
                                    setError('Google Sign up failed');
                                }}
                                useOneTap
                                theme="filled_black"
                                shape="pill"
                                text="continue_with"
                                width="100%"
                            />
                        </div>
                    </>
                )}
            </form>
        </AuthLayout>
    );
};

export default SignUpPage;
