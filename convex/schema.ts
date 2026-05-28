import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    articles: defineTable({
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
        date: v.string(), // We store ISO string date
        externalId: v.optional(v.string()), // For Twitter ID, YouTube Video ID, etc.
        fileUrl: v.optional(v.string()), // For PDF or File link
        sourceLink: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        imageFocalX: v.optional(v.float64()),
        imageFocalY: v.optional(v.float64()),
    }),

    userInteractions: defineTable({
        userId: v.string(), // We will mock standard user IDs for now
        articleId: v.id("articles"),
        isRead: v.optional(v.boolean()),
        isBookmarked: v.optional(v.boolean()),
        collectionId: v.optional(v.string()),
        readAt: v.optional(v.string()),
        bookmarkedAt: v.optional(v.string()),
    }).index("by_user", ["userId"]).index("by_user_article", ["userId", "articleId"]),

    notes: defineTable({
        articleId: v.id("articles"),
        text: v.string(),
        createdAt: v.string(),
        highlightText: v.optional(v.string()),
        color: v.optional(v.string()),
    }).index("by_article", ["articleId"]),

    searchBundles: defineTable({
        userId: v.string(),
        name: v.string(),
        tags: v.array(v.string()), // ['tech', 'design', etc.]
        excludedArticles: v.optional(v.array(v.string())), // Array of article IDs manually removed by the user
    }).index("by_user", ["userId"]),
});
