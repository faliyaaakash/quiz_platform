import mongoose, { Schema } from "mongoose";
const answerSchema = new Schema({
    questionId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    selectedOptions: {
        type: [Number],
        default: [],
    },
});
const attemptSchema = new Schema({
    quiz: {
        type: Schema.Types.ObjectId,
        ref: "Quiz", // Links to the Quiz model
        required: true,
        index: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User", // Links to the User model taking the quiz
        required: true,
        index: true,
    },
    answers: [answerSchema], // Array of answers submitted during this attempt
    score: {
        type: Number,
        default: 0,
    },
    totalMarks: {
        type: Number,
        default: 0,
    },
    isPassed: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["IN_PROGRESS", "COMPLETED", "AUTO_SUBMITTED"], // Tracks quiz taking lifecycle
        default: "IN_PROGRESS",
    },
    startTime: {
        type: Date,
        default: Date.now, // Automatically set when the user starts the quiz
    },
    endTime: Date, // Set when the user clicks submit or time runs out
    proctoringViolations: {
        type: Number,
        default: 0, // Used to track tab-switches or anti-cheat warnings
    },
}, { timestamps: true });
/**
 */
// attemptSchema.index({ quiz: 1, user: 1 }, { unique: true });
export default mongoose.model("Attempt", attemptSchema);
