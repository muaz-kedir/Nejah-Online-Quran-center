import { Repository } from 'typeorm';
import { Resource, ResourceCategory } from './resources.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { User } from '../users/entities/user.entity';
export declare class ResourcesService {
    private resourcesRepository;
    private studentRepository;
    private teacherRepository;
    private userRepository;
    constructor(resourcesRepository: Repository<Resource>, studentRepository: Repository<Student>, teacherRepository: Repository<Teacher>, userRepository: Repository<User>);
    findAll(studentId?: string, search?: string, category?: ResourceCategory): Promise<Resource[]>;
    findOne(id: string): Promise<Resource>;
    incrementDownloadCount(id: string): Promise<Resource>;
    create(dto: Partial<Resource>): Promise<Resource>;
    update(id: string, dto: Partial<Resource>): Promise<Resource>;
    remove(id: string): Promise<void>;
    getCategories(): Promise<ResourceCategory[]>;
}
