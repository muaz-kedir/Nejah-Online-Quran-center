import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { TeacherNote } from '../teachers/entities/teacher-note.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import { SessionMeeting } from '../sessions/entities/session-meeting.entity';
import { StudentSessionAttendance } from '../sessions/entities/student-session-attendance.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { StudentLevelHistory } from '../progress/entities/level-history.entity';
import { ProgressionSettings } from '../progress/entities/progression-settings.entity';
import { Exam } from '../exams/entities/exam.entity';
import { ExamEvaluation } from '../exams/entities/exam-evaluation.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Message } from '../messages/messages.entity';
import { Resource } from '../resources/resources.entity';
import { ResourceDownload } from '../resources/resource-download.entity';
import { PushSubscription } from '../notifications/entities/push-subscription.entity';
import { FcmToken } from '../notifications/entities/fcm-token.entity';
import { TeacherApplication } from '../teacher-applications/entities/teacher-application.entity';
import { TeacherApplicationSettings } from '../teacher-applications/entities/teacher-application-settings.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { TeacherReplacementAudit } from '../teacher-replacements/entities/teacher-replacement-audit.entity';
import { ReplacementScheduleOverride } from '../teacher-replacements/entities/replacement-schedule-override.entity';
import { FamilyBillingGroup } from '../finance/entities/family-billing-group.entity';
import { FamilyBillingMember } from '../finance/entities/family-billing-member.entity';
import { PaymentTransaction } from '../finance/entities/payment-transaction.entity';
import { StudentFeeAccount } from '../finance/entities/student-fee-account.entity';
import { TeacherPayrollRecord } from '../finance/entities/teacher-payroll-record.entity';
import { TeacherEarningDetail } from '../finance/entities/teacher-earning-detail.entity';
import { LearningGoal } from '../learning-goals/entities/learning-goal.entity';
import { FeeConfig } from '../fee-config/entities/fee-config.entity';
import { CurrencyRate } from '../currency/entities/currency-rate.entity';
import { ZoomIntegration } from '../zoom/entities/zoom-integration.entity';
import { ZoomPlatformConfig } from '../zoom/entities/zoom-platform-config.entity';
import { LiveSession } from '../zoom/entities/live-session.entity';
import { SessionAttendance } from '../zoom/entities/session-attendance.entity';
import { SessionNote } from '../zoom/entities/session-note.entity';
import { ProcessedWebhook } from '../zoom/entities/processed-webhook.entity';
import { HomeMissionSection } from '../website-cms/entities/home-mission-section.entity';
import { HomeMissionCard } from '../website-cms/entities/home-mission-card.entity';
import { HomeProgramsSection } from '../website-cms/entities/home-programs-section.entity';
import { HomeProgram } from '../website-cms/entities/home-program.entity';
import { Testimonial } from '../website-cms/entities/testimonial.entity';
import { SupportPage } from '../support-pages/entities/support-page.entity';
import { SitemapItem } from '../support-pages/entities/sitemap-item.entity';
import { HelpCategory } from '../support-pages/entities/help-category.entity';
import { HelpArticle } from '../support-pages/entities/help-article.entity';
import { ArticleFeedback } from '../support-pages/entities/article-feedback.entity';
import { ArticleVersion } from '../support-pages/entities/article-version.entity';
import { SupportTicket } from '../support-pages/entities/support-ticket.entity';

/** Every TypeORM entity — explicit registration avoids missing relation metadata on Render. */
export const ALL_ENTITIES = [
  User,
  Student,
  Teacher,
  TeacherNote,
  Parent,
  Attendance,
  ClassSession,
  StudentAttendance,
  Schedule,
  ScheduleStudent,
  SessionMeeting,
  StudentSessionAttendance,
  Homework,
  Progress,
  ProgressLog,
  Feedback,
  StudentLevelHistory,
  ProgressionSettings,
  Exam,
  ExamEvaluation,
  Notification,
  Message,
  Resource,
  ResourceDownload,
  PushSubscription,
  FcmToken,
  TeacherApplication,
  TeacherApplicationSettings,
  TeacherReplacement,
  TeacherReplacementAudit,
  ReplacementScheduleOverride,
  FamilyBillingGroup,
  FamilyBillingMember,
  PaymentTransaction,
  StudentFeeAccount,
  TeacherPayrollRecord,
  TeacherEarningDetail,
  LearningGoal,
  FeeConfig,
  CurrencyRate,
  ZoomIntegration,
  ZoomPlatformConfig,
  LiveSession,
  SessionAttendance,
  SessionNote,
  ProcessedWebhook,
  HomeMissionSection,
  HomeMissionCard,
  HomeProgramsSection,
  HomeProgram,
  Testimonial,
  SupportPage,
  SitemapItem,
  HelpCategory,
  HelpArticle,
  ArticleFeedback,
  ArticleVersion,
  SupportTicket,
];
