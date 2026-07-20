import { User } from '../types/user';
import { apiClient } from './apiClient';

interface AuthResponse {
    csrfToken: string;
    user: User;
    message: string;
}

export const authService = {
    /**
     * Fetch a fresh CSRF token from the server
     */
    fetchCsrfToken: async (): Promise<void> => {
        await apiClient('/auth/csrf-token');
        // The token is automatically set in a cookie, and apiClient will read it
    },

    /**
     * Sign up a new user
     */
    signUp: async (data: any): Promise<AuthResponse> => {
        const response = await apiClient('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(result.message || 'Signup failed') as any;
            error.status = response.status;
            throw error;
        }

        return result;
    },

    /**
     * Login user
     */
    login: async (data: any): Promise<AuthResponse> => {
        const response = await apiClient('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(result.message || 'Login failed') as any;
            error.status = response.status;
            throw error;
        }

        return result;
    },

    /**
     * Google Login
     */
    googleLogin: async (credential: string): Promise<AuthResponse> => {
        const response = await apiClient('/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Google Login failed');
        }

        return result;
    },

    /**
     * Logout user
     */
    logout: async () => {
        try {
            await apiClient('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout request failed:', error);
        }
    },

    /**
     * Forgot Password
     */
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await apiClient('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(result.message || 'Failed to send reset email') as any;
            error.status = response.status;
            throw error;
        }

        return result;
    },

    /**
     * Reset Password
     */
    resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
        const response = await apiClient(`/auth/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to reset password');
        }

        return result;
    },

    /**
     * Get current user profile
     */
    getProfile: async (): Promise<User> => {
        const response = await apiClient('/auth/profile', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch profile');
        }

        return result;
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: any): Promise<{ message: string, user: User }> => {
        const response = await apiClient('/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile');
        }

        return result;
    }
};
