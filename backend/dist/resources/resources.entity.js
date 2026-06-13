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
exports.Resource = exports.ResourceStatus = exports.ResourceCategory = void 0;
const typeorm_1 = require("typeorm");
const user_role_enum_1 = require("../common/enums/user-role.enum");
var ResourceCategory;
(function (ResourceCategory) {
    ResourceCategory["QURAN_RESOURCES"] = "Quran Resources";
    ResourceCategory["QAIDA_NOORANIYA"] = "Qaida Nooraniya";
    ResourceCategory["TAJWEED_MATERIALS"] = "Tajweed Materials";
    ResourceCategory["ISLAMIC_STUDIES"] = "Islamic Studies Materials";
    ResourceCategory["CLASS_MATERIALS"] = "Class Materials";
})(ResourceCategory || (exports.ResourceCategory = ResourceCategory = {}));
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["ACTIVE"] = "active";
    ResourceStatus["INACTIVE"] = "inactive";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
let Resource = class Resource {
};
exports.Resource = Resource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Resource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Resource.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Resource.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ResourceCategory }),
    __metadata("design:type", String)
], Resource.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Resource.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_role_enum_1.UserRole }),
    __metadata("design:type", String)
], Resource.prototype, "createdByRole", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Resource.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.ACTIVE }),
    __metadata("design:type", String)
], Resource.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Resource.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Resource.prototype, "downloadCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Resource.prototype, "lastDownloadedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Resource.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Resource.prototype, "updatedAt", void 0);
exports.Resource = Resource = __decorate([
    (0, typeorm_1.Entity)('resources')
], Resource);
//# sourceMappingURL=resources.entity.js.map