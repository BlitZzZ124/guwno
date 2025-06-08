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

export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversations = await ctx.db
      .query("conversations")
      .collect();

    // Filter conversations where user is a participant
    const userConversations = conversations.filter(conv => 
      isUserParticipant(conv.participants, userId)
    );

    // Sort by type: general first, then others
    return userConversations.sort((a, b) => {
      if (a.type === "general" && b.type !== "general") return -1;
      if (a.type !== "general" && b.type === "general") return 1;
      return b._creationTime - a._creationTime;
    });
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Check if user is a participant
    if (!isUserParticipant(conversation.participants, userId)) {
      return null;
    }

    return conversation;
  },
});

export const createDirectMessage = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.otherUserId) {
      throw new Error("Cannot create DM with yourself");
    }

    // Check if DM already exists
    const existingConversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("type"), "dm"))
      .collect();

    const existingDM = existingConversations.find(conv => 
      conv.participants.length === 2 &&
      isUserParticipant(conv.participants, userId) &&
      isUserParticipant(conv.participants, args.otherUserId)
    );

    if (existingDM) {
      return existingDM._id;
    }

    // Get user profiles
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    const otherUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.otherUserId))
      .unique();

    if (!currentUserProfile || !otherUserProfile) {
      throw new Error("User profiles not found");
    }

    // Create new DM
    const conversationId = await ctx.db.insert("conversations", {
      type: "dm",
      participants: [
        {
          _id: userId,
          profile: {
            username: currentUserProfile.username,
            displayName: currentUserProfile.displayName,
            avatarUrl: currentUserProfile.avatarUrl,
            status: currentUserProfile.status,
            verified: currentUserProfile.verified,
            badges: currentUserProfile.badges,
          },
        },
        {
          _id: args.otherUserId,
          profile: {
            username: otherUserProfile.username,
            displayName: otherUserProfile.displayName,
            avatarUrl: otherUserProfile.avatarUrl,
            status: otherUserProfile.status,
            verified: otherUserProfile.verified,
            badges: otherUserProfile.badges,
          },
        },
      ],
      createdBy: userId,
    });

    return conversationId;
  },
});

export const createGroupChat = mutation({
  args: {
    name: v.string(),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all user profiles including current user
    const allUserIds = [userId, ...args.userIds];
    const participants = [];

    for (const id of allUserIds) {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", id))
        .unique();

      if (profile) {
        participants.push({
          _id: id,
          profile: {
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            status: profile.status,
            verified: profile.verified,
            badges: profile.badges,
          },
        });
      }
    }

    const conversationId = await ctx.db.insert("conversations", {
      type: "group",
      name: args.name,
      participants,
      createdBy: userId,
    });

    return conversationId;
  },
});

export const addUsersToConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Check if user is a participant
    if (!isUserParticipant(conversation.participants, userId)) {
      throw new Error("Not authorized");
    }

    // Get profiles for new users
    const newParticipants = [];
    for (const newUserId of args.userIds) {
      // Skip if user is already in conversation
      if (isUserParticipant(conversation.participants, newUserId)) {
        continue;
      }

      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", newUserId))
        .unique();

      if (profile) {
        newParticipants.push({
          _id: newUserId,
          profile: {
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            status: profile.status,
            verified: profile.verified,
            badges: profile.badges,
          },
        });
      }
    }

    if (newParticipants.length > 0) {
      await ctx.db.patch(args.conversationId, {
        participants: [...conversation.participants as any[], ...newParticipants],
      });
    }

    return newParticipants.length;
  },
});

export const getGeneralChatMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== "general") {
      return [];
    }

    // Check if user is a participant
    if (!isUserParticipant(conversation.participants, userId)) {
      return [];
    }

    // Get updated user profiles with current status
    const members = [];
    for (const participant of conversation.participants) {
      const participantId = getParticipantId(participant);
      const user = await ctx.db.get(participantId);
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", participantId))
        .unique();

      if (user && profile) {
        members.push({ ...user, profile });
      }
    }

    return members;
  },
});

export const createOrJoinGeneralChat = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    // Find existing general chat
    const generalChat = await ctx.db
      .query("conversations")
      .withIndex("by_type", (q) => q.eq("type", "general"))
      .unique();

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) return;

    const userParticipant = {
      _id: userId,
      profile: {
        username: userProfile.username,
        displayName: userProfile.displayName,
        avatarUrl: userProfile.avatarUrl,
        status: userProfile.status,
        verified: userProfile.verified,
        badges: userProfile.badges,
      },
    };

    if (generalChat) {
      // Check if user is already a participant
      const isParticipant = isUserParticipant(generalChat.participants, userId);
      
      if (!isParticipant) {
        // Add user to existing general chat
        await ctx.db.patch(generalChat._id, {
          participants: [...generalChat.participants as any[], userParticipant],
        });
      }
    } else {
      // Create new general chat
      await ctx.db.insert("conversations", {
        type: "general",
        participants: [userParticipant],
        createdBy: userId,
      });
    }
  },
});
