import express from 'express';
import { createQuiz, getQuiz, publishQuiz, getMyQuizzes, getUserStats, deleteQuiz, deleteQuizzesBatch, getAttemptStatus, updateQuiz, submitQuiz, getQuizAnalytics, getAttemptDetails, exportQuizResponses, expireQuiz, restartQuiz } from '../controller/quizController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();
// @access  Private (Requires JWT)
router.get('/my/all', authMiddleware, getMyQuizzes);
// @access  Private (Requires JWT)
router.get('/stats/user', authMiddleware, getUserStats);
// @route   POST /api/quiz/
// @desc    Create a new quiz draft
// @access  Private (Requires JWT)
router.post('/', authMiddleware, createQuiz);
// @route   POST /api/quiz/delete-batch
// @desc    Bulk delete quizzes
// @access  Private (Requires JWT)
router.post('/delete-batch', authMiddleware, deleteQuizzesBatch);
// @route   GET /api/quiz/attempt/:attemptId
// @desc    Get detailed information for a specific attempt
// @access  Private (Requires JWT)
router.get('/attempt/:attemptId', authMiddleware, getAttemptDetails);
// @route   GET /api/quiz/:id/analytics
// @desc    Get detailed analytics for a quiz (Creator only)
// @access  Private (Requires JWT)
router.get('/:id/analytics', authMiddleware, getQuizAnalytics);
// @route   GET /api/quiz/:id/export
// @desc    Export quiz responses as CSV (Creator only)
// @access  Private (Requires JWT)
router.get('/:id/export', authMiddleware, exportQuizResponses);
// @route   GET /api/quiz/:id/attempt-status
// @desc    Check if user can attempt the quiz again
// @access  Private (Requires JWT)
router.get('/:id/attempt-status', authMiddleware, getAttemptStatus);
// @route   POST /api/quiz/:id/publish
// @desc    Publish a drafted quiz, making it available to students and generating a link
// @access  Private (Requires JWT, must be the creator of the quiz)
router.post('/:id/publish', authMiddleware, publishQuiz);
// @route   POST /api/quiz/:id/submit
// @desc    Submit quiz answers and calculate score
// @access  Private (Requires JWT)
router.post('/:id/submit', authMiddleware, submitQuiz);
// @route   GET /api/quiz/:id/submit (DEFENSIVE)
// @desc    Prevent "Cannot GET" errors by handling invalid direct access
router.get('/:id/submit', authMiddleware, (_req, res) => {
    res.status(405).json({
        message: 'Direct access to the submission endpoint via GET is not allowed. Please use the quiz interface.',
        error: 'Method Not Allowed (405)'
    });
});
// @route   PATCH /api/quiz/:id/expire
// @desc    Manually expire a quiz link
// @access  Private (Requires JWT, must creator)
router.patch('/:id/expire', authMiddleware, expireQuiz);
// @route   PATCH /api/quiz/:id/restart
// @desc    Re-activate an expired quiz link with a new duration
// @access  Private (Requires JWT, must creator)
router.patch('/:id/restart', authMiddleware, restartQuiz);
// @route   GET /api/quiz/:id
// @desc    Fetch a specific quiz by its ID
// @access  Private (Requires JWT)
router.get('/:id', authMiddleware, getQuiz);
// @route   DELETE /api/quiz/:id
// @desc    Delete a quiz
// @access  Private (Requires JWT, must be the creator)
router.delete('/:id', authMiddleware, deleteQuiz);
// @route   PATCH /api/quiz/:id
// @desc    Update a quiz
// @access  Private (Requires JWT, must be the creator)
router.patch('/:id', authMiddleware, updateQuiz);
export default router;
