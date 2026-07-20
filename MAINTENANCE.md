# Quiz App Maintenance Guide

This document provides instructions for performing common maintenance tasks following the project's security cleanup. These actions can be performed directly via the terminal using `npx tsx`.

## 1. Clearing Rate Limits (Unblocking IPs)

If you need to manually unblock all IPs or clear the rate limit collection in MongoDB, run the following command in your terminal:

```bash
npx tsx -e "import mongoose from 'mongoose'; import dotenv from 'dotenv'; dotenv.config(); async function clear() { await mongoose.connect(process.env.MONGODB_URI); await mongoose.connection.db.collection('rateLimits').deleteMany({}); console.log('✅ Rate limits cleared'); process.exit(0); } clear();"
```

## 2. Database Integration Checks

To verify quiz and attempt statistics (previously `diagnose_analytics.ts`), you can create a temporary script or use a database management tool (like MongoDB Compass).

Alternatively, use this one-liner to get basic counts:

```bash
npx tsx -e "import mongoose from 'mongoose'; import dotenv from 'dotenv'; dotenv.config(); async function log() { await mongoose.connect(process.env.MONGODB_URI); const qc = await mongoose.connection.db.collection('quizzes').countDocuments(); const ac = await mongoose.connection.db.collection('attempts').countDocuments(); console.log('Quizzes:', qc, 'Attempts:', ac); process.exit(0); } log();"
```

## 3. Fixing Duplicate Attempt Indexes

If you encounter issues where users cannot retake a quiz when they should be allowed to, you may need to drop the unique index:

```bash
npx tsx -e "import mongoose from 'mongoose'; import dotenv from 'dotenv'; dotenv.config(); async function fix() { await mongoose.connect(process.env.MONGODB_URI); await mongoose.connection.db.collection('attempts').dropIndex('quiz_1_user_1'); console.log('✅ Index dropped'); process.exit(0); } fix();"
```

---

> [!NOTE]
> All maintenance scripts have been removed from the root directory to improve project security and reduce the risk of accidental exposure or malicious hijacking.
