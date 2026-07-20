export interface Question {
    id: string;
    text: string;
    image: string | null;
    options: string[];
    isMultiCorrect: boolean;
    correctAnswers: number[]; // Indices of correct options
    marks: number;
    type: 'mcq' | 'multi-mcq' | 'tf' | 'short' | 'paragraph' | 'code';
    explanation?: string;
    timer?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export type QuizCategory = 'General' | 'Programming' | 'Design' | 'Marketing' | string;

export interface QuizInfo {
    id: string;
    title: string;
    description: string;
    category: QuizCategory;
    timeLimit: number; // in minutes
    totalMarks: number;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'published';
    negativeMarking?: {
        enabled: boolean;
        penalty: number;
    };
    randomization?: {
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
        preventBackNavigation: boolean;
    };
    antiCheat?: {
        disableCopyPaste: boolean;
        disableTabSwitching: boolean;
        webcamMonitoring: boolean;
        fullscreenMode: boolean;
    };
    tags?: string[];
}

export interface Quiz extends QuizInfo {
    questions: Question[];
}
