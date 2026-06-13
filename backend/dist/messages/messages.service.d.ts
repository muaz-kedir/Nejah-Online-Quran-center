import { Repository } from 'typeorm';
import { Message } from './messages.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
export declare class MessagesService {
    private messagesRepository;
    private studentRepository;
    private teacherRepository;
    private parentRepository;
    private userRepository;
    constructor(messagesRepository: Repository<Message>, studentRepository: Repository<Student>, teacherRepository: Repository<Teacher>, parentRepository: Repository<Parent>, userRepository: Repository<User>);
    getConversations(userId: string, userRole: UserRole): Promise<any[]>;
    getMessages(fromId: string, toId: string, fromRole: UserRole, toRole: UserRole): Promise<Message[]>;
    sendMessage(fromId: string, fromRole: UserRole, toId: string, toRole: UserRole, subject: string, body: string, attachments?: string): Promise<Message>;
    markAsRead(messageId: string): Promise<void>;
    markAllAsRead(userId: string, userRole: UserRole): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    private getOtherPartyInfo;
    getStudentConversation(partnerId: string, partnerRole: UserRole, studentId: string): Promise<Message[]>;
    countUnreadMessages(userId: string, userRole: UserRole): Promise<number>;
}
