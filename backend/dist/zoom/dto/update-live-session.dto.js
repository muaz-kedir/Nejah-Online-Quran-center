"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLiveSessionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_live_session_dto_1 = require("./create-live-session.dto");
class UpdateLiveSessionDto extends (0, mapped_types_1.PartialType)(create_live_session_dto_1.CreateLiveSessionDto) {
}
exports.UpdateLiveSessionDto = UpdateLiveSessionDto;
//# sourceMappingURL=update-live-session.dto.js.map