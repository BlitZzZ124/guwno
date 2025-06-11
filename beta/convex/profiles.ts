import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserProfile = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    const targetUserId = args.userId || currentUserId;
    
    if (!targetUserId) return null;

    const user = await ctx.db.get(targetUserId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    return {
      ...user,
      profile: profile ? {
        ...profile,
        avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
        bannerUrl: profile.banner ? await ctx.storage.getUrl(profile.banner) : null,
      } : null,
    };
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.id("_storage")),
    banner: v.optional(v.id("_storage")),
    status: v.optional(v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("dnd"),
      v.literal("invisible")
    )),
    customStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        status: "online",
        lastSeen: Date.now(),
        ...args,
      });
    }
  },
});
