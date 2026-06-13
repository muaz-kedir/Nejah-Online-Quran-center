import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, QueryBuilder } from 'typeorm';
import { Message, MessageStatus } from './messages.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getConversations(userId: string, userRole: UserRole): Promise<any[]> {
    // Get all messages where user is sender or receiver
    const messages = await this.messagesRepository.find({
      where: [
        { fromId: userId, fromRole: userRole },
        { toId: userId, toRole: userRole },
      ],
      order: { createdAt: 'DESC' },
    });

    // Group by conversation partner
    const conversations = new Map<string, any>();

    for (const msg of messages) {
      const otherPartyId = msg.fromId === userId ? msg.toId : msg.fromId;
      const otherPartyRole = msg.fromId === userId ? msg.toRole : msg.fromRole;

      const key = `${otherPartyRole}-${otherPartyId}`;

      if (!conversations.has(key)) {
        const otherParty = await this.getOtherPartyInfo(otherPartyRole, otherPartyId);
        conversations.set(key, {
          id: key,
          otherParty,
          lastMessage: msg,
          unreadCount: msg.isRead ? 0 : 1,
        });
      } else {
        const existing = conversations.get(key);
        if (msg.createdAt > existing.lastMessage.createdAt) {
          existing.lastMessage = msg;
        }
        if (!msg.isRead) {
          existing.unreadCount += 1;
        }
      }
    }

    return Array.from(conversations.values());
  }

  async getMessages(
    fromId: string,
    toId: string,
    fromRole: UserRole,
    toRole: UserRole,
  ): Promise<Message[]> {
    const messages = await this.messagesRepository.find({
      where: [
        { fromId, fromRole, toId, toRole },
        { fromId: toId, fromRole: toRole, toId, toRole: fromRole },
      ],
      order: { createdAt: 'ASC' },
    });

    // Mark as read
    const unreadMessages = messages.filter((m) => !m.isRead);
    for (const msg of unreadMessages) {
      msg.isRead = true;
      msg.readAt = new Date();
      await this.messagesRepository.save(msg);
    }

    return messages;
  }

  async sendMessage(
    fromId: string,
    fromRole: UserRole,
    toId: string,
    toRole: UserRole,
    subject: string,
    body: string,
    attachments?: string,
  ): Promise<Message> {
    // Validate that student can only message teacher/admin
    if (fromRole === UserRole.STUDENT) {
      if (
        toRole !== UserRole.TEACHER &&
        toRole !== UserRole.ADMIN &&
        toRole !== UserRole.SUPER_ADMIN
      ) {
        throw new BadRequestException('Students can only message teachers or administrators');
      }
    }

    // Validate that teacher can only message students/admin
    if (fromRole === UserRole.TEACHER) {
      if (
        toRole !== UserRole.STUDENT &&
        toRole !== UserRole.ADMIN &&
        toRole !== UserRole.SUPER_ADMIN
      ) {
        throw new BadRequestException('Teachers can only message students or administrators');
      }
    }

    const message = this.messagesRepository.create({
      subject,
      body,
      fromId,
      fromRole,
      toId,
      toRole,
      attachments,
    });

    return this.messagesRepository.save(message);
  }

  async markAsRead(messageId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    message.isRead = true;
    message.readAt = new Date();
    await this.messagesRepository.save(message);
  }

  async markAllAsRead(userId: string, userRole: UserRole): Promise<void> {
    await this.messagesRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true, readAt: new Date() })
      .where('toId = :userId AND toRole = :userRole AND isRead = false', { userId, userRole })
      .execute();
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.messagesRepository.remove(message);
  }

  private async getOtherPartyInfo(role: UserRole, id: string): Promise<any> {
    switch (role) {
      case UserRole.STUDENT:
        const student = await this.studentRepository.findOne({ where: { id } });
        return {
          id: student.id,
          name: student.fullName,
          avatarUrl: student.avatarUrl,
          role: UserRole.STUDENT,
        };
      case UserRole.TEACHER:
        const teacher = await this.teacherRepository.findOne({ where: { id } });
        return {
          id: teacher.id,
          name: teacher.fullName,
          avatarUrl: teacher.avatarUrl,
          role: UserRole.TEACHER,
        };
      case UserRole.PARENT:
        const parent = await this.parentRepository.findOne({ where: { id } });
        return {
          id: parent.id,
          name: parent.fullName,
          avatarUrl: (parent as any).avatarUrl || null,
          role: UserRole.PARENT,
        };
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        const user = await this.userRepository.findOne({ where: { id } });
        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatar || null,
          role: user.role,
        };
      default:
        return { id, name: 'Unknown', role };
    }
  }

  async getStudentConversation(
    partnerId: string,
    partnerRole: UserRole,
    studentId: string,
  ): Promise<Message[]> {
    return this.getMessages(studentId, partnerId, UserRole.STUDENT, partnerRole);
  }

  async countUnreadMessages(userId: string, userRole: UserRole): Promise<number> {
    return this.messagesRepository.count({
      where: { toId: userId, toRole: userRole, isRead: false },
    });
  }
}
