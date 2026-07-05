import { Controller, Get, Post, Param, Query, Body, NotFoundException } from '@nestjs/common';
import { SupportPagesService } from './support-pages.service';
import { CreateTicketDto } from './dto/support-ticket.dto';
import { ArticleFeedbackDto } from './dto/help-article.dto';

@Controller('website/support')
export class SupportPagesPublicController {
  constructor(private readonly service: SupportPagesService) {}

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) { return this.service.getPublishedPage(slug); }

  @Get('sitemap')
  getSitemap() { return this.service.getVisibleSitemapItems(); }

  @Get('categories')
  getCategories() { return this.service.getCategoriesWithCounts(); }

  @Get('articles')
  getArticles(@Query() query: any) { return this.service.getPublishedArticles(query); }

  @Get('articles/popular')
  getPopularArticles() { return this.service.getPopularArticles(10); }

  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string) { return this.service.getArticleBySlug(slug); }

  @Get('articles/:slug/related')
  getRelatedArticles(@Param('slug') slug: string) { return this.service.getRelatedBySlug(slug); }

  @Post('articles/:id/feedback')
  submitFeedback(@Param('id') id: string, @Body() dto: ArticleFeedbackDto) {
    return this.service.submitFeedback(id, dto.isHelpful);
  }

  @Post('tickets')
  createTicket(@Body() dto: CreateTicketDto) { return this.service.createTicket(dto); }
}
