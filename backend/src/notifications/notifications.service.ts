import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { AppGateway } from '../websocket/websocket.gateway';
import { PushSubscriptionService } from './push-subscription.service';
import { FcmService } from './fcm.service';
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

    // Get admin and superadmin users
    const admins = await this.userRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
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

  async notifyLiveSessionStarted(session: LiveSession): Promise<void> {
    const studentUserIds = new Set<string>();
    const parentUserIds = new Set<string>();

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

    const className =
      session.schedule?.className || session.metadata?.className || 'Quran Class';
    const teacherName = session.teacher?.fullName || 'Your teacher';
    const sessionId = session.id;
    const joinUrl = session.zoomJoinUrl || `/classroom/${sessionId}`;
    const enrolledCount =
      session.schedule?.scheduleStudents?.length ||
      (session.studentId ? 1 : 0) ||
      session.attendances?.length ||
      0;

    const studentParentIds = Array.from(new Set([...studentUserIds, ...parentUserIds]));

    const learnerPayload = {
      title: '📚 Class Started — Nejah',
      body: `${teacherName}'s ${className} class has begun. Tap to join now!`,
      icon: '/logo.png',
      badge: '/logo.png',
      url: joinUrl,
      tag: `session-${sessionId}`,
      data: {
        sessionId,
        url: joinUrl,
        channel: 'MEETING_STARTED',
        className,
        teacherName,
      },
      actions: [
        { action: 'join', title: '▶ Join Class' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      renotify: true,
    };

    const adminPayload = {
      ...learnerPayload,
      title: '📚 Session Started — Nejah Admin',
      body: `Teacher ${teacherName} has started ${className}. ${enrolledCount} student(s) enrolled.`,
      url: `/live-sessions/${sessionId}`,
      data: {
        sessionId,
        url: `/live-sessions/${sessionId}`,
        channel: 'MEETING_STARTED',
        className,
        teacherName,
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
        true,
      );
      await this.pushSubscriptionService.sendPushToUsers(studentParentIds, learnerPayload);
    }

    const admins = await this.userRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
    });
    const adminUserIds = admins.map((admin) => admin.id);

    if (adminUserIds.length > 0) {
      await this.sendCustomNotifications(
        adminUserIds,
        adminPayload.title,
        adminPayload.body,
        adminPayload.data,
        NotificationChannel.MEETING_STARTED,
        true,
      );
      await this.pushSubscriptionService.sendPushToUsers(adminUserIds, adminPayload);
    }

    await this.pushSubscriptionService.sendToUserTypes(
      [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      adminPayload,
    );
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
        '📚 New Learning Resource',
        `A new ${resource.learningLevel !== 'All Levels' ? resource.learningLevel : ''} resource has been added: ${resource.titleEn || resource.titleAr || resource.titleAm || 'Resource'}`,
        { resourceId: resource.id, type: 'resource_added' },
        NotificationChannel.SYSTEM_ALERT,
        false
      );
    }
  }
}
