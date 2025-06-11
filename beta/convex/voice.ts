import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const joinVoiceChannel = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Leave current voice channel if any
    const currentState = await ctx.db
      .query("voiceStates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (currentState) {
      await ctx.db.delete(currentState._id);
    }

    // Get channel info
    const channel = await ctx.db.get(args.channelId);
    if (!channel || channel.type !== "voice") {
      throw new Error("Invalid voice channel");
    }

    // Join new channel
    await ctx.db.insert("voiceStates", {
      userId,
      channelId: args.channelId,
      serverId: channel.serverId,
      muted: false,
      deafened: false,
      joinedAt: Date.now(),
    });
  },
});

export const leaveVoiceChannel = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentState = await ctx.db
      .query("voiceStates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (currentState) {
      await ctx.db.delete(currentState._id);
    }
  },
});

export const getVoiceChannelUsers = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const voiceStates = await ctx.db
      .query("voiceStates")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    const users = await Promise.all(
      voiceStates.map(async (state) => {
        const user = await ctx.db.get(state.userId);
        if (!user) return null;

        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", state.userId))
          .first();

        return {
          ...user,
          voiceState: state,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
        };
      })
    );

    return users.filter(Boolean);
  },
});

export const updateVoiceState = mutation({
  args: {
    muted: v.optional(v.boolean()),
    deafened: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentState = await ctx.db
      .query("voiceStates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (currentState) {
      await ctx.db.patch(currentState._id, {
        ...(args.muted !== undefined && { muted: args.muted }),
        ...(args.deafened !== undefined && { deafened: args.deafened }),
      });
    }
  },
});
