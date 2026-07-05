import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportPagesService } from './support-pages.service';
import { SupportPagesAdminController } from './support-pages-admin.controller';
import { SupportPagesPublicController } from './support-pages-public.controller';
import { SupportPage } from './entities/support-page.entity';
import { SitemapItem } from './entities/sitemap-item.entity';
import { HelpCategory } from './entities/help-category.entity';
import { HelpArticle } from './entities/help-article.entity';
import { ArticleFeedback } from './entities/article-feedback.entity';
import { ArticleVersion } from './entities/article-version.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportPage,
      SitemapItem,
      HelpCategory,
      HelpArticle,
      ArticleFeedback,
      ArticleVersion,
      SupportTicket,
      User,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [SupportPagesAdminController, SupportPagesPublicController],
  providers: [SupportPagesService],
  exports: [SupportPagesService],
})
export class SupportPagesModule {}
