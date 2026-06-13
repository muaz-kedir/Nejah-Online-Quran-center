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
exports.FamilyBillingMember = void 0;
const typeorm_1 = require("typeorm");
const family_billing_group_entity_1 = require("./family-billing-group.entity");
const student_entity_1 = require("../../students/entities/student.entity");
let FamilyBillingMember = class FamilyBillingMember {
};
exports.FamilyBillingMember = FamilyBillingMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FamilyBillingMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FamilyBillingMember.prototype, "familyBillingGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => family_billing_group_entity_1.FamilyBillingGroup, (grp) => grp.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'familyBillingGroupId' }),
    __metadata("design:type", family_billing_group_entity_1.FamilyBillingGroup)
], FamilyBillingMember.prototype, "familyBillingGroup", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FamilyBillingMember.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], FamilyBillingMember.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FamilyBillingMember.prototype, "individualMonthlyFee", void 0);
exports.FamilyBillingMember = FamilyBillingMember = __decorate([
    (0, typeorm_1.Entity)('family_billing_members')
], FamilyBillingMember);
//# sourceMappingURL=family-billing-member.entity.js.map