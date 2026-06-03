import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id, req.user.role as UserRole);
  }

  @Get('conversations/:otherPartyId')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async getMessages(
    @Request() req,
    @Param('otherPartyId') otherPartyId: string,
    @Query('role') otherPartyRole?: string,
  ) {
    return this.messagesService.getMessages(
      req.user.id,
      otherPartyId,
      req.user.role as UserRole,
      otherPartyRole as UserRole || UserRole.STUDENT,
    );
  }

  @Post()
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async sendMessage(
    @Request() req,
    @Body() dto: {
      toId: string;
      toRole: UserRole;
      subject: string;
      body: string;
      attachments?: string;
    },
  ) {
    return this.messagesService.sendMessage(
      req.user.id,
      req.user.role as UserRole,
      dto.toId,
      dto.toRole,
      dto.subject,
      dto.body,
      dto.attachments,
    );
  }

  @Patch(':id/read')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async markAsRead(@Param('id') messageId: string) {
    await this.messagesService.markAsRead(messageId);
    return { message: 'Message marked as read' };
  }

  @Patch('read-all')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async markAllAsRead(@Request() req) {
    await this.messagesService.markAllAsRead(req.user.id, req.user.role as UserRole);
    return { message: 'All messages marked as read' };
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async deleteMessage(@Param('id') messageId: string) {
    await this.messagesService.deleteMessage(messageId);
    return { message: 'Message deleted' };
  }

  @Get('unread-count')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async getUnreadCount(@Request() req) {
    return this.messagesService.countUnreadMessages(req.user.id, req.user.role as UserRole);
  }
}
