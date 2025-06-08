import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper function to get participant ID from either legacy or new format
function getParticipantId(participant: any): Id<"users"> {
  return typeof participant === "string" ? participant : participant._id;
}

// Helper function to check if user is participant
function isUserParticipant(participants: any[], userId: Id<"users">): boolean {
  return participants.some(p => getParticipantId(p) === userId);
}

export const getActiveCall = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const call = await ctx.db
      .query("voiceCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("active"), true))
      .unique();

    if (!call) return null;

    // Get participant details
    const participants = await Promise.all(
      call.participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", participant.userId))
          .unique();
        
        return {
          ...participant,
          user: user ? { ...user, profile } : null,
        };
      })
    );

    return { ...call, participants };
  },
});

export const joinCall = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is in the conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !isUserParticipant(conversation.participants, userId)) {
      throw new Error("Not authorized to join this call");
    }

    // Find or create active call
    let call = await ctx.db
      .query("voiceCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("active"), true))
      .unique();

    if (!call) {
      // Create new call
      const callId = await ctx.db.insert("voiceCalls", {
        conversationId: args.conversationId,
        participants: [{
          userId,
          joinedAt: Date.now(),
          muted: false,
          deafened: false,
        }],
        active: true,
        startedAt: Date.now(),
      });
      return callId;
    }

    // Check if user is already in call
    const existingParticipant = call.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      return call._id;
    }

    // Add user to existing call
    await ctx.db.patch(call._id, {
      participants: [
        ...call.participants,
        {
          userId,
          joinedAt: Date.now(),
          muted: false,
          deafened: false,
        }
      ],
    });

    return call._id;
  },
});

export const leaveCall = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const call = await ctx.db
      .query("voiceCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("active"), true))
      .unique();

    if (!call) return;

    const updatedParticipants = call.participants.filter(p => p.userId !== userId);

    if (updatedParticipants.length === 0) {
      // End call if no participants left
      await ctx.db.patch(call._id, {
        active: false,
        endedAt: Date.now(),
      });
    } else {
      // Remove user from call
      await ctx.db.patch(call._id, {
        participants: updatedParticipants,
      });
    }
  },
});

export const updateCallSettings = mutation({
  args: {
    conversationId: v.id("conversations"),
    muted: v.boolean(),
    deafened: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const call = await ctx.db
      .query("voiceCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("active"), true))
      .unique();

    if (!call) throw new Error("No active call found");

    const updatedParticipants = call.participants.map(participant => {
      if (participant.userId === userId) {
        return {
          ...participant,
          muted: args.muted,
          deafened: args.deafened,
        };
      }
      return participant;
    });

    await ctx.db.patch(call._id, {
      participants: updatedParticipants,
    });
  },
});

// Clean up old inactive calls
export const cleanupOldCalls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const oldCalls = await ctx.db
      .query("voiceCalls")
      .filter((q) => 
        q.and(
          q.eq(q.field("active"), false),
          q.lt(q.field("endedAt"), oneDayAgo)
        )
      )
      .collect();

    for (const call of oldCalls) {
      await ctx.db.delete(call._id);
    }
  },
});
