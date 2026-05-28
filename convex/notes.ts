import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Resolve the acting user: prefer the verified Firebase identity (subject == uid)
// when the auth token pipeline is live; otherwise fall back to the client-passed
// userId (also the Firebase uid). Both resolve to the same value, so data stays
// consistent across the auth rollout.
async function resolveUserId(
    ctx: QueryCtx | MutationCtx,
    passedUserId: string | undefined
): Promise<string | null> {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.subject ?? passedUserId ?? null;
}

export const getAll = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await resolveUserId(ctx, args.userId);
        if (!userId) return [];
        return await ctx.db
            .query("notes")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

export const getByArticle = query({
    args: { articleId: v.id("articles"), userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await resolveUserId(ctx, args.userId);
        if (userId) {
            return await ctx.db
                .query("notes")
                .withIndex("by_user_article", (q) =>
                    q.eq("userId", userId).eq("articleId", args.articleId)
                )
                .order("desc")
                .collect();
        }
        // No identity yet — return nothing rather than leaking other users' notes.
        return [];
    },
});

export const add = mutation({
    args: {
        articleId: v.id("articles"),
        text: v.string(),
        highlightText: v.optional(v.string()),
        color: v.optional(v.string()),
        userId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await resolveUserId(ctx, args.userId);
        const newNoteId = await ctx.db.insert("notes", {
            articleId: args.articleId,
            userId: userId ?? undefined,
            text: args.text,
            createdAt: new Date().toISOString(),
            highlightText: args.highlightText,
            color: args.color,
        });
        return newNoteId;
    },
});

export const remove = mutation({
    args: { id: v.id("notes"), userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const note = await ctx.db.get(args.id);
        if (!note) return;
        const userId = await resolveUserId(ctx, args.userId);
        // Owner check: if the note is owned and we know who's asking, they must match.
        if (note.userId && userId && note.userId !== userId) {
            throw new Error("Not authorized to delete this note");
        }
        await ctx.db.delete(args.id);
    },
});
