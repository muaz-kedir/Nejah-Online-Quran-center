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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parent = exports.ParentStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const student_entity_1 = require("../../students/entities/student.entity");
var ParentStatus;
(function (ParentStatus) {
    ParentStatus["ACTIVE"] = "active";
    ParentStatus["INACTIVE"] = "inactive";
})(ParentStatus || (exports.ParentStatus = ParentStatus = {}));
let Parent = class Parent {
};
exports.Parent = Parent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Parent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Parent.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Parent.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Parent.prototype, "residency", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Parent.prototype, "relationshipWithStudent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ParentStatus, default: ParentStatus.ACTIVE }),
    __metadata("design:type", String)
], Parent.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { cascade: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", user_entity_1.User)
], Parent.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_entity_1.Student, (student) => student.parent, { eager: true }),
    __metadata("design:type", Array)
], Parent.prototype, "students", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Parent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Parent.prototype, "updatedAt", void 0);
exports.Parent = Parent = __decorate([
    (0, typeorm_1.Entity)('parents')
], Parent);
//# sourceMappingURL=parent.entity.js.map