import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SupportPagesService } from './support-pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateSupportPageDto, UpdateSupportPageDto, UpdatePageStatusDto } from './dto/support-page.dto';
import { CreateSitemapItemDto, UpdateSitemapItemDto, ReorderSitemapDto } from './dto/sitemap.dto';
import { CreateCategoryDto, UpdateCategoryDto, ReorderCategoriesDto } from './dto/help-category.dto';
import { CreateArticleDto, UpdateArticleDto, ArticleQueryDto } from './dto/help-article.dto';
import { UpdateTicketDto } from './dto/support-ticket.dto';

@Controller('website/admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SupportPagesAdminController {
  constructor(private readonly service: SupportPagesService) {}

  @Get('pages')
  getAllPages() { return this.service.getAllPages(); }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) { return this.service.getPageBySlug(slug); }

  @Post('pages')
  createPage(@Body() dto: CreateSupportPageDto) { return this.service.createPage(dto); }

  @Put('pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdateSupportPageDto) { return this.service.updatePage(id, dto); }

  @Patch('pages/:id/status')
  updatePageStatus(@Param('id') id: string, @Body() dto: UpdatePageStatusDto) { return this.service.updatePageStatus(id, dto.status); }

  @Get('sitemap')
  getSitemap() { return this.service.getAllSitemapItems(); }

  @Post('sitemap')
  createSitemapItem(@Body() dto: CreateSitemapItemDto) { return this.service.createSitemapItem(dto); }

  @Put('sitemap/:id')
  updateSitemapItem(@Param('id') id: string, @Body() dto: UpdateSitemapItemDto) { return this.service.updateSitemapItem(id, dto); }

  @Delete('sitemap/:id')
  deleteSitemapItem(@Param('id') id: string) { return this.service.deleteSitemapItem(id); }

  @Post('sitemap/reorder')
  reorderSitemap(@Body() dto: ReorderSitemapDto) { return this.service.reorderSitemap(dto.ids); }

  @Get('categories')
  getCategories() { return this.service.getAllCategories(); }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) { return this.service.createCategory(dto); }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.service.updateCategory(id, dto); }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) { return this.service.deleteCategory(id); }

  @Post('categories/reorder')
  reorderCategories(@Body() dto: ReorderCategoriesDto) { return this.service.reorderCategories(dto.ids); }

  @Get('articles')
  getArticles(@Query() query: ArticleQueryDto) { return this.service.getAllArticles(query); }

  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string) { return this.service.getAdminArticle(slug); }

  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto) { return this.service.createArticle(dto); }

  @Put('articles/:id')
  updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto) { return this.service.updateArticle(id, dto); }

  @Delete('articles/:id')
  deleteArticle(@Param('id') id: string) { return this.service.deleteArticle(id); }

  @Get('articles/:id/versions')
  getArticleVersions(@Param('id') id: string) { return this.service.getArticleVersions(id); }

  @Post('articles/:id/restore/:versionId')
  restoreArticleVersion(@Param('id') id: string, @Param('versionId') versionId: string) { return this.service.restoreArticleVersion(id, versionId); }

  @Get('tickets')
  getTickets(@Query() query: any) { return this.service.getAllTickets(query); }

  @Patch('tickets/:id')
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) { return this.service.updateTicket(id, dto); }

  @Get('analytics')
  getAnalytics() { return this.service.getAnalytics(); }
}
