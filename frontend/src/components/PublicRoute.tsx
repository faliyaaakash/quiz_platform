import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface PublicRouteProps {
    children: React.ReactNode;
}

const getCookie = (name: string): string | undefined => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

/**
 * PublicRoute component directs authenticated users away from public-only pages 
 * (like Login, Signup, Forgot Password) to their profile/dashboard.
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const location = useLocation();
    const isLoggedIn = getCookie('is_logged_in') === 'true';

    if (isLoggedIn) {
        // Redirect authenticated users to the profile page
        const from = (location.state as any)?.from?.pathname || '/profile';
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
