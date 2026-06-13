"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceStatus = exports.LiveSessionStatus = void 0;
var LiveSessionStatus;
(function (LiveSessionStatus) {
    LiveSessionStatus["SCHEDULED"] = "SCHEDULED";
    LiveSessionStatus["LIVE"] = "LIVE";
    LiveSessionStatus["COMPLETED"] = "COMPLETED";
    LiveSessionStatus["CANCELLED"] = "CANCELLED";
})(LiveSessionStatus || (exports.LiveSessionStatus = LiveSessionStatus = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "PRESENT";
    AttendanceStatus["ABSENT"] = "ABSENT";
    AttendanceStatus["LATE"] = "LATE";
    AttendanceStatus["LEFT_EARLY"] = "LEFT_EARLY";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
//# sourceMappingURL=live-session-status.enum.js.map