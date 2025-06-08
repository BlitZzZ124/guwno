import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update user statuses every minute
crons.interval("update user statuses", { minutes: 1 }, internal.users.updateAllUserStatuses, {});

// Clean up old typing statuses every 30 seconds
crons.interval("cleanup typing statuses", { seconds: 30 }, internal.users.cleanupTypingStatuses, {});

// Clean up old voice calls daily
crons.interval("cleanup old voice calls", { hours: 24 }, internal.voiceCalls.cleanupOldCalls, {});

export default crons;
