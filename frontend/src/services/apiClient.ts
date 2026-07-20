const API_BASE_URL = '/api';

/**
 * Utility to extract cookie value by name from document.cookie
 */
const getCookie = (name: string): string | undefined => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

export const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    // 🛡️ Set up headers
    const headers = new Headers(options.headers || {});
    
    // 🛡️ Double Submit Cookie Protection: Retrieve token from readable cookie
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
        headers.set('X-XSRF-TOKEN', xsrfToken);
    }
    
    const config: RequestInit = {
        ...options,
        headers,
        // 🔒 MANDATORY: Always include credentials for HttpOnly cookie support
        credentials: 'include',
    };
    
    // Auto-prepend base URL if a relative path is provided
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);
        
        // Global handler for 401 Unauthorized (Session Expired or Missing)
        if (response.status === 401) {
            console.warn('Unauthorized access: Session is invalid or expired. Redirecting to login.');
            
            // Redirect user to login page if they are not already there
            if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/quiz/take')) {
                window.location.href = '/login';
            }
        }
        
        return response;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};
