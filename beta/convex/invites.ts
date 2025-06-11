import { v } from "convex/values";
import { mutation } from "./_generated/server";
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

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_user", (q) => q.eq("serverId", server._id).eq("userId", userId))
      .first();

    if (existingMember) {
      throw new Error("You are already a member of this server");
    }

    // Add user as member
    await ctx.db.insert("serverMembers", {
      serverId: server._id,
      userId,
      joinedAt: Date.now(),
      roles: [],
    });

    return server._id;
  },
});
