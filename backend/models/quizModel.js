import mongoose, { Schema } from "mongoose";
// Schema definition for the questions embedded inside the Quiz document
const questionSchema = new Schema({
    text: { type: String, required: true },
    image: String,
    options: {
        type: [String],
        required: function() {
            return ['mcq', 'multi-mcq', 'tf'].includes(this.type);
        },
        validate: [
            function(val) {
                if (!['mcq', 'multi-mcq', 'tf'].includes(this.type)) return true;
                return val && val.length >= 2;
            }, 
            "Minimum 2 options required"
        ],
    },
    isMultiCorrect: {
        type: Boolean,
        default: false,
    },
    correctAnswers: {
        type: [Number],
        required: function() {
            return ['mcq', 'multi-mcq', 'tf'].includes(this.type);
        },
    },
    marks: {
        type: Number,
        required: true,
        min: 1, // Every question must be worth at least 1 point
    },
    type: {
        type: String,
        enum: ['mcq', 'multi-mcq', 'tf', 'short', 'paragraph', 'code'],
        default: 'mcq',
    },
    explanation: String,
    timer: Number,
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
});
// Schema definition for the Quiz
const quizSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    category: { type: String, index: true }, // Indexed for faster tag/category searches
    timeLimit: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    maxAttempts: { type: Number, default: 0 }, // 0 means unlimited
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User", // Links to the User who authored the quiz
        required: true,
    },
    // The questions are stored as an array of embedded sub-documents
    questions: [questionSchema],
    isPublished: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    isActive: {
        type: Boolean,
        default: true, // Represents logical deletion or archiving if false
    },
    startDate: Date,
    endDate: Date,
    publishedAt: Date,
    // Settings configuration objects embedded in the quiz document
    negativeMarking: {
        enabled: { type: Boolean, default: false },
        penalty: { type: Number, default: 0.25 },
    },
    randomization: {
        shuffleQuestions: { type: Boolean, default: false },
        shuffleOptions: { type: Boolean, default: false },
        preventBackNavigation: { type: Boolean, default: false },
    },
    antiCheat: {
        disableCopyPaste: { type: Boolean, default: false },
        disableTabSwitching: { type: Boolean, default: false },
        webcamMonitoring: { type: Boolean, default: false },
        fullscreenMode: { type: Boolean, default: false },
    },
    tags: [String],
}, { timestamps: true });
export default mongoose.model("Quiz", quizSchema);
