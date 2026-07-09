import { api, apiUrl } from './api';

export type CmsLang = 'en' | 'ar' | 'am';
export type LocalizedText = Record<CmsLang, string>;
export const EMPTY_LOCALIZED: LocalizedText = { en: '', ar: '', am: '' };

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// ── Support Page ───────────────────────────

export interface SupportPage {
  id: string;
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  content: LocalizedText;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  metaKeywords: LocalizedText;
  ogImage: string | null;
  status: PageStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPages() {
  return api<SupportPage[]>('/website/admin/support/pages');
}

export async function getPage(slug: string) {
  return api<SupportPage>(`/website/admin/support/pages/${slug}`);
}

export async function createPage(dto: Partial<SupportPage>) {
  return api<SupportPage>('/website/admin/support/pages', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updatePage(id: string, dto: Partial<SupportPage>) {
  return api<SupportPage>(`/website/admin/support/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function updatePageStatus(id: string, status: PageStatus) {
  return api<SupportPage>(`/website/admin/support/pages/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Sitemap ────────────────────────────────

export interface SitemapItem {
  id: string;
  title: string;
  url: string;
  parentId: string | null;
  parent?: SitemapItem | null;
  displayOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getSitemap() {
  return api<SitemapItem[]>('/website/admin/support/sitemap');
}

export async function createSitemapItem(dto: Partial<SitemapItem>) {
  return api<SitemapItem>('/website/admin/support/sitemap', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateSitemapItem(id: string, dto: Partial<SitemapItem>) {
  return api<SitemapItem>(`/website/admin/support/sitemap/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteSitemapItem(id: string) {
  return api<void>(`/website/admin/support/sitemap/${id}`, { method: 'DELETE' });
}

export async function reorderSitemap(ids: string[]) {
  return api<SitemapItem[]>('/website/admin/support/sitemap/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ── Help Categories ────────────────────────

export interface HelpCategory {
  id: string;
  name: LocalizedText;
  icon: string | null;
  description: LocalizedText;
  slug: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
}

export async function getCategories() {
  return api<HelpCategory[]>('/website/admin/support/categories');
}

export async function createCategory(dto: Partial<HelpCategory>) {
  return api<HelpCategory>('/website/admin/support/categories', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateCategory(id: string, dto: Partial<HelpCategory>) {
  return api<HelpCategory>(`/website/admin/support/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteCategory(id: string) {
  return api<void>(`/website/admin/support/categories/${id}`, { method: 'DELETE' });
}

export async function reorderCategories(ids: string[]) {
  return api<HelpCategory[]>('/website/admin/support/categories/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ── Help Articles ──────────────────────────

export interface HelpArticle {
  id: string;
  title: LocalizedText;
  slug: string;
  categoryId: string;
  category?: HelpCategory;
  shortDescription: LocalizedText;
  content: LocalizedText;
  tags: string[] | null;
  author: string | null;
  status: ArticleStatus;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getArticles(query?: { search?: string; categoryId?: string; status?: ArticleStatus; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.categoryId) params.set('categoryId', query.categoryId);
  if (query?.status) params.set('status', query.status);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return api<PaginatedResponse<HelpArticle>>(`/website/admin/support/articles${qs ? `?${qs}` : ''}`);
}

export async function getArticle(slug: string) {
  return api<HelpArticle>(`/website/admin/support/articles/${slug}`);
}

export async function createArticle(dto: Partial<HelpArticle>) {
  return api<HelpArticle>('/website/admin/support/articles', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateArticle(id: string, dto: Partial<HelpArticle>) {
  return api<HelpArticle>(`/website/admin/support/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteArticle(id: string) {
  return api<void>(`/website/admin/support/articles/${id}`, { method: 'DELETE' });
}

// ── Article Versions ───────────────────────

export interface ArticleVersion {
  id: string;
  articleId: string;
  editor: string | null;
  changes: Record<string, any>;
  createdAt: string;
}

export async function getArticleVersions(id: string) {
  return api<ArticleVersion[]>(`/website/admin/support/articles/${id}/versions`);
}

export async function restoreArticleVersion(articleId: string, versionId: string) {
  return api<HelpArticle>(`/website/admin/support/articles/${articleId}/restore/${versionId}`, {
    method: 'POST',
  });
}

// ── Support Tickets ────────────────────────

export interface SupportTicket {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  userRole: string | null;
  subject: string;
  message: string;
  attachmentUrl: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assignedStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getTickets(query?: { status?: TicketStatus; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return api<PaginatedResponse<SupportTicket>>(`/website/admin/support/tickets${qs ? `?${qs}` : ''}`);
}

export async function updateTicket(id: string, dto: Partial<SupportTicket>) {
  return api<SupportTicket>(`/website/admin/support/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// ── Analytics ──────────────────────────────

export interface SupportAnalytics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalCategories: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
  totalTickets: number;
  resolvedTickets: number;
  mostViewed: HelpArticle[];
  leastViewed: HelpArticle[];
}

export async function getAnalytics() {
  return api<SupportAnalytics>('/website/admin/support/analytics');
}

// ── Public API ─────────────────────────────

export async function getPublishedPage(slug: string) {
  return api<SupportPage>(`/website/support/pages/${slug}`);
}

export async function getVisibleSitemap() {
  return api<SitemapItem[]>('/website/support/sitemap');
}

export async function getCategoriesWithCounts() {
  return api<HelpCategory[]>('/website/support/categories');
}

export async function getPublishedArticles(query?: { search?: string; categoryId?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.categoryId) params.set('categoryId', query.categoryId);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return api<PaginatedResponse<HelpArticle>>(`/website/support/articles${qs ? `?${qs}` : ''}`);
}

export async function getPopularArticles() {
  return api<HelpArticle[]>('/website/support/articles/popular');
}

export async function getArticleBySlug(slug: string) {
  return api<HelpArticle>(`/website/support/articles/${slug}`);
}

export async function getRelatedArticles(slug: string) {
  return api<HelpArticle[]>(`/website/support/articles/${slug}/related`);
}

export async function submitFeedback(articleId: string, isHelpful: boolean) {
  return api(`/website/support/articles/${articleId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ isHelpful }),
  });
}

export async function createTicket(dto: { name: string; email: string; userRole?: string; subject: string; message: string; attachmentUrl?: string }) {
  return api('/website/support/tickets', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// ── Image Upload ───────────────────────────

export async function uploadSupportImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('token');
  const res = await fetch(apiUrl('/uploads'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Upload failed');
  }
  const data = await res.json();
  return data.url as string;
}

export function resolveHelpImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads')) return apiUrl(path);
  return path;
}
