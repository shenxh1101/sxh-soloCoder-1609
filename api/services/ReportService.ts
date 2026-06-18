import classRepository from '../repositories/ClassRepository';
import attendanceRepository from '../repositories/AttendanceRepository';
import { getDb } from '../db';
import type { ClassRosterReport } from '../../shared/types';

export class ReportService {
  private db = getDb();

  getClassRoster(classId: number): ClassRosterReport | null {
    const cls = classRepository.findById(classId);
    if (!cls) return null;

    const students = this.db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.age,
        s.parent_phone as parentPhone,
        COALESCE(e.remaining_hours, 0) as remainingHours,
        e.enroll_date as enrollDate
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id AND e.course_id = ?
      WHERE s.class_id = ?
      ORDER BY s.name
    `).all(cls.courseId, classId);

    return {
      classId: cls.id,
      className: cls.name,
      courseName: cls.courseName,
      schedule: cls.schedule,
      teacherName: cls.teacherName,
      maxStudents: cls.maxStudents,
      currentStudents: cls.currentStudents,
      students: students as any[]
    };
  }

  getAttendanceReport(classId: number) {
    const cls = classRepository.findById(classId);
    if (!cls) return null;

    const statistics = attendanceRepository.getStatistics(classId);
    
    const dates = this.db.prepare(`
      SELECT DISTINCT attendance_date 
      FROM attendance_records 
      WHERE class_id = ? 
      ORDER BY attendance_date DESC
      LIMIT 30
    `).all(classId) as { attendance_date: string }[];

    const detailedRecords = this.db.prepare(`
      SELECT 
        s.id as studentId,
        s.name as studentName,
        ar.attendance_date,
        ar.status
      FROM students s
      LEFT JOIN attendance_records ar 
        ON s.id = ar.student_id 
        AND ar.class_id = ?
      WHERE s.class_id = ?
      ORDER BY s.name, ar.attendance_date DESC
    `).all(classId, classId);

    return {
      classId: cls.id,
      className: cls.name,
      courseName: cls.courseName,
      teacherName: cls.teacherName,
      dates: dates.map(d => d.attendance_date),
      statistics,
      detailedRecords
    };
  }

  exportClassRosterToCSV(classId: number): string {
    const roster = this.getClassRoster(classId);
    if (!roster) return '';

    const headers = ['序号', '学员姓名', '年龄', '家长电话', '剩余课时', '报名日期'];
    const rows = roster.students.map((s, i) => [
      i + 1,
      s.name,
      s.age,
      s.parentPhone,
      s.remainingHours,
      s.enrollDate
    ]);

    const csv = [
      `班级名称: ${roster.className}`,
      `课程: ${roster.courseName}`,
      `上课时间: ${roster.schedule}`,
      `授课老师: ${roster.teacherName || '未分配'}`,
      `人数: ${roster.currentStudents}/${roster.maxStudents}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  getHourWarnings(): {
    expiringSoon: any[];
    lowHours: any[];
    longAbsent: any[];
  } {
    const expiringSoon = this.db.prepare(`
      SELECT
        s.id as studentId,
        s.name as studentName,
        s.parent_phone as parentPhone,
        s.age,
        s.class_id as classId,
        cl.name as className,
        e.id as enrollmentId,
        e.course_id as courseId,
        c.name as courseName,
        e.remaining_hours as remainingHours,
        e.expire_date as expireDate,
        CAST(julianday(e.expire_date) - julianday(date('now')) AS INTEGER) as daysLeft,
        e.is_frozen as isFrozen
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE e.is_frozen = 0
        AND e.remaining_hours > 0
        AND date(e.expire_date) >= date('now')
        AND CAST(julianday(e.expire_date) - julianday(date('now')) AS INTEGER) <= 30
      ORDER BY daysLeft ASC
    `).all() as any[];

    const lowHours = this.db.prepare(`
      SELECT
        s.id as studentId,
        s.name as studentName,
        s.parent_phone as parentPhone,
        s.age,
        s.class_id as classId,
        cl.name as className,
        e.id as enrollmentId,
        e.course_id as courseId,
        c.name as courseName,
        e.remaining_hours as remainingHours,
        e.expire_date as expireDate,
        CAST(julianday(e.expire_date) - julianday(date('now')) AS INTEGER) as daysLeft,
        e.is_frozen as isFrozen
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE e.is_frozen = 0
        AND e.remaining_hours <= 3
      ORDER BY e.remaining_hours ASC, s.name ASC
    `).all() as any[];

    const longAbsent = this.db.prepare(`
      SELECT
        s.id as studentId,
        s.name as studentName,
        s.parent_phone as parentPhone,
        s.age,
        s.class_id as classId,
        cl.name as className,
        e.id as enrollmentId,
        e.course_id as courseId,
        c.name as courseName,
        e.remaining_hours as remainingHours,
        last_att.lastAttendanceDate,
        CAST(julianday(date('now')) - julianday(COALESCE(last_att.lastAttendanceDate, s.created_at)) AS INTEGER) as daysSince,
        e.is_frozen as isFrozen
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      LEFT JOIN (
        SELECT student_id, MAX(attendance_date) as lastAttendanceDate
        FROM attendance_records
        WHERE status = 'present'
        GROUP BY student_id
      ) last_att ON s.id = last_att.student_id
      WHERE e.is_frozen = 0
        AND CAST(julianday(date('now')) - julianday(COALESCE(last_att.lastAttendanceDate, s.created_at)) AS INTEGER) >= 30
        AND e.remaining_hours > 0
      ORDER BY daysSince DESC
    `).all() as any[];

    return { expiringSoon, lowHours, longAbsent };
  }
}

export default new ReportService();
