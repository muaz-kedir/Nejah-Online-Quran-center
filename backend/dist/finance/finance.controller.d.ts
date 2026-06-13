import { FinanceService } from './finance.service';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { RecordPaymentDto, UpdateStudentFeeDto, BundleFamilyDto, GeneratePayrollDto } from './dto/record-payment.dto';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getDashboard(): Promise<{
        totalMonthlyRevenue: number;
        totalCollectedPayments: number;
        totalOutstandingPayments: number;
        totalActivePayingStudents: number;
        totalActiveFamilies: number;
        totalTeacherPayroll: number;
        paymentsDueThisWeek: number;
        overduePayments: number;
        billingMonth: string;
        recentTransactions: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            transactionDate: string;
            description: string;
        }[];
    }>;
    syncAccounts(billingMonth?: string): Promise<{
        synced: number;
    }>;
    getStudentPayments(query: FinanceQueryDto): Promise<{
        data: {
            id: string;
            studentId: string;
            studentName: string;
            parentName: string;
            teacherName: string;
            program: string;
            monthlyFee: number;
            amountPaid: number;
            remainingBalance: number;
            status: import("../common/enums/payment-status.enum").PaymentStatus;
            dueDate: string;
            billingMonth: string;
            isFamilyBundled: boolean;
            country: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStudentPaymentDetail(id: string): Promise<{
        registrationDate: Date;
        weeklySchedule: {
            day: string;
            startTime: string;
            endTime: string;
            className: string;
        }[];
        sessionDurationMinutes: number;
        monthlySessions: number;
        sessionRate: number;
        discountAmount: number;
        scholarshipAmount: number;
        paymentHistory: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            description: string;
            paymentMethod: string;
            transactionDate: string;
            createdAt: Date;
        }[];
        id: string;
        studentId: string;
        studentName: string;
        parentName: string;
        teacherName: string;
        program: string;
        monthlyFee: number;
        amountPaid: number;
        remainingBalance: number;
        status: import("../common/enums/payment-status.enum").PaymentStatus;
        dueDate: string;
        billingMonth: string;
        isFamilyBundled: boolean;
        country: string;
    }>;
    recordStudentPayment(id: string, dto: RecordPaymentDto, user: {
        id: string;
    }): Promise<{
        registrationDate: Date;
        weeklySchedule: {
            day: string;
            startTime: string;
            endTime: string;
            className: string;
        }[];
        sessionDurationMinutes: number;
        monthlySessions: number;
        sessionRate: number;
        discountAmount: number;
        scholarshipAmount: number;
        paymentHistory: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            description: string;
            paymentMethod: string;
            transactionDate: string;
            createdAt: Date;
        }[];
        id: string;
        studentId: string;
        studentName: string;
        parentName: string;
        teacherName: string;
        program: string;
        monthlyFee: number;
        amountPaid: number;
        remainingBalance: number;
        status: import("../common/enums/payment-status.enum").PaymentStatus;
        dueDate: string;
        billingMonth: string;
        isFamilyBundled: boolean;
        country: string;
    }>;
    updateStudentFee(id: string, dto: UpdateStudentFeeDto): Promise<{
        registrationDate: Date;
        weeklySchedule: {
            day: string;
            startTime: string;
            endTime: string;
            className: string;
        }[];
        sessionDurationMinutes: number;
        monthlySessions: number;
        sessionRate: number;
        discountAmount: number;
        scholarshipAmount: number;
        paymentHistory: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            description: string;
            paymentMethod: string;
            transactionDate: string;
            createdAt: Date;
        }[];
        id: string;
        studentId: string;
        studentName: string;
        parentName: string;
        teacherName: string;
        program: string;
        monthlyFee: number;
        amountPaid: number;
        remainingBalance: number;
        status: import("../common/enums/payment-status.enum").PaymentStatus;
        dueDate: string;
        billingMonth: string;
        isFamilyBundled: boolean;
        country: string;
    }>;
    getFamilyPayments(query: FinanceQueryDto): Promise<{
        data: ({
            type: "separate";
            parentId: string;
            parentName: string;
            children: {
                studentId: string;
                studentName: string;
                monthlyFee: number;
                status: import("../common/enums/payment-status.enum").PaymentStatus;
                registrationDate: Date;
            }[];
            monthlyTotal: number;
            status: import("../common/enums/payment-status.enum").PaymentStatus;
        } | {
            type: "bundled";
            id: string;
            parentId: string;
            parentName: string;
            children: {
                studentId: string;
                studentName: string;
                monthlyFee: number;
            }[];
            monthlyTotal: number;
            amountPaid: number;
            remainingBalance: number;
            status: import("../common/enums/payment-status.enum").PaymentStatus;
            dueDate: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    bundleFamily(dto: BundleFamilyDto): Promise<{
        id: string;
        parentId: string;
        parentName: string;
        monthlyTotal: number;
        amountPaid: number;
        remainingBalance: number;
        discountAmount: number;
        scholarshipAmount: number;
        status: import("../common/enums/payment-status.enum").PaymentStatus;
        dueDate: string;
        billingMonth: string;
        children: {
            studentId: string;
            studentName: string;
            monthlyFee: number;
        }[];
        paymentHistory: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            transactionDate: string;
            description: string;
        }[];
    }>;
    getFamilyPaymentDetail(id: string): Promise<{
        id: string;
        parentId: string;
        parentName: string;
        monthlyTotal: number;
        amountPaid: number;
        remainingBalance: number;
        discountAmount: number;
        scholarshipAmount: number;
        status: import("../common/enums/payment-status.enum").PaymentStatus;
        dueDate: string;
        billingMonth: string;
        children: {
            studentId: string;
            studentName: string;
            monthlyFee: number;
        }[];
        paymentHistory: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            transactionDate: string;
            description: string;
        }[];
    }>;
    recordFamilyPayment(id: string, dto: RecordPaymentDto, user: {
        id: string;
    }): Promise<{
        id: string;
        parentId: string;
        parentName: string;
        monthlyTotal: number;
        amountPaid: number;
        remainingBalance: number;
        discountAmount: number;
        scholarshipAmount: number;
        status: import("../common/enums/payment-status.enum").PaymentStatus;
        dueDate: string;
        billingMonth: string;
        children: {
            studentId: string;
            studentName: string;
            monthlyFee: number;
        }[];
        paymentHistory: {
            id: string;
            amount: number;
            type: import("../common/enums/transaction-type.enum").TransactionType;
            transactionDate: string;
            description: string;
        }[];
    }>;
    getTeacherPayments(query: FinanceQueryDto): Promise<{
        data: {
            teacherId: string;
            teacherName: string;
            totalAssignedStudents: number;
            sessionsConducted: number;
            sessionRate: number;
            earnings: number;
            payrollStatus: string;
            monthlySalary: number;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTeacherPaymentDetail(teacherId: string, billingMonth?: string): Promise<{
        monthlySalary: number;
        assignedStudents: {
            studentId: string;
            sessionsConducted: number;
            sessionRate: number;
            earnings: number;
            isReplacement: boolean;
            replacementId: string;
            studentName: string;
        }[];
        monthlySummary: {
            totalStudents: number;
            totalSessions: number;
            totalEarnings: number;
        };
        payroll: {
            id: string;
            status: string;
            totalEarnings: number;
            paidAt: Date;
        };
        teacherId: string;
        teacherName: string;
        sessionsConducted: number;
        sessionRate: number;
        earnings: number;
        billingMonth: string;
        details: {
            studentId: string;
            sessionsConducted: number;
            sessionRate: number;
            earnings: number;
            isReplacement: boolean;
            replacementId: string;
        }[];
        replacements: {
            id: string;
            studentId: string;
            originalTeacherId: string;
            replacementTeacherId: string;
            startDate: string;
            endDate: string;
            status: import("../common/enums/replacement-status.enum").ReplacementStatus;
        }[];
    }>;
    generatePayroll(dto: GeneratePayrollDto): Promise<{
        billingMonth: string;
        generated: number;
        records: import("./entities/teacher-payroll-record.entity").TeacherPayrollRecord[];
    }>;
    getRevenueAnalytics(query: FinanceQueryDto): Promise<{
        dailyRevenue: number;
        weeklyRevenue: number;
        monthlyRevenue: number;
        annualRevenue: number;
        revenueTrends: {
            month: string;
            revenue: number;
        }[];
        collectionTrends: {
            date: string;
            collected: number;
        }[];
        outstandingTrends: {
            month: string;
            outstanding: number;
        }[];
        payrollTrends: {
            month: string;
            payroll: number;
        }[];
    }>;
    getFinancialReport(type: string, query: FinanceQueryDto): Promise<{
        paidFamilies: number;
        unpaidFamilies: number;
        outstandingBalances: any;
        details: ({
            type: "separate";
            parentId: string;
            parentName: string;
            children: {
                studentId: string;
                studentName: string;
                monthlyFee: number;
                status: import("../common/enums/payment-status.enum").PaymentStatus;
                registrationDate: Date;
            }[];
            monthlyTotal: number;
            status: import("../common/enums/payment-status.enum").PaymentStatus;
        } | {
            type: "bundled";
            id: string;
            parentId: string;
            parentName: string;
            children: {
                studentId: string;
                studentName: string;
                monthlyFee: number;
            }[];
            monthlyTotal: number;
            amountPaid: number;
            remainingBalance: number;
            status: import("../common/enums/payment-status.enum").PaymentStatus;
            dueDate: string;
        })[];
        paidStudents?: undefined;
        unpaidStudents?: undefined;
        overdueStudents?: undefined;
        teacherEarnings?: undefined;
        monthlyPayroll?: undefined;
        replacementPayroll?: undefined;
        totalRevenue?: undefined;
        monthlyRevenue?: undefined;
        collectionRate?: undefined;
    } | {
        paidStudents: number;
        unpaidStudents: number;
        overdueStudents: number;
        details: {
            id: string;
            studentId: string;
            studentName: string;
            parentName: string;
            teacherName: string;
            program: string;
            monthlyFee: number;
            amountPaid: number;
            remainingBalance: number;
            status: import("../common/enums/payment-status.enum").PaymentStatus;
            dueDate: string;
            billingMonth: string;
            isFamilyBundled: boolean;
            country: string;
        }[];
        paidFamilies?: undefined;
        unpaidFamilies?: undefined;
        outstandingBalances?: undefined;
        teacherEarnings?: undefined;
        monthlyPayroll?: undefined;
        replacementPayroll?: undefined;
        totalRevenue?: undefined;
        monthlyRevenue?: undefined;
        collectionRate?: undefined;
    } | {
        teacherEarnings: number;
        monthlyPayroll: number;
        replacementPayroll: number;
        details: {
            teacherId: string;
            teacherName: string;
            totalAssignedStudents: number;
            sessionsConducted: number;
            sessionRate: number;
            earnings: number;
            payrollStatus: string;
            monthlySalary: number;
        }[];
        paidFamilies?: undefined;
        unpaidFamilies?: undefined;
        outstandingBalances?: undefined;
        paidStudents?: undefined;
        unpaidStudents?: undefined;
        overdueStudents?: undefined;
        totalRevenue?: undefined;
        monthlyRevenue?: undefined;
        collectionRate?: undefined;
    } | {
        totalRevenue: number;
        monthlyRevenue: number;
        collectionRate: number;
        details: {
            dailyRevenue: number;
            weeklyRevenue: number;
            monthlyRevenue: number;
            annualRevenue: number;
            revenueTrends: {
                month: string;
                revenue: number;
            }[];
            collectionTrends: {
                date: string;
                collected: number;
            }[];
            outstandingTrends: {
                month: string;
                outstanding: number;
            }[];
            payrollTrends: {
                month: string;
                payroll: number;
            }[];
        };
        paidFamilies?: undefined;
        unpaidFamilies?: undefined;
        outstandingBalances?: undefined;
        paidStudents?: undefined;
        unpaidStudents?: undefined;
        overdueStudents?: undefined;
        teacherEarnings?: undefined;
        monthlyPayroll?: undefined;
        replacementPayroll?: undefined;
    }>;
}
