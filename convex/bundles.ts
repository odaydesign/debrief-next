import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all bundles for a user
export const getBundles = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("searchBundles")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

// Create a new bundle
export const createBundle = mutation({
    args: {
        userId: v.string(),
        name: v.string(),
        tags: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const newBundleId = await ctx.db.insert("searchBundles", {
            userId: args.userId,
            name: args.name,
            tags: args.tags,
        });
        return newBundleId;
    },
});

// Delete a bundle
export const deleteBundle = mutation({
    args: { id: v.id("searchBundles") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Update a bundle name and tags
export const updateBundle = mutation({
    args: {
        id: v.id("searchBundles"),
        name: v.string(),
        tags: v.array(v.string())
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            name: args.name,
            tags: args.tags
        });
    }
});

// Exclude an article from a specific bundle
export const removeArticleFromBundle = mutation({
    args: {
        bundleId: v.id("searchBundles"),
        articleId: v.string()
    },
    handler: async (ctx, args) => {
        const bundle = await ctx.db.get(args.bundleId);
        if (!bundle) throw new Error("Bundle inte hittad");

        const excluded = bundle.excludedArticles || [];
        if (!excluded.includes(args.articleId)) {
            await ctx.db.patch(args.bundleId, {
                excludedArticles: [...excluded, args.articleId]
            });
        }
    }
});
