import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Queries ---

export const getDaily = query({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        // For demo/simplicity, we return all articles sorted by date.
        // In production, we'd filter strictly by the given date.
        const articles = await ctx.db
            .query("articles")
            .order("desc")
            .collect();
        return articles;
    },
});

export const getAllTags = query({
    args: {},
    handler: async (ctx) => {
        const articles = await ctx.db.query("articles").collect();
        const tags = [...new Set(articles.map((a) => a.tag).filter(Boolean))];
        return tags.sort();
    },
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("articles")
            .order("desc")
            .collect();
    },
});

export const getBookmarked = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const interactions = await ctx.db
            .query("userInteractions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("isBookmarked"), true))
            .collect();

        const articleIds = interactions.map((i) => i.articleId);

        // Fetch corresponding articles
        const articles = await Promise.all(
            articleIds.map((id) => ctx.db.get(id))
        );

        // Filter out potential nulls (deleted articles)
        return articles.filter((a) => a !== null);
    },
});

export const getUserInteractions = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("userInteractions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    }
});


// --- Mutations ---

export const create = mutation({
    args: {
        title: v.string(),
        summary: v.optional(v.string()),
        type: v.optional(v.string()),
        tag: v.optional(v.string()),
        tagStyle: v.optional(v.string()),
        description: v.optional(v.string()),
        buttonText: v.optional(v.string()),
        bgColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
        image: v.optional(v.string()),
        imageType: v.optional(v.string()),
        visual: v.optional(v.string()),
        icon: v.optional(v.string()),
        time: v.optional(v.string()),
        location: v.optional(v.string()),
        content: v.optional(v.string()),
        date: v.string(),
        externalId: v.optional(v.string()),
        fileUrl: v.optional(v.string()),
        sourceLink: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        imageFocalX: v.optional(v.float64()),
        imageFocalY: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const newArticleId = await ctx.db.insert("articles", args);
        return newArticleId;
    },
});

export const toggleBookmark = mutation({
    args: {
        userId: v.string(),
        articleId: v.id("articles"),
        isBookmarked: v.boolean(),
        collectionId: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if interaction exists
        const existing = await ctx.db
            .query("userInteractions")
            .withIndex("by_user_article", (q) =>
                q.eq("userId", args.userId).eq("articleId", args.articleId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                isBookmarked: args.isBookmarked,
                collectionId: args.collectionId,
                bookmarkedAt: args.isBookmarked ? new Date().toISOString() : undefined,
            });
        } else {
            await ctx.db.insert("userInteractions", {
                userId: args.userId,
                articleId: args.articleId,
                isBookmarked: args.isBookmarked,
                collectionId: args.collectionId,
                bookmarkedAt: args.isBookmarked ? new Date().toISOString() : undefined,
            });
        }
    },
});

export const markRead = mutation({
    args: { userId: v.string(), articleId: v.id("articles") },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("userInteractions")
            .withIndex("by_user_article", (q) =>
                q.eq("userId", args.userId).eq("articleId", args.articleId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                isRead: true,
                readAt: new Date().toISOString(),
            });
        } else {
            await ctx.db.insert("userInteractions", {
                userId: args.userId,
                articleId: args.articleId,
                isRead: true,
                readAt: new Date().toISOString(),
            });
        }
    },
});

export const update = mutation({
    args: {
        id: v.id("articles"),
        title: v.string(),
        summary: v.optional(v.string()),
        type: v.optional(v.string()),
        tag: v.optional(v.string()),
        tagStyle: v.optional(v.string()),
        description: v.optional(v.string()),
        buttonText: v.optional(v.string()),
        bgColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
        image: v.optional(v.string()),
        imageType: v.optional(v.string()),
        visual: v.optional(v.string()),
        icon: v.optional(v.string()),
        time: v.optional(v.string()),
        location: v.optional(v.string()),
        content: v.optional(v.string()),
        date: v.string(),
        externalId: v.optional(v.string()), // For Twitter ID, YouTube Video ID, etc.
        fileUrl: v.optional(v.string()), // For PDF or File link
        sourceLink: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        imageFocalX: v.optional(v.float64()),
        imageFocalY: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("articles") },
    handler: async (ctx, args) => {
        // Also clean up associated interactions and notes
        const interactions = await ctx.db
            .query("userInteractions")
            .filter((q) => q.eq(q.field("articleId"), args.id))
            .collect();

        for (const interaction of interactions) {
            await ctx.db.delete(interaction._id);
        }

        const notes = await ctx.db
            .query("notes")
            .withIndex("by_article", (q) => q.eq("articleId", args.id))
            .collect();

        for (const note of notes) {
            await ctx.db.delete(note._id);
        }

        await ctx.db.delete(args.id);
    },
});
