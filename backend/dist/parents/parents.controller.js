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
exports.ParentsController = void 0;
const common_1 = require("@nestjs/common");
const parents_service_1 = require("./parents.service");
const create_parent_dto_1 = require("./dto/create-parent.dto");
const update_parent_dto_1 = require("./dto/update-parent.dto");
const query_parent_dto_1 = require("./dto/query-parent.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let ParentsController = class ParentsController {
    constructor(parentsService) {
        this.parentsService = parentsService;
    }
    create(createParentDto) {
        return this.parentsService.create(createParentDto);
    }
    findAll(queryDto) {
        return this.parentsService.findAll(queryDto);
    }
    search(search) {
        return this.parentsService.search(search);
    }
    getStats() {
        return this.parentsService.getStats();
    }
    findOne(id) {
        return this.parentsService.findOne(id);
    }
    getParentStudents(id) {
        return this.parentsService.getParentStudents(id);
    }
    update(id, updateParentDto) {
        return this.parentsService.update(id, updateParentDto);
    }
    remove(id) {
        return this.parentsService.remove(id);
    }
};
exports.ParentsController = ParentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_parent_dto_1.CreateParentDto]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_parent_dto_1.QueryParentDto]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/students'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "getParentStudents", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_parent_dto_1.UpdateParentDto]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParentsController.prototype, "remove", null);
exports.ParentsController = ParentsController = __decorate([
    (0, common_1.Controller)('parents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [parents_service_1.ParentsService])
], ParentsController);
//# sourceMappingURL=parents.controller.js.map