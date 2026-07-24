export enum LiveSessionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  EXPIRED = 'EXPIRED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  LEFT_EARLY = 'LEFT_EARLY',
  PARTIAL = 'PARTIAL',
  EXCUSED = 'EXCUSED',
}

export type ApiAttendanceStatus =
  | 'present'
  | 'late'
  | 'left_early'
  | 'partial'
  | 'absent'
  | 'excused';

export function attendanceStatusToApi(status: AttendanceStatus | string): ApiAttendanceStatus {
  switch (status) {
    case AttendanceStatus.PRESENT:
    case 'PRESENT':
      return 'present';
    case AttendanceStatus.LATE:
    case 'LATE':
      return 'late';
    case AttendanceStatus.LEFT_EARLY:
    case 'LEFT_EARLY':
      return 'left_early';
    case AttendanceStatus.PARTIAL:
    case 'PARTIAL':
      return 'partial';
    case AttendanceStatus.EXCUSED:
    case 'EXCUSED':
      return 'excused';
    default:
      return 'absent';
  }
}

export function apiStatusToAttendanceStatus(status: string): AttendanceStatus {
  switch (status?.toLowerCase()) {
    case 'present':
      return AttendanceStatus.PRESENT;
    case 'late':
      return AttendanceStatus.LATE;
    case 'left_early':
      return AttendanceStatus.LEFT_EARLY;
    case 'partial':
      return AttendanceStatus.PARTIAL;
    case 'excused':
      return AttendanceStatus.EXCUSED;
    default:
      return AttendanceStatus.ABSENT;
  }
}
