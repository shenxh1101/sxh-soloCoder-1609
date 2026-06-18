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
}

export default new ReportService();
