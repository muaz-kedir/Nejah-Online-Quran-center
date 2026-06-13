"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtDate = fmtDate;
exports.currentBillingMonth = currentBillingMonth;
exports.startOfMonthDate = startOfMonthDate;
exports.endOfMonthDate = endOfMonthDate;
exports.startOfWeekDate = startOfWeekDate;
exports.endOfWeekDate = endOfWeekDate;
exports.startOfYearDate = startOfYearDate;
exports.endOfYearDate = endOfYearDate;
exports.addDaysDate = addDaysDate;
exports.parseDateStr = parseDateStr;
exports.isBeforeDate = isBeforeDate;
function fmtDate(d) {
    return d.toISOString().slice(0, 10);
}
function currentBillingMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function startOfMonthDate(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonthDate(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfWeekDate(d) {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const result = new Date(d);
    result.setDate(d.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
}
function endOfWeekDate(d) {
    const start = startOfWeekDate(d);
    const result = new Date(start);
    result.setDate(start.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
}
function startOfYearDate(d) {
    return new Date(d.getFullYear(), 0, 1);
}
function endOfYearDate(d) {
    return new Date(d.getFullYear(), 11, 31);
}
function addDaysDate(d, days) {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
}
function parseDateStr(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function isBeforeDate(a, b) {
    return parseDateStr(a) < b;
}
//# sourceMappingURL=finance-date.util.js.map