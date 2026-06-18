import attendanceRepository from '../repositories/AttendanceRepository';
import type { AttendanceSubmitRequest } from '../../shared/types';

export class AttendanceService {
  submitAttendance(data: AttendanceSubmitRequest) {
    return attendanceRepository.submitAttendance(
      data.classId,
      data.attendanceDate,
      data.records
    );
  }

  getClassAttendance(classId: number, date?: string) {
    return attendanceRepository.getClassAttendance(classId, date);
  }

  getStudentAttendance(studentId: number) {
    return attendanceRepository.getStudentAttendance(studentId);
  }

  getAttendanceStatistics(classId: number) {
    return attendanceRepository.getAttendanceStatistics(classId);
  }

  getParentAttendanceRecords(parentPhone: string) {
    return attendanceRepository.getParentAttendanceRecords(parentPhone);
  }

  hasAttendanceForDate(classId: number, date: string) {
    return attendanceRepository.hasAttendanceForDate(classId, date);
  }
}

export default new AttendanceService();
