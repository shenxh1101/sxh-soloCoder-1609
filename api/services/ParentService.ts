import studentRepository from '../repositories/StudentRepository';
import attendanceRepository from '../repositories/AttendanceRepository';
import { getDb } from '../db';
import type { ParentStudentInfo, ParentAttendanceRecord } from '../../shared/types';

export class ParentService {
  private db = getDb();

  getStudentInfo(parentPhone: string): ParentStudentInfo[] {
    const students = this.db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.age,
        cl.name as className,
        co.name as courseName,
        e.total_hours as totalHours,
        e.remaining_hours as remainingHours,
        e.expire_date as expireDate,
        e.is_frozen as isFrozen
      FROM students s
      LEFT JOIN classes cl ON s.class_id = cl.id
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN courses co ON e.course_id = co.id
      WHERE s.parent_phone = ?
      ORDER BY s.created_at DESC
    `).all(parentPhone) as ParentStudentInfo[];

    return students;
  }

  getRemainingHours(parentPhone: string) {
    const students = this.getStudentInfo(parentPhone);
    
    return students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      courseName: s.courseName,
      totalHours: s.totalHours,
      remainingHours: s.remainingHours,
      expireDate: s.expireDate,
      isFrozen: s.isFrozen,
      usedHours: s.totalHours - s.remainingHours
    }));
  }

  getAttendanceRecords(parentPhone: string): ParentAttendanceRecord[] {
    return attendanceRepository.getParentAttendanceRecords(parentPhone) as ParentAttendanceRecord[];
  }
}

export default new ParentService();
