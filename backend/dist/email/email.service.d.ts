import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    private fromAddress;
    constructor(configService: ConfigService);
    private send;
    private wrap;
    sendApplicationReceived(to: string, applicantName: string, applicationNumber: string): Promise<void>;
    sendApplicationApproved(to: string, applicantName: string, loginEmail: string, temporaryPassword: string): Promise<void>;
    sendApplicationRejected(to: string, applicantName: string, reason: string): Promise<void>;
    sendMoreInfoRequired(to: string, applicantName: string, message: string): Promise<void>;
}
