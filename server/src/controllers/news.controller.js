import { z } from 'zod';
import {
  getIndustryNews,
  getCommunityFeed,
  saveArticle,
  unsaveArticle,
  getSavedArticles,
} from '../services/news.service.js';

export const saveArticleSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  source: z.string().max(200).nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  feed: z.string().max(50).nullable().optional(),
});

export const unsaveArticleSchema = z.object({
  url: z.string().url(),
});

export async function getIndustry(req, res, next) {
  try {
    const articles = await getIndustryNews();
    res.json({ articles });
  } catch (err) {
    next(err);
  }
}

export async function getCommunity(req, res, next) {
  try {
    const articles = await getCommunityFeed();
    res.json({ articles });
  } catch (err) {
    next(err);
  }
}

export async function postSaveArticle(req, res, next) {
  try {
    const saved = await saveArticle({ userId: req.user.id, ...req.body });
    res.status(201).json({ saved });
  } catch (err) {
    next(err);
  }
}

export async function deleteSaveArticle(req, res, next) {
  try {
    await unsaveArticle({ userId: req.user.id, url: req.body.url });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function getSaved(req, res, next) {
  try {
    const saved = await getSavedArticles(req.user.id);
    res.json({ saved });
  } catch (err) {
    next(err);
  }
}
