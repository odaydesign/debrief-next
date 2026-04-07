"use client";

import { useState, useEffect } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMain, formatArticles } from "@/lib/MainContext";
import FeedView from "@/views/FeedView";

export default function FeedPage() {
  const { interactions, openArticle, toggleBookmark } = useMain();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dailyArticles = useQuery(api.articles.getDaily, { date: currentDate.toISOString() });

  const articles = formatArticles(dailyArticles, interactions);
  const loading = dailyArticles === undefined;

  const goToPreviousDay = () => {
    setCurrentDate(prev => {
      const prevDate = new Date(prev);
      prevDate.setDate(prev.getDate() - 1);
      return prevDate;
    });
  };

  return (
    <FeedView
      articles={articles}
      loading={loading}
      currentDate={currentDate}
      setActiveArticle={openArticle}
      toggleBookmark={toggleBookmark}
      onLoadPreviousDay={goToPreviousDay}
    />
  );
}
