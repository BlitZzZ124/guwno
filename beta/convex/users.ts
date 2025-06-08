import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper function to get participant ID from either legacy or new format
function getParticipantId(participant: any): Id<"users"> {
  return typeof participant === "string" ? participant : participant._id;
}

// Helper function to check if user is participant
function isUserParticipant(participants: any[], userId: Id<"users">): boolean {
  return participants.some(p => getParticipantId(p) === userId);
}

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId === "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs";
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return { ...user, profile };
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    return { ...user, profile };
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profiles = await ctx.db
      .query("userProfiles")
      .filter((q) => 
        q.or(
          q.gte(q.field("username"), args.query),
          q.gte(q.field("displayName"), args.query)
        )
      )
      .take(20);

    // Filter profiles that actually contain the query string
    const filteredProfiles = profiles.filter(profile => 
      profile.username.toLowerCase().includes(args.query.toLowerCase()) ||
      profile.displayName.toLowerCase().includes(args.query.toLowerCase())
    );

    const users = await Promise.all(
      filteredProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return user ? { ...user, profile } : null;
      })
    );

    return users.filter(Boolean).slice(0, 10);
  },
});

export const searchUsersInConversation = query({
  args: { 
    query: v.string(),
    conversationId: v.id("conversations")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !isUserParticipant(conversation.participants, userId)) {
      return [];
    }

    // Get profiles of conversation participants
    const participantProfiles = await Promise.all(
      conversation.participants.map(async (participant) => {
        const participantId = getParticipantId(participant);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", participantId))
          .unique();
        return profile;
      })
    );

    // Filter profiles that match the query
    const filteredProfiles = participantProfiles.filter(profile => 
      profile && (
        profile.username.toLowerCase().includes(args.query.toLowerCase()) ||
        profile.displayName.toLowerCase().includes(args.query.toLowerCase())
      )
    );

    const users = await Promise.all(
      filteredProfiles.map(async (profile) => {
        if (!profile) return null;
        const user = await ctx.db.get(profile.userId);
        return user ? { ...user, profile } : null;
      })
    );

    return users.filter(Boolean).slice(0, 10);
  },
});

export const createProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if username is already taken
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingProfile) {
      throw new Error("Username already taken");
    }

    // Check if user already has a profile
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile) {
      throw new Error("Profile already exists");
    }

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      username: args.username,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      status: "online",
      lastSeen: Date.now(),
      verified: false,
      doNotDisturb: false,
    });

    // Create or join general chat
    await ctx.runMutation(internal.conversations.createOrJoinGeneralChat);

    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    aboutMe: v.optional(v.string()),
    status: v.optional(v.union(v.literal("online"), v.literal("away"), v.literal("dnd"), v.literal("offline"))),
    doNotDisturb: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const updates: any = { lastSeen: Date.now() };
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.bannerUrl !== undefined) updates.bannerUrl = args.bannerUrl;
    if (args.aboutMe !== undefined) updates.aboutMe = args.aboutMe;
    if (args.status !== undefined) updates.status = args.status;
    if (args.doNotDisturb !== undefined) updates.doNotDisturb = args.doNotDisturb;

    await ctx.db.patch(profile._id, updates);
  },
});

export const updateLastSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      const now = Date.now();
      
      // Determine status based on activity and DND setting
      let status: "online" | "away" | "dnd" | "offline" = "online";
      if (profile.doNotDisturb) {
        status = "dnd";
      }

      await ctx.db.patch(profile._id, {
        lastSeen: now,
        status: status,
      });
    }
  },
});

// Update all user statuses based on last seen
export const updateAllUserStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("userProfiles").collect();
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const tenMinutesAgo = now - 10 * 60 * 1000;

    for (const profile of profiles) {
      let newStatus: "online" | "away" | "dnd" | "offline" = "offline";
      
      if (profile.doNotDisturb) {
        newStatus = "dnd";
      } else if (profile.lastSeen > fiveMinutesAgo) {
        newStatus = "online";
      } else if (profile.lastSeen > tenMinutesAgo) {
        newStatus = "away";
      } else {
        newStatus = "offline";
      }

      if (profile.status !== newStatus) {
        await ctx.db.patch(profile._id, { status: newStatus });
      }
    }
  },
});

// Typing status functions
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", userId).eq("conversationId", args.conversationId)
      )
      .unique();

    if (args.isTyping) {
      if (existing) {
        await ctx.db.patch(existing._id, { lastTyping: Date.now() });
      } else {
        await ctx.db.insert("typingStatus", {
          conversationId: args.conversationId,
          userId,
          lastTyping: Date.now(),
        });
      }
    } else if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getTypingUsers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const fiveSecondsAgo = now - 5000;

    const typingStatuses = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("lastTyping"), fiveSecondsAgo))
      .collect();

    // Filter out current user and get user profiles
    const typingUsers = await Promise.all(
      typingStatuses
        .filter(status => status.userId !== userId)
        .map(async (status) => {
          const user = await ctx.db.get(status.userId);
          const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", status.userId))
            .unique();
          return user && profile ? { ...user, profile } : null;
        })
    );

    return typingUsers.filter(Boolean);
  },
});

// Clean up old typing statuses
export const cleanupTypingStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tenSecondsAgo = now - 10000;

    const oldStatuses = await ctx.db
      .query("typingStatus")
      .filter((q) => q.lt(q.field("lastTyping"), tenSecondsAgo))
      .collect();

    for (const status of oldStatuses) {
      await ctx.db.delete(status._id);
    }
  },
});

// Custom emoji functions
export const getCustomEmojis = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customEmojis").collect();
  },
});

export const addCustomEmoji = mutation({
  args: {
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    // Check if emoji name already exists
    const existing = await ctx.db
      .query("customEmojis")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("Emoji name already exists");
    }

    return await ctx.db.insert("customEmojis", {
      name: args.name,
      imageUrl: args.imageUrl,
      createdBy: userId,
    });
  },
});

export const removeCustomEmoji = mutation({
  args: { emojiId: v.id("customEmojis") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.emojiId);
  },
});

// Admin functions
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    const profiles = await ctx.db.query("userProfiles").collect();
    const users = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return user ? { ...user, profile } : null;
      })
    );

    return users.filter(Boolean);
  },
});

export const banUser = mutation({
  args: { userId: v.id("users"), banned: v.boolean() },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (adminId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("User not found");

    await ctx.db.patch(profile._id, { banned: args.banned });
  },
});

export const addBadgeToUser = mutation({
  args: {
    userId: v.id("users"),
    badge: v.object({
      name: v.string(),
      imageUrl: v.string(),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (adminId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("User not found");

    const currentBadges = profile.badges || [];
    await ctx.db.patch(profile._id, {
      badges: [...currentBadges, args.badge],
    });
  },
});

export const removeBadgeFromUser = mutation({
  args: {
    userId: v.id("users"),
    badgeName: v.string(),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (adminId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("User not found");

    const currentBadges = profile.badges || [];
    const updatedBadges = currentBadges.filter(badge => badge.name !== args.badgeName);
    
    await ctx.db.patch(profile._id, {
      badges: updatedBadges,
    });
  },
});

export const verifyUser = mutation({
  args: { userId: v.id("users"), verified: v.boolean() },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (adminId !== "kh70qqbn5bs1tk2h7c7nm6ts5h7hdhhs") {
      throw new Error("Not authorized");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("User not found");

    await ctx.db.patch(profile._id, { verified: args.verified });
  },
});
