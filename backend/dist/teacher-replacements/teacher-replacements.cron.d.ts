import { TeacherReplacementsService } from './teacher-replacements.service';
export declare class TeacherReplacementsCron {
    private readonly replacementsService;
    constructor(replacementsService: TeacherReplacementsService);
    handleLifecycle(): Promise<void>;
}
