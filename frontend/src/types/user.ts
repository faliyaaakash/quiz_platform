export interface User {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    coverImage?: string;
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: {
        github?: string;
        linkedin?: string;
        twitter?: string;
    };
    skills?: string[];
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

export interface UserStats {
    totalQuizzesTaken: number;
    averageScore: number;
    completedTopics: number;
    recentActivity: {
        id: string;
        quizId: string;
        title: string;
        category: string;
        score: number;
        totalMarks: number;
        percentage: number;
        date: string;
    }[];
    attemptHistory: {
        id: string;
        quizId: string;
        title: string;
        category: string;
        score: number;
        totalMarks: number;
        percentage: number;
        date: string;
    }[];
}
