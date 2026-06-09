export function getScheduleStudentLabel(schedule: {
  isGroupSession?: boolean;
  student?: { fullName?: string };
  scheduleStudents?: Array<{ student?: { fullName?: string } }>;
}): { name: string; avatar: string } {
  if (schedule.isGroupSession) {
    const names = (schedule.scheduleStudents || [])
      .map((ss) => ss.student?.fullName)
      .filter(Boolean) as string[];

    if (names.length === 0) {
      return { name: 'Group Session', avatar: 'G' };
    }

    if (names.length <= 2) {
      return { name: names.join(', '), avatar: 'G' };
    }

    return {
      name: `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`,
      avatar: 'G',
    };
  }

  const studentName = schedule.student?.fullName || 'Unknown Student';
  return { name: studentName, avatar: studentName.charAt(0) };
}

export function getScheduleSearchText(schedule: {
  isGroupSession?: boolean;
  student?: { fullName?: string };
  studentId?: string;
  scheduleStudents?: Array<{ student?: { fullName?: string } }>;
}): string {
  if (schedule.isGroupSession) {
    return (schedule.scheduleStudents || [])
      .map((ss) => ss.student?.fullName)
      .filter(Boolean)
      .join(' ');
  }

  return schedule.student?.fullName || schedule.studentId || '';
}
