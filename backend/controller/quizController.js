import { Types } from 'mongoose';
import Quiz from '../models/quizModel.js';
import Attempt from '../models/attemptModel.js';
import '../models/userModel.js'; // Ensures user model is registered for mongoose.populate('user')
/**
 * Create a new quiz
 * Accessible only by authenticated users. Saves a draft quiz to the database.
 */
export const createQuiz = async (req, res) => {
    try {
        const { title, description, category, timeLimit, totalMarks, passingMarks, maxAttempts, questions } = req.body;
        // Ensure the user is authenticated and attached to the request by the authMiddleware
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // Construct the new Quiz document
        const newQuiz = new Quiz({
            title,
            description,
            category,
            timeLimit,
            totalMarks,
            passingMarks,
            maxAttempts: maxAttempts || 0,
            creator: req.user.id, // Tie the quiz to the user who created it
            questions,
            isPublished: false, // Quizzes default to a draft state
            isActive: true
        });
        // Save to MongoDB
        await newQuiz.save();
        res.status(201).json(newQuiz);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
};
/**
 * Get a quiz by ID
 * Typically used by students taking the quiz, or creators previewing it.
 */
export const getQuiz = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // Fetch quiz by its unique MongoDB ObjectId
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Security check: Only return the quiz to standard users if it has been published
        const isCreator = quiz.creator.toString() === userId;
        if (!quiz.isPublished && !isCreator) {
            res.status(403).json({ message: 'Quiz is not published yet' });
            return;
        }
        // Enforcement: If NOT the creator, check for max attempts
        if (!isCreator && quiz.maxAttempts > 0) {
            const attemptCount = await Attempt.countDocuments({
                quiz: quiz._id,
                user: userId,
                status: { $in: ['COMPLETED', 'AUTO_SUBMITTED'] }
            });
            if (attemptCount >= quiz.maxAttempts) {
                res.status(403).json({
                    message: `Limit Reached: You have already used all ${quiz.maxAttempts} allowed attempts for this quiz.`
                });
                return;
            }
        }
        // Security check: If the quiz has a scheduled start time, block it if it hasn't started
        if (!isCreator && quiz.startDate && new Date() < quiz.startDate) {
            res.status(403).json({
                message: 'Quiz has not started yet',
                startDate: quiz.startDate
            });
            return;
        }
        // Security check: If the quiz has a strict end time, block it if it's expired
        if (!isCreator && quiz.endDate && new Date() > quiz.endDate) {
            res.status(410).json({ message: 'Quiz has expired' });
            return;
        }
        res.json(quiz);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
};
/**
 * Publish a quiz
 * Transitions a quiz from 'draft' to 'published' and sets its start/end window based on its time limit.
 */
export const publishQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Security Check: Verify that the user attempting to publish is the actual creator of the quiz
        if (quiz.creator.toString() !== req.user?.id) {
            res.status(403).json({ message: 'Not authorized to publish this quiz' });
            return;
        }
        // Validation before publishing
        if (!quiz.title.trim()) {
            res.status(400).json({ message: 'Quiz title is required' });
            return;
        }
        for (let i = 0; i < quiz.questions.length; i++) {
            const q = quiz.questions[i];
            const qNum = i + 1;
            if (!q.text.trim()) {
                res.status(400).json({ message: `Question ${qNum} text is required` });
                return;
            }
            if (['mcq', 'multi-mcq', 'tf'].includes(q.type)) {
                if (!q.correctAnswers || q.correctAnswers.length === 0) {
                    res.status(400).json({ message: `Question ${qNum} (${q.type.toUpperCase()}) must have at least one correct answer selected` });
                    return;
                }
                if (['mcq', 'multi-mcq'].includes(q.type)) {
                    const filledOptions = q.options.filter(opt => opt.trim() !== '');
                    if (filledOptions.length < 2) {
                        res.status(400).json({ message: `Question ${qNum} (${q.type.toUpperCase()}) must have at least two options filled` });
                        return;
                    }
                }
            }
        }
        // Calculate the availability window for the quiz
        const { startDate: customStart, endDate: customEnd } = req.body;
        const startDate = customStart ? new Date(customStart) : new Date();
        const endDate = customEnd ? new Date(customEnd) : undefined;
        quiz.isPublished = true;
        quiz.startDate = startDate;
        quiz.endDate = endDate;
        quiz.publishedAt = new Date();
        await quiz.save();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.json({
            message: 'Quiz published successfully',
            quizLink: `${frontendUrl}/quiz-rules/${quiz._id}`, // Generate a shareable link
            expiresAt: endDate
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error publishing quiz', error: error.message });
    }
};
/**
 * Get all quizzes created by the logged-in user
 * Used by the creator dashboard.
 */
export const getMyQuizzes = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const quizzes = await Quiz.find({ creator: req.user.id }).lean();
        // For each quiz, get attempt count and average score
        const quizzesWithStats = await Promise.all(quizzes.map(async (quiz) => {
            const attempts = await Attempt.find({
                quiz: quiz._id,
                status: { $in: ['COMPLETED', 'AUTO_SUBMITTED'] }
            });
            const attemptCount = attempts.length;
            let avgScore = 0;
            if (attemptCount > 0) {
                const totalScorePercent = attempts.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0);
                avgScore = Math.round(totalScorePercent / attemptCount);
            }
            return {
                ...quiz,
                attempts: attemptCount,
                avgScore: avgScore
            };
        }));
        res.json(quizzesWithStats);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching your quizzes', error: error.message });
    }
};
/**
 * Get statistics for the logged-in user (Student Perspective)
 */
export const getUserStats = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const userId = req.user.id;
        // Fetch all completed attempts for the user
        const attempts = await Attempt.find({ user: userId, status: 'COMPLETED' })
            .populate('quiz', 'title category')
            .sort({ endTime: -1 });
        if (attempts.length === 0) {
            res.json({
                totalQuizzesTaken: 0,
                averageScore: 0,
                completedTopics: 0,
                recentActivity: []
            });
            return;
        }
        const totalQuizzesTaken = attempts.length;
        const totalScore = attempts.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0);
        const averageScore = Math.round(totalScore / totalQuizzesTaken);
        // Extract unique categories from populated quiz data
        const categories = new Set(attempts.map(a => a.quiz?.category).filter(Boolean));
        const completedTopics = categories.size;
        // Get 5 most recent activities
        const recentActivity = attempts.slice(0, 5).map(a => ({
            id: a._id,
            quizId: a.quiz?._id,
            title: a.quiz?.title,
            category: a.quiz?.category,
            score: a.score,
            totalMarks: a.totalMarks,
            percentage: Math.round((a.score / a.totalMarks) * 100),
            date: a.endTime,
            isPassed: a.isPassed
        }));
        res.json({
            totalQuizzesTaken,
            averageScore,
            completedTopics,
            recentActivity,
            attemptHistory: attempts.map(a => ({
                id: a._id,
                quizId: a.quiz?._id,
                title: a.quiz?.title,
                category: a.quiz?.category,
                score: a.score,
                totalMarks: a.totalMarks,
                percentage: Math.round((a.score / a.totalMarks) * 100),
                date: a.endTime,
                isPassed: a.isPassed
            }))
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
    }
};
/**
 * Delete a quiz
 * Authenticated users can delete their own quizzes.
 */
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Security Check: Only the creator can delete the quiz
        if (quiz.creator.toString() !== req.user?.id) {
            res.status(403).json({ message: 'Not authorized to delete this quiz' });
            return;
        }
        await Quiz.findByIdAndDelete(req.params.id);
        // Note: Associated attempts could also be deleted here if required
        // await Attempt.deleteMany({ quiz: req.params.id });
        res.json({ message: 'Quiz deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};
/**
 * Bulk delete quizzes
 * Deletes multiple quizzes if they belong to the authenticated user.
 */
export const deleteQuizzesBatch = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: 'No quiz IDs provided' });
            return;
        }
        // Only delete quizzes that belong to this user
        const result = await Quiz.deleteMany({
            _id: { $in: ids },
            creator: req.user?.id
        });
        res.json({
            message: 'Quizzes deleted successfully',
            deletedCount: result.deletedCount
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting quizzes', error: error.message });
    }
};
/**
 * Get attempt status for a user on a specific quiz
 */
export const getAttemptStatus = async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user?.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        const isCreator = quiz.creator.toString() === userId;
        const attemptCount = await Attempt.countDocuments({
            quiz: quizId,
            user: userId,
            status: { $in: ['COMPLETED', 'AUTO_SUBMITTED'] } // Count finished attempts
        });
        const canAttempt = isCreator || quiz.maxAttempts === 0 || attemptCount < quiz.maxAttempts;
        res.json({
            attemptCount,
            maxAttempts: quiz.maxAttempts,
            canAttempt
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error checking attempt status', error: error.message });
    }
};
/**
 * Submit a quiz attempt
 */
export const submitQuiz = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const { answers, proctoringViolations, startTime } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Enforcement: Check for max attempts
        if (quiz.maxAttempts > 0) {
            const attemptCount = await Attempt.countDocuments({
                quiz: quizId,
                user: userId,
                status: { $in: ['COMPLETED', 'AUTO_SUBMITTED'] }
            });
            if (attemptCount >= quiz.maxAttempts) {
                res.status(403).json({
                    message: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`
                });
                return;
            }
        }
        let score = 0;
        const processedAnswers = answers.filter((ans) => {
            // Only process answers for valid question IDs
            return ans?.questionId && Types.ObjectId.isValid(ans.questionId);
        }).map((ans) => {
            const question = quiz.questions.find((q) => q._id.toString() === ans.questionId);
            if (question) {
                const isCorrect = question.correctAnswers.length === ans.selectedOptions.length &&
                    question.correctAnswers.every((val) => ans.selectedOptions.includes(val));
                if (isCorrect) {
                    // Ensure marks is a number before adding to score
                    const marksValue = Number(question.marks) || 0;
                    score += marksValue;
                }
            }
            return {
                questionId: new Types.ObjectId(ans.questionId),
                selectedOptions: (ans.selectedOptions || []).map(Number)
            };
        });
        // 🛑 Anti-Cheat Enforcement 🛑
        const hasCheated = proctoringViolations && proctoringViolations > 0;
        if (hasCheated) {
            score = 0; // Absolute zero tolerance for cheating
        }
        const isPassed = hasCheated ? false : score >= quiz.passingMarks;
        const isCreator = quiz.creator.toString() === userId;
        if (isCreator) {
            res.status(200).json({
                message: 'Preview submitted successfully',
                score,
                totalMarks: quiz.totalMarks,
                isPassed,
                isPreview: true
            });
            return;
        }
        const attempt = new Attempt({
            quiz: quizId,
            user: userId,
            answers: processedAnswers,
            score,
            totalMarks: quiz.totalMarks,
            isPassed,
            status: 'COMPLETED',
            startTime: startTime ? new Date(startTime) : new Date(),
            endTime: new Date(),
            proctoringViolations: proctoringViolations || 0
        });
        await attempt.save();
        res.status(201).json({
            message: 'Quiz submitted successfully',
            score,
            totalMarks: quiz.totalMarks,
            isPassed,
            attemptId: attempt._id
        });
    }
    catch (error) {
        console.error('Submission Error:', error);
        res.status(500).json({
            message: 'Error submitting quiz',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
/**
 * Get analytics for a specific quiz (Creator Perspective)
 */
export const getQuizAnalytics = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const userId = req.user?.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Security Check: Only the creator can view full analytics
        if (!quiz.creator || quiz.creator.toString() !== userId) {
            res.status(403).json({ message: 'Not authorized to view analytics for this quiz' });
            return;
        }
        const attempts = await Attempt.find({ quiz: quizId, status: { $in: ['COMPLETED', 'AUTO_SUBMITTED'] } })
            .populate('user', 'fullName email')
            .sort({ endTime: -1 });
        if (attempts.length === 0) {
            res.json({
                title: quiz.title,
                totalAttempts: 0,
                averageScore: 0,
                passRate: 0,
                scoreDistribution: [],
                responses: []
            });
            return;
        }
        const totalAttempts = attempts.length;
        const totalScore = attempts.reduce((acc, curr) => {
            const marks = curr.totalMarks || 1; // Avoid division by zero
            return acc + (curr.score / marks) * 100;
        }, 0);
        const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
        const passedAttempts = attempts.filter(a => a.isPassed).length;
        const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
        // Score Distribution (0-20, 21-40, 41-60, 61-80, 81-100)
        const distribution = [0, 0, 0, 0, 0];
        attempts.forEach(a => {
            const percentage = (a.score / a.totalMarks) * 100;
            if (percentage <= 20)
                distribution[0]++;
            else if (percentage <= 40)
                distribution[1]++;
            else if (percentage <= 60)
                distribution[2]++;
            else if (percentage <= 80)
                distribution[3]++;
            else
                distribution[4]++;
        });
        const scoreDistribution = [
            { range: '0-20%', count: distribution[0] },
            { range: '21-40%', count: distribution[1] },
            { range: '41-60%', count: distribution[2] },
            { range: '61-80%', count: distribution[3] },
            { range: '81-100%', count: distribution[4] }
        ];
        // Calculate Per-Question Performance
        const questionPerformance = quiz.questions.map((q, idx) => {
            const questionAttempts = attempts.length; // Each completed attempt has this question
            let correctCount = 0;
            let incorrectCount = 0;
            const optionCounts = {};
            q.options.forEach((_, oIdx) => {
                optionCounts[String.fromCharCode(65 + oIdx)] = 0;
            });
            attempts.forEach(attempt => {
                const userAns = attempt.answers.find(a => a.questionId.toString() === q._id.toString());
                if (userAns) {
                    const isCorrect = userAns.selectedOptions.length === q.correctAnswers.length &&
                        userAns.selectedOptions.every((val) => q.correctAnswers.includes(val));
                    if (isCorrect)
                        correctCount++;
                    else
                        incorrectCount++;
                    // Count each selected option
                    userAns.selectedOptions.forEach(optIdx => {
                        const letter = String.fromCharCode(65 + optIdx);
                        if (optionCounts[letter] !== undefined) {
                            optionCounts[letter]++;
                        }
                    });
                }
                else {
                    // Question was skipped or not reached
                    incorrectCount++;
                }
            });
            return {
                question: `Q${idx + 1}`,
                questionId: q._id,
                text: q.text,
                correctCount,
                incorrectCount,
                correctPercent: questionAttempts > 0 ? Math.round((correctCount / questionAttempts) * 100) : 0,
                attemptRate: 100, // For now we assume all completed attempts saw all questions
                ...optionCounts
            };
        });
        const responses = attempts.map(a => {
            const durationMs = a.endTime && a.startTime ? a.endTime.getTime() - a.startTime.getTime() : 0;
            const durationMins = Math.round(durationMs / 60000);
            return {
                id: a._id,
                userName: a.user?.fullName || 'Unknown',
                email: a.user?.email || 'N/A',
                score: Math.round((a.score / a.totalMarks) * 100),
                rawScore: a.score,
                totalMarks: a.totalMarks,
                timeTaken: durationMins,
                submittedAt: a.endTime,
                status: a.proctoringViolations > 0 ? 'cheated' : (a.isPassed ? 'passed' : 'failed')
            };
        });
        // Ensure responses are not returning Infinity/NaN
        const sanitizedResponses = responses.map(r => ({
            ...r,
            score: (isNaN(r.score) || !isFinite(r.score)) ? 0 : r.score
        }));
        // Calculate Leaderboard
        const leaderboard = [...sanitizedResponses]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => ({ name: r.userName, score: r.score }));
        // Calculate Attempts Over Time (Last 7 days/distinct dates)
        const attemptsMap = {};
        sanitizedResponses.forEach(r => {
            if (r.submittedAt) {
                const date = new Date(r.submittedAt).toLocaleDateString('en-US', { weekday: 'short' });
                attemptsMap[date] = (attemptsMap[date] || 0) + 1;
            }
        });
        const attemptsOverTime = Object.entries(attemptsMap).map(([date, count]) => ({ date, attempts: count }));
        res.json({
            title: quiz.title,
            totalAttempts,
            averageScore,
            passRate,
            passingMarks: quiz.passingMarks,
            totalMarks: quiz.totalMarks,
            scoreDistribution,
            questionPerformance,
            leaderboard,
            attemptsOverTime,
            responses: sanitizedResponses
        });
    }
    catch (error) {
        // Error handled silently
        res.status(500).json({ message: 'Error fetching quiz analytics', error: error.message });
    }
};
/**
 * Get detailed information for a single attempt
 */
export const getAttemptDetails = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const userId = req.user?.id;
        const attempt = await Attempt.findById(attemptId)
            .populate('quiz')
            .populate('user', 'name email');
        if (!attempt) {
            res.status(404).json({ message: 'Attempt not found' });
            return;
        }
        const quiz = attempt.quiz;
        // Security Check: Either the participant or the quiz creator can view details
        if (attempt.user._id.toString() !== userId && quiz.creator.toString() !== userId) {
            res.status(403).json({ message: 'Not authorized to view this attempt' });
            return;
        }
        const durationMs = attempt.endTime && attempt.startTime ? attempt.endTime.getTime() - attempt.startTime.getTime() : 0;
        const durationMins = Math.round(durationMs / 60000);
        // Map questions with user responses
        const isCreator = quiz.creator.toString() === userId;
        const questionReview = quiz.questions.map((q) => {
            const userAns = attempt.answers.find(a => a.questionId.toString() === q._id.toString());
            const correctFlag = userAns ? (userAns.selectedOptions.length === q.correctAnswers.length &&
                userAns.selectedOptions.every((val) => q.correctAnswers.includes(val))) : false;
            return {
                questionId: q._id,
                text: q.text,
                options: q.options,
                type: q.type,
                // 🔒 Security: Only show correct keys to the creator
                correctAnswers: isCreator ? q.correctAnswers : [],
                userSelectedOptions: userAns ? userAns.selectedOptions : [],
                // 🔒 Student only sees IF they were correct if you want, but for max security we can mask this too
                // For now, we'll keep isCorrect for the score logic but we'll hide it in UI for students
                isCorrect: isCreator ? correctFlag : undefined,
                marks: q.marks,
                earnedMarks: correctFlag ? q.marks : 0,
                // 🔒 Security: Only show explanations to the creator
                explanation: isCreator ? q.explanation : undefined
            };
        });
        res.json({
            attemptId: attempt._id,
            quizTitle: quiz.title,
            participant: attempt.user?.name,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: Math.round((attempt.score / attempt.totalMarks) * 100),
            isPassed: attempt.isPassed,
            timeTaken: durationMins,
            submittedAt: attempt.endTime,
            proctoringViolations: attempt.proctoringViolations,
            isCreator, // Send flag so UI can adjust
            questions: questionReview
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching attempt details', error: error.message });
    }
};
/**
 * Update an existing quiz
 */
export const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Security Check: Only the creator can update the quiz
        if (quiz.creator.toString() !== req.user?.id) {
            res.status(403).json({ message: 'Not authorized to update this quiz' });
            return;
        }
        // Restriction Check: Block editing if the quiz is already active/open (Removed as per user request to allow editing with confirmation)
        /*
        if (quiz.isPublished && quiz.startDate && new Date() >= quiz.startDate) {
            res.status(403).json({
                message: 'Cannot edit an active quiz. Only quizzes that have not yet started can be modified.'
            });
            return;
        }
        */
        const { title, description, category, timeLimit, totalMarks, passingMarks, maxAttempts, questions, tags, negativeMarking, randomization, antiCheat } = req.body;
        // Update fields if provided
        if (title !== undefined)
            quiz.title = title;
        if (description !== undefined)
            quiz.description = description;
        if (category !== undefined)
            quiz.category = category;
        if (timeLimit !== undefined)
            quiz.timeLimit = timeLimit;
        if (totalMarks !== undefined)
            quiz.totalMarks = totalMarks;
        if (passingMarks !== undefined)
            quiz.passingMarks = passingMarks;
        if (maxAttempts !== undefined)
            quiz.maxAttempts = maxAttempts;
        if (questions !== undefined)
            quiz.questions = questions;
        if (tags !== undefined)
            quiz.tags = tags;
        if (negativeMarking !== undefined)
            quiz.negativeMarking = negativeMarking;
        if (randomization !== undefined)
            quiz.randomization = randomization;
        if (antiCheat !== undefined)
            quiz.antiCheat = antiCheat;
        await quiz.save();
        res.json({ message: 'Quiz updated successfully', quiz });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating quiz', error: error.message });
    }
};
/**
 * Export quiz responses as CSV
 */
export const exportQuizResponses = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const userId = req.user?.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        // Security Check: Only the creator can export responses
        if (!quiz.creator || quiz.creator.toString() !== userId) {
            res.status(403).json({ message: 'Not authorized to export responses for this quiz' });
            return;
        }
        const attempts = await Attempt.find({ quiz: quizId, status: { $in: ['COMPLETED', 'AUTO_SUBMITTED'] } })
            .populate('user', 'fullName email')
            .sort({ endTime: -1 });
        if (attempts.length === 0) {
            res.status(400).json({ message: 'No responses to export' });
            return;
        }
        // Calculate Global Stats for the CSV summary
        const totalSubmissions = attempts.length;
        const totalScorePercent = attempts.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0);
        const averageScore = Math.round(totalScorePercent / totalSubmissions);
        // CSV Header with Summary Info
        let csvContent = `Quiz Title,${quiz.title.replace(/,/g, '')}\n`;
        csvContent += `Total Submissions,${totalSubmissions}\n`;
        csvContent += `Average Marks (%) of All Students,${averageScore}%\n\n`;
        // CSV Tabular Header
        csvContent += 'Participant Name,Email,Score (%),Marks Obtained,Total Marks,Time Taken (min),Status,Submission Date\n';
        // CSV Rows
        attempts.forEach(a => {
            const userName = a.user?.fullName || 'Unknown';
            const email = a.user?.email || 'N/A';
            const percentage = Math.round((a.score / a.totalMarks) * 100);
            const durationMs = a.endTime && a.startTime ? a.endTime.getTime() - a.startTime.getTime() : 0;
            const durationMins = Math.round(durationMs / 60000);
            const status = a.isPassed ? 'Passed' : 'Failed';
            const date = a.endTime ? new Date(a.endTime).toLocaleString() : 'N/A';
            /**
             * CSV Injection (Formula Injection) Prevention
             * If a cell value starts with =, +, -, @, \t, \r these are treated as
             * formulas by Excel/Google Sheets and can execute malicious code.
             * Solution: Prepend a tab character to neutralize formula execution
             * while keeping the data readable. (OWASP recommended approach)
             */
            const sanitize = (value) => {
                const str = String(value);
                // Neutralize formula injection triggers
                if (/^[=+\-@\t\r]/.test(str)) {
                    return '\t' + str;
                }
                return str;
            };
            // Wrap in quotes and escape internal quotes
            const q = (text) => `"${sanitize(text).replace(/"/g, '""')}"`;
            csvContent += `${q(userName)},${q(email)},${q(percentage + '%')},${q(a.score)},${q(a.totalMarks)},${q(durationMins)},${q(status)},${q(date)}\n`;
        });
        // Sanitize quiz title for use as a filename (remove invalid filename chars)
        const safeTitle = quiz.title
            .replace(/[\\/:*?"<>|]/g, '') // remove invalid filename characters
            .replace(/\s+/g, '_') // replace spaces with underscores
            .trim() || 'Quiz_Responses';
        const filename = `${safeTitle}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        res.status(500).json({ message: 'Error exporting CSV', error: error.message });
    }
};
/**
 * Expire a quiz (Manual force-end)
 */
export const expireQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        if (quiz.creator.toString() !== req.user?.id) {
            res.status(403).json({ message: 'Not authorized to expire this quiz' });
            return;
        }
        // Set end date to now to expire it immediately
        quiz.endDate = new Date();
        await quiz.save();
        res.json({ message: 'Quiz expired successfully', endDate: quiz.endDate });
    }
    catch (error) {
        res.status(500).json({ message: 'Error expiring quiz', error: error.message });
    }
};
/**
 * Restart an expired quiz with a new end date
 */
export const restartQuiz = async (req, res) => {
    try {
        const { endDate } = req.body;
        if (!endDate) {
            res.status(400).json({ message: 'New end date is required to restart quiz' });
            return;
        }
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        if (quiz.creator.toString() !== req.user?.id) {
            res.status(403).json({ message: 'Not authorized to restart this quiz' });
            return;
        }
        quiz.endDate = new Date(endDate);
        quiz.isPublished = true; // Ensure it is published 
        await quiz.save();
        res.json({ message: 'Quiz restarted successfully', endDate: quiz.endDate });
    }
    catch (error) {
        res.status(500).json({ message: 'Error restarting quiz', error: error.message });
    }
};
