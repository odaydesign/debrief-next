import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("notes").order("desc").collect();
    },
});

export const getByArticle = query({
    args: { articleId: v.id("articles") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notes")
            .withIndex("by_article", (q) => q.eq("articleId", args.articleId))
            .order("desc")
            .collect();
    },
});

export const add = mutation({
    args: { articleId: v.id("articles"), text: v.string() },
    handler: async (ctx, args) => {
        const newNoteId = await ctx.db.insert("notes", {
            articleId: args.articleId,
            text: args.text,
            createdAt: new Date().toISOString(),
        });
        return newNoteId;
    },
});
