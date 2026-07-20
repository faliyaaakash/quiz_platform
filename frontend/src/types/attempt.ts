export interface AnswerResponse {
    questionId: string;
    selectedOptions: number[]; // Indices of selected options
    isCorrect?: boolean;
    marksAwarded?: number;
}

export interface Attempt {
    id: string;
    quizId: string;
    userId: string;
    answers: AnswerResponse[];
    startTime: string;
    endTime?: string;
    score?: number;
    totalPossibleScore?: number;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'AUTO_SUBMITTED';
    proctoringViolations?: number;
}

export interface AttemptSummary {
    id: string;
    quizTitle: string;
    score: number;
    totalMarks: number;
    date: string;
    status: Attempt['status'];
}
