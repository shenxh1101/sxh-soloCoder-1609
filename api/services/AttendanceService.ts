import attendanceRepository from '../repositories/AttendanceRepository';
import type { AttendanceSubmitRequest } from '../../shared/types';

export class AttendanceService {
  submitAttendance(data: AttendanceSubmitRequest, operatorId: number | null = null) {
    return attendanceRepository.submitAttendance(
      data.classId,
      data.attendanceDate,
      data.records,
      operatorId
    );
  }

  getClassAttendance(classId: number, date?: string) {
    return attendanceRepository.getClassAttendance(classId, date);
  }

  getStudentAttendance(studentId: number) {
    return attendanceRepository.getStudentAttendance(studentId);
  }

  getAttendanceStatistics(classId: number) {
    return attendanceRepository.getStatistics(classId);
  }

  hasAttendanceForDate(classId: number, date: string) {
    return attendanceRepository.checkExists(classId, date);
  }
}

export default new AttendanceService();
