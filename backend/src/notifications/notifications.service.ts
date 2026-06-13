import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ClassSession } from '../attendance/entities/class-session.entity';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from './entities/notification.entity';

export interface NotificationPayload {
  type: 'meeting_started' | 'meeting_ended' | 'attendance_recorded' | 'class_cancelled';
  title: string;
  message: string;
  data: any;
  recipientIds: string[];
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
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
      const notificationsToSave = uniqueRecipientIds.map((userId) => {
        return this.notificationRepository.create({
          userId,
          type: NotificationType.IN_APP,
          channel,
          title: payload.title,
          content: payload.message,
          dataJson: payload.data,
          isRead: false,
          sentAt: new Date(),
        });
      });
      await this.notificationRepository.save(notificationsToSave);
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
      await this.notificationRepository.save(notification);
    }
  }

  async sendCustomNotifications(
    recipientIds: string[],
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!recipientIds.length) return;

    const uniqueRecipientIds = Array.from(new Set(recipientIds));
    const notificationsToSave = uniqueRecipientIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type: NotificationType.IN_APP,
        channel: NotificationChannel.SYSTEM_ALERT,
        title,
        content: message,
        dataJson: data,
        isRead: false,
        sentAt: new Date(),
      }),
    );
    await this.notificationRepository.save(notificationsToSave);
  }
}
