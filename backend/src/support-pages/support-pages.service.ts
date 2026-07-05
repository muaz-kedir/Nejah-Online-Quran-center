import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { SupportPage, PageStatus } from './entities/support-page.entity';
import { SitemapItem } from './entities/sitemap-item.entity';
import { HelpCategory } from './entities/help-category.entity';
import { HelpArticle, ArticleStatus } from './entities/help-article.entity';
import { ArticleFeedback } from './entities/article-feedback.entity';
import { ArticleVersion } from './entities/article-version.entity';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationChannel } from '../notifications/entities/notification.entity';

@Injectable()
export class SupportPagesService {
  constructor(
    @InjectRepository(SupportPage) private pageRepo: Repository<SupportPage>,
    @InjectRepository(SitemapItem) private sitemapRepo: Repository<SitemapItem>,
    @InjectRepository(HelpCategory) private categoryRepo: Repository<HelpCategory>,
    @InjectRepository(HelpArticle) private articleRepo: Repository<HelpArticle>,
    @InjectRepository(ArticleFeedback) private feedbackRepo: Repository<ArticleFeedback>,
    @InjectRepository(ArticleVersion) private versionRepo: Repository<ArticleVersion>,
    @InjectRepository(SupportTicket) private ticketRepo: Repository<SupportTicket>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Support Pages ──────────────────────────────────────

  async getAllPages(): Promise<SupportPage[]> {
    return this.pageRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getPageBySlug(slug: string): Promise<SupportPage> {
    const page = await this.pageRepo.findOne({ where: { slug } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async getPublishedPage(slug: string): Promise<SupportPage> {
    const page = await this.pageRepo.findOne({ where: { slug, status: PageStatus.PUBLISHED } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async createPage(dto: any): Promise<SupportPage> {
    const existing = await this.pageRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('A page with this slug already exists');
    const page = this.pageRepo.create({
      ...dto,
      status: dto.status || PageStatus.DRAFT,
      publishedAt: dto.status === PageStatus.PUBLISHED ? new Date().toISOString().split('T')[0] : undefined,
    });
    return this.pageRepo.save(page) as any as SupportPage;
  }

  async updatePage(id: string, dto: any): Promise<SupportPage> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    if (dto.slug && dto.slug !== page.slug) {
      const existing = await this.pageRepo.findOne({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('Slug already in use');
    }
    Object.assign(page, dto);
    if (dto.status === PageStatus.PUBLISHED && page.status !== PageStatus.PUBLISHED) {
      page.publishedAt = new Date().toISOString().split('T')[0];
    }
    return this.pageRepo.save(page);
  }

  async updatePageStatus(id: string, status: PageStatus): Promise<SupportPage> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    page.status = status;
    if (status === PageStatus.PUBLISHED) {
      page.publishedAt = new Date().toISOString().split('T')[0];
    }
    return this.pageRepo.save(page);
  }

  // ── Sitemap ────────────────────────────────────────────

  async getAllSitemapItems(): Promise<SitemapItem[]> {
    return this.sitemapRepo.find({ order: { displayOrder: 'ASC' } });
  }

  async getVisibleSitemapItems(): Promise<SitemapItem[]> {
    return this.sitemapRepo.find({ where: { isVisible: true }, order: { displayOrder: 'ASC' } });
  }

  async createSitemapItem(dto: any): Promise<SitemapItem> {
    const max = await this.sitemapRepo.find({ order: { displayOrder: 'DESC' }, take: 1 });
    const item = this.sitemapRepo.create({
      ...dto,
      displayOrder: dto.displayOrder ?? (max.length > 0 ? max[0].displayOrder + 1 : 0),
    });
    return this.sitemapRepo.save(item) as any as SitemapItem;
  }

  async updateSitemapItem(id: string, dto: any): Promise<SitemapItem> {
    const item = await this.sitemapRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Sitemap item not found');
    Object.assign(item, dto);
    return this.sitemapRepo.save(item);
  }

  async deleteSitemapItem(id: string): Promise<void> {
    await this.sitemapRepo.delete(id);
  }

  async reorderSitemap(ids: string[]): Promise<SitemapItem[]> {
    const items = await this.sitemapRepo.findBy({ id: In(ids) });
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const updated = ids.map((id, index) => {
      const item = itemMap.get(id);
      if (item) {
        item.displayOrder = index;
        return item;
      }
      return null;
    }).filter(Boolean) as SitemapItem[];
    return this.sitemapRepo.save(updated);
  }

  // ── Help Categories ────────────────────────────────────

  async getAllCategories(): Promise<HelpCategory[]> {
    return this.categoryRepo.find({ order: { displayOrder: 'ASC' } });
  }

  async getCategoriesWithCounts(): Promise<any[]> {
    const categories = await this.categoryRepo.find({ order: { displayOrder: 'ASC' } });
    const counts = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        articleCount: await this.articleRepo.count({ where: { categoryId: cat.id, status: ArticleStatus.PUBLISHED } }),
      })),
    );
    return counts;
  }

  async createCategory(dto: any): Promise<HelpCategory> {
    const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Category slug already exists');
    const max = await this.categoryRepo.find({ order: { displayOrder: 'DESC' }, take: 1 });
    const cat = this.categoryRepo.create({
      ...dto,
      displayOrder: dto.displayOrder ?? (max.length > 0 ? max[0].displayOrder + 1 : 0),
    });
    return this.categoryRepo.save(cat) as any as HelpCategory;
  }

  async updateCategory(id: string, dto: any): Promise<HelpCategory> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('Slug already in use');
    }
    Object.assign(cat, dto);
    return this.categoryRepo.save(cat);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepo.delete(id);
  }

  async reorderCategories(ids: string[]): Promise<HelpCategory[]> {
    const items = await this.categoryRepo.findBy({ id: In(ids) });
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const updated = ids.map((id, index) => {
      const item = itemMap.get(id);
      if (item) {
        item.displayOrder = index;
        return item;
      }
      return null;
    }).filter(Boolean) as HelpCategory[];
    return this.categoryRepo.save(updated);
  }

  // ── Help Articles ──────────────────────────────────────

  async getAllArticles(query: any) {
    const { search, categoryId, status, page = 1, limit = 20 } = query;
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) {
      where.title = Like(`%${search}%`);
    }
    const [data, total] = await this.articleRepo.findAndCount({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getPublishedArticles(query: any) {
    const { search, categoryId, page = 1, limit = 20 } = query;
    const where: any = { status: ArticleStatus.PUBLISHED };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.title = Like(`%${search}%`);
    }
    const [data, total] = await this.articleRepo.findAndCount({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getArticleBySlug(slug: string): Promise<HelpArticle> {
    const article = await this.articleRepo.findOne({ where: { slug, status: ArticleStatus.PUBLISHED }, relations: ['category'] });
    if (!article) throw new NotFoundException('Article not found');
    article.viewCount += 1;
    await this.articleRepo.save(article);
    return article;
  }

  async getAdminArticle(slug: string): Promise<HelpArticle> {
    const article = await this.articleRepo.findOne({ where: { slug }, relations: ['category'] });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async createArticle(dto: any, editor?: string): Promise<HelpArticle> {
    const existing = await this.articleRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Article slug already exists');
    const article = this.articleRepo.create({
      ...dto,
      status: dto.status || ArticleStatus.DRAFT,
      publishedAt: dto.status === ArticleStatus.PUBLISHED ? new Date().toISOString().split('T')[0] : undefined,
    });
    return this.articleRepo.save(article) as any as HelpArticle;
  }

  async updateArticle(id: string, dto: any, editor?: string): Promise<HelpArticle> {
    const article = await this.articleRepo.findOne({ where: { id }, relations: ['category'] });
    if (!article) throw new NotFoundException('Article not found');
    if (dto.slug && dto.slug !== article.slug) {
      const existing = await this.articleRepo.findOne({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('Slug already in use');
    }
    await this.versionRepo.save(
      this.versionRepo.create({
        articleId: id,
        editor: editor || 'Unknown',
        changes: {
          title: article.title,
          shortDescription: article.shortDescription,
          content: article.content,
          categoryId: article.categoryId,
          tags: article.tags,
          status: article.status,
        },
      }),
    );
    Object.assign(article, dto);
    if (dto.status === ArticleStatus.PUBLISHED && !article.publishedAt) {
      article.publishedAt = new Date().toISOString().split('T')[0];
    }
    return this.articleRepo.save(article);
  }

  async deleteArticle(id: string): Promise<void> {
    await this.articleRepo.delete(id);
  }

  async getArticleVersions(articleId: string): Promise<ArticleVersion[]> {
    return this.versionRepo.find({
      where: { articleId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async restoreArticleVersion(articleId: string, versionId: string): Promise<HelpArticle> {
    const version = await this.versionRepo.findOne({ where: { id: versionId, articleId } });
    if (!version) throw new NotFoundException('Version not found');
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Article not found');
    Object.assign(article, version.changes);
    return this.articleRepo.save(article);
  }

  async getRelatedBySlug(slug: string, limit = 5): Promise<HelpArticle[]> {
    const article = await this.articleRepo.findOne({ where: { slug } });
    if (!article) return [];
    return this.getRelatedArticles(article.id, limit);
  }

  async getRelatedArticles(articleId: string, limit = 5): Promise<HelpArticle[]> {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) return [];
    return this.articleRepo.find({
      where: { categoryId: article.categoryId, status: ArticleStatus.PUBLISHED },
      take: limit + 1,
      order: { viewCount: 'DESC' },
    }).then((items) => items.filter((a) => a.id !== articleId).slice(0, limit));
  }

  async getPopularArticles(limit = 10): Promise<HelpArticle[]> {
    return this.articleRepo.find({
      where: { status: ArticleStatus.PUBLISHED },
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }

  async submitFeedback(articleId: string, isHelpful: boolean): Promise<void> {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Article not found');
    await this.feedbackRepo.save(this.feedbackRepo.create({ articleId, isHelpful }));
    if (isHelpful) {
      article.helpfulCount += 1;
    } else {
      article.notHelpfulCount += 1;
    }
    await this.articleRepo.save(article);
  }

  // ── Support Tickets ────────────────────────────────────

  async createTicket(dto: any): Promise<SupportTicket> {
    const count = await this.ticketRepo.count();
    const ticket = this.ticketRepo.create({
      ...dto,
      ticketId: `SP-${String(count + 1).padStart(5, '0')}`,
      status: TicketStatus.OPEN,
    });
    const saved = await this.ticketRepo.save(ticket) as any as SupportTicket;
    const admins = await this.userRepo.find({ where: { role: UserRole.SUPER_ADMIN, isActive: true } });
    if (admins.length > 0) {
      await this.notificationsService.sendCustomNotifications(
        admins.map((u) => u.id),
        'New Support Request',
        `${dto.userRole || 'User'} ${dto.name} submitted a support request regarding "${dto.subject}".`,
        { ticketId: saved.ticketId, subject: dto.subject, name: dto.name },
        NotificationChannel.SYSTEM_ALERT,
        false,
        '/website/support',
      );
    }
    return saved;
  }

  async getAllTickets(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.ticketRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateTicket(id: string, dto: any): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    Object.assign(ticket, dto);
    return this.ticketRepo.save(ticket);
  }

  // ── Analytics ──────────────────────────────────────────

  async getAnalytics() {
    const totalArticles = await this.articleRepo.count();
    const publishedArticles = await this.articleRepo.count({ where: { status: ArticleStatus.PUBLISHED } });
    const draftArticles = await this.articleRepo.count({ where: { status: ArticleStatus.DRAFT } });
    const totalCategories = await this.categoryRepo.count();
    const feedbacks = await this.feedbackRepo.find();
    const helpfulVotes = feedbacks.filter((f) => f.isHelpful).length;
    const totalVotes = feedbacks.length;
    const allTickets = await this.ticketRepo.find();
    const resolvedTickets = allTickets.filter((t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
    const mostViewed = await this.articleRepo.find({
      where: { status: ArticleStatus.PUBLISHED },
      order: { viewCount: 'DESC' },
      take: 5,
    });
    const leastViewed = await this.articleRepo.find({
      where: { status: ArticleStatus.PUBLISHED },
      order: { viewCount: 'ASC' },
      take: 5,
    });
    return {
      totalArticles,
      publishedArticles,
      draftArticles,
      totalCategories,
      helpfulVotes,
      notHelpfulVotes: totalVotes - helpfulVotes,
      totalTickets: allTickets.length,
      resolvedTickets,
      mostViewed,
      leastViewed,
    };
  }
}
