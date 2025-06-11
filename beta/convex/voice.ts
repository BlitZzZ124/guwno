import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getVoiceChannelUsers = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const voiceStates = await ctx.db
      .query("voiceStates")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    const users = await Promise.all(
      voiceStates.map(async (voiceState) => {
        const user = await ctx.db.get(voiceState.userId);
        if (!user) return null;

        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", voiceState.userId))
          .first();

        return {
          ...user,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
          voiceState,
        };
      })
    );

    return users.filter(Boolean);
  },
});
