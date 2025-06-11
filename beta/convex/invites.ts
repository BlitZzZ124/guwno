import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const joinServerByInvite = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const server = await ctx.db
      .query("servers")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!server) {
      throw new Error("Invalid invite code");
    }

    // Check if already a member
    const existingMember = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_user", (q) => q.eq("serverId", server._id).eq("userId", userId))
      .first();

    if (existingMember) {
      throw new Error("Already a member of this server");
    }

    // Add as member
    await ctx.db.insert("serverMembers", {
      serverId: server._id,
      userId,
      joinedAt: Date.now(),
      roles: [],
    });

    return server._id;
  },
});

export const getServerByInvite = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const server = await ctx.db
      .query("servers")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!server) return null;

    const memberCount = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", server._id))
      .collect()
      .then(members => members.length);

    return {
      ...server,
      iconUrl: server.icon ? await ctx.storage.getUrl(server.icon) : null,
      memberCount,
    };
  },
});

export const regenerateInviteCode = mutation({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const server = await ctx.db.get(args.serverId);
    if (!server || server.ownerId !== userId) {
      throw new Error("Access denied");
    }

    const newInviteCode = Math.random().toString(36).substring(2, 8);
    await ctx.db.patch(args.serverId, { inviteCode: newInviteCode });

    return newInviteCode;
  },
});
