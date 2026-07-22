import { Injectable, Inject, forwardRef, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { AppGateway } from '../websocket/websocket.gateway';
import { PushSubscriptionService } from './push-subscription.service';
import { FcmService } from './fcm.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from './entities/notification.entity';
import { LiveSession } from '../zoom/entities/live-session.entity';

export interface NotificationPayload {
  type: 'meeting_started' | 'meeting_ended' | 'attendance_recorded' | 'class_cancelled';
  title: string;
  message: string;
  data: any;
  recipientIds: string[];
  actionUrl?: string;
}

export interface NotificationDispatchResult {
  studentCount: number;
  parentCount: number;
  warnings: string[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => AppGateway))
    private appGateway: AppGateway,
    private pushSubscriptionService: PushSubscriptionService,
    private fcmService: FcmService,
    private telegramService: TelegramService,
  ) {}

  async notifyMeetingStarted(session: ClassSession, assignedStudentIds: string[]): Promise<void> {
    // Get students and their parents
    const students = await this.studentRepository.findByIds(assignedStudentIds);
    const parentIds = new Set<string>();
    const studentUserIds: string[] = [];

    for (const student of students) {
      if (student.userId) {
        studentUserIds.push(student.userId);
      }
      if (student.parentId) {
        parentIds.add(student.parentId);
      }
    }

    // Get parent user IDs
    const parents = await this.parentRepository.find({
      where: Array.from(parentIds).map((id) => ({ id })),
      relations: ['user'],
    });
    const parentUserIds = parents.filter((p) => p.user?.id).map((p) => p.user.id);

    // Get admin, superadmin, and qirat manager users
    const admins = await this.userRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }, { role: UserRole.QIRAT_MANAGER }],
    });
    const adminUserIds = admins.map((a) => a.id);

    const allRecipientIds = [...studentUserIds, ...parentUserIds, ...adminUserIds];

    const notification: NotificationPayload = {
      type: 'meeting_started',
      title: `Class Started: ${session.classTitle}`,
      message: `${session.teacher.fullName} has started the class. Click to join the meeting.`,
      data: {
        sessionId: session.id,
        meetingLink: session.meetingLink,
        classTitle: session.classTitle,
        subject: session.subject,
        teacherName: session.teacher.fullName,
        scheduledTime: session.scheduledStartTime,
      },
      recipientIds: allRecipientIds,
    };

    await this.sendNotification(notification);
  }

  async notifyMeetingEnded(session: ClassSession): Promise<void> {
    const attendances = await this.studentRepository.query(
      `SELECT DISTINCT "studentId" FROM student_attendance WHERE "classSessionId" = $1`,
      [session.id],
    );

    const studentIds = attendances.map((a) => a.studentId);
    const students = await this.studentRepository.findByIds(studentIds);

    const parentIds = new Set<string>();
    const studentUserIds: string[] = [];

    for (const student of students) {
      if (student.userId) {
        studentUserIds.push(student.userId);
      }
      if (student.parentId) {
        parentIds.add(student.parentId);
      }
    }

    const parents = await this.parentRepository.find({
      where: Array.from(parentIds).map((id) => ({ id })),
      relations: ['user'],
    });
    const parentUserIds = parents.filter((p) => p.user?.id).map((p) => p.user.id);

    const allRecipientIds = [...studentUserIds, ...parentUserIds];

    const notification: NotificationPayload = {
      type: 'meeting_ended',
      title: `Class Ended: ${session.classTitle}`,
      message: `The class has ended. Your attendance has been recorded.`,
      data: {
        sessionId: session.id,
        classTitle: session.classTitle,
      },
      recipientIds: allRecipientIds,
    };

    await this.sendNotification(notification);
  }

  async notifyAttendanceRecorded(
    studentId: string,
    sessionId: string,
    status: string,
  ): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['parent', 'parent.user'],
    });

    if (!student) return;

    const recipientIds: string[] = [];

    if (student.userId) {
      recipientIds.push(student.userId);
    }

    if (student.parent?.user?.id) {
      recipientIds.push(student.parent.user.id);
    }

    const notification: NotificationPayload = {
      type: 'attendance_recorded',
      title: 'Attendance Recorded',
      message: `Your attendance has been marked as ${status}`,
      data: {
        sessionId,
        status,
        studentId,
      },
      recipientIds,
    };

    await this.sendNotification(notification);
  }

  private async sendNotification(payload: NotificationPayload): Promise<void> {
    console.log('Sending notification:', payload);

    let channel = NotificationChannel.SYSTEM_ALERT;
    if (payload.type === 'meeting_started') {
      channel = NotificationChannel.MEETING_STARTED;
    } else if (payload.type === 'meeting_ended') {
      channel = NotificationChannel.MEETING_ENDED;
    } else if (payload.type === 'attendance_recorded') {
      channel = NotificationChannel.ATTENDANCE_MARKED;
    } else if (payload.type === 'class_cancelled') {
      channel = NotificationChannel.CLASS_ALERT;
    }

    if (payload.recipientIds && payload.recipientIds.length > 0) {
      const uniqueRecipientIds = Array.from(new Set(payload.recipientIds));
      const saved = await this.notificationRepository.save(
        uniqueRecipientIds.map((userId) =>
          this.notificationRepository.create({
            userId,
            type: NotificationType.IN_APP,
            channel,
            title: payload.title,
            content: payload.message,
            dataJson: payload.data,
            actionUrl: payload.actionUrl,
            isRead: false,
            sentAt: new Date(),
          }),
        ),
      );

      // Emit real-time WebSocket event for each recipient
      for (const notif of saved) {
        this.appGateway.emitToUser(notif.userId, 'notification:new', {
          id: notif.id,
          channel: notif.channel,
          title: notif.title,
          content: notif.content,
          data: notif.dataJson,
          actionUrl: notif.actionUrl,
          isRead: notif.isRead,
          sentAt: notif.sentAt,
          createdAt: notif.createdAt,
        });
      }

      // Send push notification (VAPID) to all recipients
      await this.pushSubscriptionService.sendPushToUsers(uniqueRecipientIds, {
        title: payload.title,
        body: payload.message,
        url: payload.actionUrl || (typeof payload.data?.url === 'string' ? payload.data.url : undefined),
        data: payload.data,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: typeof payload.data?.sessionId === 'string' ? `session-${payload.data.sessionId}` : 'session-notification',
      }).catch((err) => {
        this.logger.error('Failed to send VAPID push notification', err);
      });

      // Send FCM push notification to all recipients
      await this.fcmService.sendToUsers(uniqueRecipientIds, {
        title: payload.title,
        body: payload.message,
        data: Object.fromEntries(
          Object.entries({
            ...(payload.data || {}),
            sessionId: typeof payload.data?.sessionId === 'string' ? payload.data.sessionId : undefined,
            url: payload.actionUrl || (typeof payload.data?.url === 'string' ? payload.data.url : '/'),
            channel,
          }).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)]),
        ),
        icon: '/logo.png',
        badge: '/logo.png',
        tag: typeof payload.data?.sessionId === 'string' ? `session-${payload.data.sessionId}` : 'session-notification',
        clickAction: payload.actionUrl || (typeof payload.data?.url === 'string' ? payload.data.url : '/'),
      }).catch((err) => {
        this.logger.error('Failed to send FCM push notification', err);
      });

      // Send Telegram notification to all recipients
      await this.telegramService.sendToUsers(uniqueRecipientIds,
        `${payload.title}\n\n${payload.message}${payload.actionUrl ? `\n\n${payload.actionUrl}` : ''}`,
      ).catch((err) => {
        this.logger.error('Failed to send Telegram notification', err);
      });
    }
  }

  async sendMeetingNotification(
    sessionId: string,
    recipientIds: string[],
    data: {
      teacherName: string;
      className: string;
      meetingLink: string;
      scheduledTime: string | Date;
    },
  ): Promise<void> {
    const notification: NotificationPayload = {
      type: 'meeting_started',
      title: `Class Started: ${data.className}`,
      message: `${data.teacherName} has started the class. Click to join the meeting.`,
      data: {
        sessionId,
        meetingLink: data.meetingLink,
        className: data.className,
        teacherName: data.teacherName,
        scheduledTime: data.scheduledTime,
      },
      recipientIds,
    };

    await this.sendNotification(notification);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async getNotificationsPaginated(
    userId: string,
    options: { page?: number; limit?: number; search?: string; filter?: string },
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options.search) {
      where.title = Like(`%${options.search}%`);
    }

    if (options.filter && options.filter !== 'all') {
      if (options.filter === 'unread') {
        where.isRead = false;
      } else {
        where.channel = options.filter;
      }
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSummary(userId: string) {
    const [total, unread, byChannel] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({ where: { userId, isRead: false } }),
      this.notificationRepository
        .createQueryBuilder('n')
        .select('n.channel', 'channel')
        .addSelect('COUNT(*)', 'count')
        .where('n.userId = :userId', { userId })
        .groupBy('n.channel')
        .getRawMany(),
    ]);

    return { total, unread, byChannel };
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({ where: { id, userId } });
    if (!notification) {
      throw new BadRequestException('Notification not found');
    }
    await this.notificationRepository.remove(notification);
  }

  async deleteMultiple(ids: string[], userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: In(ids), userId });
  }

  async clearRead(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId, isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async sendCustomNotifications(
    recipientIds: string[],
    title: string,
    message: string,
    data?: Record<string, unknown>,
    channel?: NotificationChannel,
    skipPush = false,
    actionUrl?: string,
  ): Promise<void> {
    if (!recipientIds.length) return;

    const inferredChannel = channel ||
      (title.toLowerCase().includes('start')
        ? NotificationChannel.MEETING_STARTED
        : title.toLowerCase().includes('end') || title.toLowerCase().includes('complet')
          ? NotificationChannel.MEETING_ENDED
          : title.toLowerCase().includes('absent') || title.toLowerCase().includes('no.show')
            ? NotificationChannel.CLASS_ALERT
            : title.toLowerCase().includes('cancel')
              ? NotificationChannel.CLASS_ALERT
              : title.toLowerCase().includes('soon') || title.toLowerCase().includes('reminder')
                ? NotificationChannel.CLASS_ALERT
                : NotificationChannel.SYSTEM_ALERT);

    const uniqueRecipientIds = Array.from(new Set(recipientIds));
    const notificationsToSave = uniqueRecipientIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type: NotificationType.IN_APP,
        channel: inferredChannel,
        title,
        content: message,
        dataJson: data,
        actionUrl,
        isRead: false,
        sentAt: new Date(),
      }),
    );
    const saved = await this.notificationRepository.save(notificationsToSave);

    // Emit real-time WebSocket event for each recipient
    for (const notif of saved) {
      this.appGateway.emitToUser(notif.userId, 'notification:new', {
        id: notif.id,
        channel: notif.channel,
        title: notif.title,
        content: notif.content,
        data: notif.dataJson,
        actionUrl: notif.actionUrl,
        isRead: notif.isRead,
        sentAt: notif.sentAt,
        createdAt: notif.createdAt,
      });
    }

    // Send push notification to all recipients
    if (!skipPush) {
      await this.pushSubscriptionService.sendPushToUsers(uniqueRecipientIds, {
        title,
        body: message,
        url: actionUrl || (typeof data?.url === 'string' ? data.url : undefined),
        data,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: typeof data?.sessionId === 'string' ? `session-${data.sessionId}` : 'session-notification',
      });

      await this.fcmService.sendToUsers(uniqueRecipientIds, {
        title,
        body: message,
        data: Object.fromEntries(
          Object.entries({
            ...(data || {}),
            sessionId: typeof data?.sessionId === 'string' ? data.sessionId : undefined,
            url: actionUrl || (typeof data?.url === 'string' ? data.url : '/'),
            channel: inferredChannel,
          }).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)]),
        ),
        icon: '/logo.png',
        badge: '/logo.png',
        tag: typeof data?.sessionId === 'string' ? `session-${data.sessionId}` : 'session-notification',
        clickAction: actionUrl || (typeof data?.url === 'string' ? data.url : '/'),
      });
    }
  }

  async notifyLiveSessionStarted(session: LiveSession): Promise<NotificationDispatchResult> {
    const studentUserIds = new Set<string>();
    const parentUserIds = new Set<string>();
    const warnings: string[] = [];

    const collectStudent = (student?: Student | null) => {
      if (!student) return;
      if (student.userId) studentUserIds.add(student.userId);
      const parentUser = student.parent?.user;
      if (parentUser?.id) parentUserIds.add(parentUser.id);
    };

    collectStudent(session.student);

    for (const attendance of session.attendances || []) {
      collectStudent(attendance.student);
    }

    for (const scheduleStudent of session.schedule?.scheduleStudents || []) {
      collectStudent(scheduleStudent.student);
    }

    if (!session.studentId && (!session.attendances || session.attendances.length === 0) && (!session.schedule?.scheduleStudents || session.schedule.scheduleStudents.length === 0)) {
      this.logger.warn(`No students found for session ${session.id} — skipping notification`);
      return { studentCount: 0, parentCount: 0, warnings: [] };
    }

    const className =
      session.schedule?.className || session.metadata?.className || 'Quran Class';
    const teacherName = session.teacher?.fullName || 'Your teacher';
    const sessionId = session.id;
    const meetingLink = session.meetingLink || session.metadata?.meetingLink || session.zoomJoinUrl || '';
    const joinUrl = meetingLink || `/classroom/${sessionId}`;
    const classroomUrl = `/classroom/${sessionId}`;

    const scheduledTime = session.scheduledStart
      ? new Date(session.scheduledStart).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '';

    const enrolledCount =
      session.schedule?.scheduleStudents?.length ||
      (session.studentId ? 1 : 0) ||
      session.attendances?.length ||
      0;

    const studentParentIds = Array.from(new Set([...studentUserIds, ...parentUserIds]));

    const learnerBody = scheduledTime
      ? `${teacherName}'s ${className} class has begun. Scheduled at ${scheduledTime}. Tap to join!`
      : `${teacherName}'s ${className} class has begun. Tap to join now!`;

    const learnerPayload = {
      title: 'Class Started — Nejah',
      body: learnerBody,
      icon: '/logo.png',
      badge: '/logo.png',
      url: classroomUrl,
      tag: `session-${sessionId}`,
      data: {
        sessionId,
        url: classroomUrl,
        joinUrl,
        channel: 'MEETING_STARTED',
        className,
        teacherName,
        scheduledTime,
      },
      actions: [
        { action: 'join', title: 'Join Class' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      renotify: true,
    };

    const adminPayload = {
      ...learnerPayload,
      title: 'Session Started — Nejah Admin',
      body: `Teacher ${teacherName} has started ${className}. ${enrolledCount} student(s) enrolled.`,
      url: `/live-sessions/${sessionId}`,
      data: {
        sessionId,
        url: `/live-sessions/${sessionId}`,
        channel: 'MEETING_STARTED',
        className,
        teacherName,
        scheduledTime,
        enrolledCount,
      },
    };

    if (studentParentIds.length > 0) {
      await this.sendCustomNotifications(
        studentParentIds,
        learnerPayload.title,
        learnerPayload.body,
        learnerPayload.data,
        NotificationChannel.MEETING_STARTED,
        false,
        classroomUrl,
      ).catch((err) => {
        this.logger.error('Failed to send in-app notifications to students', err);
        warnings.push('Some in-app notifications could not be delivered');
      });

      const joinUrl_ = meetingLink || joinUrl;

      const studentIds = Array.from(studentUserIds);
      const parentIdsArr = Array.from(parentUserIds);

      if (studentIds.length > 0) {
        await this.telegramService.sendToUsers(studentIds,
          `🎓 ${className} — Class Started\n\n👤 Teacher: ${teacherName}\n\n✅ Tap "Mark Attendance" to record your presence, then tap "Join Meeting" to enter the class.`,
          {
            replyMarkup: {
              inline_keyboard: [
                [{ text: '✅ Mark Attendance', callback_data: `join:${sessionId}` }],
                ...(joinUrl_ ? [[{ text: '▶ Join Meeting', url: joinUrl_ }]] : []),
              ],
            },
          },
        ).catch((err) => {
          this.logger.error('Failed to send Telegram notifications to students', err);
          warnings.push('Some Telegram messages could not be delivered');
        });
      }

      if (parentIdsArr.length > 0) {
        await this.telegramService.sendToUsers(parentIdsArr,
          `🎓 ${className} — Class Started\n\n👤 Teacher: ${teacherName}\n📚 Class: ${className}\n\nYour child's class has started. Tap below to view the session.`,
          joinUrl_
            ? { replyMarkup: { inline_keyboard: [[{ text: '▶ View Session', url: joinUrl_ }]] } }
            : undefined,
        ).catch((err) => {
          this.logger.error('Failed to send Telegram notifications to parents', err);
          warnings.push('Some parent Telegram messages could not be delivered');
        });
      }

      await this.fcmService.sendToUsers(studentParentIds, {
        title: learnerPayload.title,
        body: learnerPayload.body,
        icon: learnerPayload.icon,
        badge: learnerPayload.badge,
        tag: learnerPayload.tag,
        clickAction: learnerPayload.url,
        data: Object.fromEntries(
          Object.entries(learnerPayload.data || {}).map(([k, v]) => [k, String(v)]),
        ),
      });
    }

    const admins = await this.userRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }, { role: UserRole.QIRAT_MANAGER }],
    });
    const adminUserIds = admins.map((admin) => admin.id);

    if (adminUserIds.length > 0) {
      await this.sendCustomNotifications(
        adminUserIds,
        adminPayload.title,
        adminPayload.body,
        adminPayload.data,
        NotificationChannel.MEETING_STARTED,
        false,
        `/live-sessions/${sessionId}`,
      ).catch((err) => {
        this.logger.error('Failed to send in-app notifications to admins', err);
        warnings.push('Some admin notifications could not be delivered');
      });

      const adminJoinUrl = meetingLink || joinUrl;
      await this.telegramService.sendToUsers(adminUserIds,
        `🎓 Session Started — Admin\n\n👤 Teacher: ${teacherName}\n📚 Class: ${className}\n👥 Enrolled: ${enrolledCount}\n🔗 Meeting: ${adminJoinUrl}`,
        adminJoinUrl
          ? { replyMarkup: { inline_keyboard: [[{ text: '▶ View Session', url: adminJoinUrl }]] } }
          : undefined,
      ).catch((err) => {
        this.logger.error('Failed to send Telegram notifications to admins', err);
      });
      await this.fcmService.sendToUsers(adminUserIds, {
        title: adminPayload.title,
        body: adminPayload.body,
        icon: adminPayload.icon,
        badge: adminPayload.badge,
        tag: adminPayload.tag,
        clickAction: adminPayload.url,
        data: Object.fromEntries(
          Object.entries(adminPayload.data || {}).map(([k, v]) => [k, String(v)]),
        ),
      });
    }

    await this.pushSubscriptionService.sendToUserTypes(
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER],
      adminPayload,
    ).catch((err) => {
      this.logger.error('Failed to send push to admin user types', err);
    });

    return {
      studentCount: studentUserIds.size,
      parentCount: parentUserIds.size,
      warnings,
    };
  }

  async notifyResourceAdded(resource: any): Promise<void> {
    // Notify all students if "All Levels", otherwise notify only students with matching level
    let students = [];
    if (resource.learningLevel === 'All Levels') {
      students = await this.studentRepository.find({ where: { user: { isActive: true } }, relations: ['user'] });
    } else {
      students = await this.studentRepository.find({ where: { level: resource.learningLevel, user: { isActive: true } }, relations: ['user'] });
    }

    const recipientIds = students.map(s => s.user?.id).filter(Boolean);
    
    if (recipientIds.length > 0) {
      await this.sendCustomNotifications(
        recipientIds,
        'New Learning Resource',
        `A new ${resource.learningLevel !== 'All Levels' ? resource.learningLevel : ''} resource has been added: ${resource.titleEn || resource.titleAr || resource.titleAm || 'Resource'}`,
        { resourceId: resource.id, type: 'resource_added' },
        NotificationChannel.SYSTEM_ALERT,
        false
      );
    }
  }
}
