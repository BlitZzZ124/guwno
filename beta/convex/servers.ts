import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createServer = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inviteCode = Math.random().toString(36).substring(2, 8);
    
    const serverId = await ctx.db.insert("servers", {
      name: args.name,
      icon: args.icon,
      ownerId: userId,
      inviteCode,
    });

    // Add owner as member
    await ctx.db.insert("serverMembers", {
      serverId,
      userId,
      joinedAt: Date.now(),
      roles: [],
    });

    // Create default channels
    await ctx.db.insert("channels", {
      name: "general",
      type: "text",
      serverId,
      position: 0,
    });

    await ctx.db.insert("channels", {
      name: "General",
      type: "voice",
      serverId,
      position: 1,
    });

    return serverId;
  },
});

export const getUserServers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const servers = await Promise.all(
      memberships.map(async (membership) => {
        const server = await ctx.db.get(membership.serverId);
        return server ? {
          ...server,
          iconUrl: server.icon ? await ctx.storage.getUrl(server.icon) : null,
        } : null;
      })
    );

    return servers.filter(Boolean);
  },
});

export const getServerChannels = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if user is member
    const membership = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!membership) return [];

    return await ctx.db
      .query("channels")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();
  },
});

export const getServerDetails = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const server = await ctx.db.get(args.serverId);
    if (!server) return null;

    // Check if user is member or owner
    const membership = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!membership && server.ownerId !== userId) return null;

    return {
      ...server,
      iconUrl: server.icon ? await ctx.storage.getUrl(server.icon) : null,
    };
  },
});

export const updateServer = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const server = await ctx.db.get(args.serverId);
    if (!server || server.ownerId !== userId) {
      throw new Error("Access denied");
    }

    const { serverId, ...updates } = args;
    await ctx.db.patch(serverId, updates);
  },
});

export const deleteServer = mutation({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const server = await ctx.db.get(args.serverId);
    if (!server || server.ownerId !== userId) {
      throw new Error("Access denied");
    }

    // Delete all related data
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();

    for (const channel of channels) {
      await ctx.db.delete(channel._id);
    }

    const members = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    await ctx.db.delete(args.serverId);
  },
});
