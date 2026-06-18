import { getDb } from '../db';
import type { HourlyLog } from '../../shared/types';

class HourlyLogRepository {
  private db = getDb();

  createLog(
    studentId: number,
    courseId: number,
    classId: number | null,
    changeType: 'deduct' | 'refund' | 'enroll' | 'manual',
    changeAmount: number,
    balanceAfter: number,
    reason: string,
    operatorId: number | null = null,
    relatedAttendanceId: number | null = null
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO hourly_logs (student_id, course_id, class_id, change_type, change_amount, balance_after, reason, operator_id, related_attendance_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      studentId,
      courseId,
      classId,
      changeType,
      changeAmount,
      balanceAfter,
      reason,
      operatorId,
      relatedAttendanceId
    );
    return Number(result.lastInsertRowid);
  }

  findByStudentId(studentId: number): HourlyLog[] {
    const stmt = this.db.prepare(`
      SELECT 
        hl.id,
        hl.student_id as studentId,
        s.name as studentName,
        hl.course_id as courseId,
        c.name as courseName,
        hl.class_id as classId,
        cl.name as className,
        hl.change_type as changeType,
        hl.change_amount as changeAmount,
        hl.balance_after as balanceAfter,
        hl.reason,
        hl.operator_id as operatorId,
        u.name as operatorName,
        hl.related_attendance_id as relatedAttendanceId,
        hl.created_at as createdAt
      FROM hourly_logs hl
      LEFT JOIN students s ON hl.student_id = s.id
      LEFT JOIN courses c ON hl.course_id = c.id
      LEFT JOIN classes cl ON hl.class_id = cl.id
      LEFT JOIN users u ON hl.operator_id = u.id
      WHERE hl.student_id = ?
      ORDER BY hl.created_at DESC
    `);
    return stmt.all(studentId) as HourlyLog[];
  }

  findByParentPhone(parentPhone: string): HourlyLog[] {
    const stmt = this.db.prepare(`
      SELECT 
        hl.id,
        hl.student_id as studentId,
        s.name as studentName,
        hl.course_id as courseId,
        c.name as courseName,
        hl.class_id as classId,
        cl.name as className,
        hl.change_type as changeType,
        hl.change_amount as changeAmount,
        hl.balance_after as balanceAfter,
        hl.reason,
        hl.operator_id as operatorId,
        u.name as operatorName,
        hl.related_attendance_id as relatedAttendanceId,
        hl.created_at as createdAt
      FROM hourly_logs hl
      LEFT JOIN students s ON hl.student_id = s.id
      LEFT JOIN courses c ON hl.course_id = c.id
      LEFT JOIN classes cl ON hl.class_id = cl.id
      LEFT JOIN users u ON hl.operator_id = u.id
      WHERE s.parent_phone = ?
      ORDER BY hl.created_at DESC
    `);
    return stmt.all(parentPhone) as HourlyLog[];
  }

  findAll(): HourlyLog[] {
    const stmt = this.db.prepare(`
      SELECT 
        hl.id,
        hl.student_id as studentId,
        s.name as studentName,
        hl.course_id as courseId,
        c.name as courseName,
        hl.class_id as classId,
        cl.name as className,
        hl.change_type as changeType,
        hl.change_amount as changeAmount,
        hl.balance_after as balanceAfter,
        hl.reason,
        hl.operator_id as operatorId,
        u.name as operatorName,
        hl.related_attendance_id as relatedAttendanceId,
        hl.created_at as createdAt
      FROM hourly_logs hl
      LEFT JOIN students s ON hl.student_id = s.id
      LEFT JOIN courses c ON hl.course_id = c.id
      LEFT JOIN classes cl ON hl.class_id = cl.id
      LEFT JOIN users u ON hl.operator_id = u.id
      ORDER BY hl.created_at DESC
      LIMIT 500
    `);
    return stmt.all() as HourlyLog[];
  }

  getEnrollmentByStudentAndCourse(studentId: number, courseId: number) {
    const stmt = this.db.prepare(`
      SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
    `);
    return stmt.get(studentId, courseId) as any;
  }
}

export default new HourlyLogRepository();
