"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionNoteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_note_entity_1 = require("./entities/session-note.entity");
let SessionNoteService = class SessionNoteService {
    constructor(sessionNoteRepository) {
        this.sessionNoteRepository = sessionNoteRepository;
    }
    async create(dto) {
        const note = this.sessionNoteRepository.create({
            sessionId: dto.sessionId,
            teacherId: dto.teacherId,
            content: dto.content,
        });
        return this.sessionNoteRepository.save(note);
    }
    async update(id, teacherId, dto) {
        const note = await this.sessionNoteRepository.findOne({ where: { id } });
        if (!note) {
            throw new common_1.NotFoundException('Session note not found');
        }
        if (note.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only edit your own notes');
        }
        if (dto.content !== undefined) {
            note.content = dto.content;
        }
        return this.sessionNoteRepository.save(note);
    }
    async findBySession(sessionId) {
        return this.sessionNoteRepository.find({
            where: { sessionId },
            relations: ['teacher'],
            order: { createdAt: 'DESC' },
        });
    }
    async delete(id, teacherId) {
        const note = await this.sessionNoteRepository.findOne({ where: { id } });
        if (!note) {
            throw new common_1.NotFoundException('Session note not found');
        }
        if (note.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only delete your own notes');
        }
        await this.sessionNoteRepository.remove(note);
    }
};
exports.SessionNoteService = SessionNoteService;
exports.SessionNoteService = SessionNoteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_note_entity_1.SessionNote)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SessionNoteService);
//# sourceMappingURL=session-note.service.js.map