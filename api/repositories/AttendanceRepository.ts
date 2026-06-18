import { getDb } from '../db';
import type { AttendanceRecord, AttendanceStatistics } from '../../shared/types';

export class AttendanceRepository {
  private db = getDb();

  submitAttendance(classId: number, attendanceDate: string, records: { studentId: number; status: string }[]): boolean {
    const transaction = this.db.transaction((records: any[]) => {
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO attendance_records (class_id, student_id, attendance_date, status)
        VALUES (?, ?, ?, ?)
      `);
      
      const getOldStatusStmt = this.db.prepare(`
        SELECT status FROM attendance_records 
        WHERE class_id = ? AND student_id = ? AND attendance_date = ?
      `);
      
      const addHoursStmt = this.db.prepare(`
        UPDATE enrollments 
        SET remaining_hours = remaining_hours + 1
        WHERE student_id = ? 
          AND course_id = (SELECT course_id FROM classes WHERE id = ?)
          AND is_frozen = 0
      `);
      
      const deductHoursStmt = this.db.prepare(`
        UPDATE enrollments 
        SET remaining_hours = remaining_hours - 1
        WHERE student_id = ? 
          AND course_id = (SELECT course_id FROM classes WHERE id = ?)
          AND is_frozen = 0
          AND remaining_hours > 0
      `);
      
      for (const record of records) {
        const oldRecord = getOldStatusStmt.get(classId, record.studentId, attendanceDate) as { status: string } | undefined;
        const oldStatus = oldRecord?.status;
        
        insertStmt.run(classId, record.studentId, attendanceDate, record.status);
        
        if (oldStatus === 'present' && record.status !== 'present') {
          addHoursStmt.run(record.studentId, classId);
        }
        
        if (oldStatus !== 'present' && record.status === 'present') {
          deductHoursStmt.run(record.studentId, classId);
        }
      }
      
      return records.length;
    });
    
    try {
      transaction(records);
      return true;
    } catch (error) {
      return false;
    }
  }

  getClassAttendance(classId: number, date?: string): AttendanceRecord[] {
    let sql = `
      SELECT 
        ar.*,
        ar.class_id as classId,
        ar.student_id as studentId,
        ar.attendance_date as attendanceDate,
        ar.created_at as createdAt
      FROM attendance_records ar
      WHERE ar.class_id = ?
    `;
    
    const params: any[] = [classId];
    
    if (date) {
      sql += ' AND ar.attendance_date = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY ar.attendance_date DESC, ar.created_at DESC';
    
    return this.db.prepare(sql).all(...params) as AttendanceRecord[];
  }

  getStudentAttendance(studentId: number): AttendanceRecord[] {
    return this.db.prepare(`
      SELECT 
        ar.*,
        ar.class_id as classId,
        ar.student_id as studentId,
        ar.attendance_date as attendanceDate,
        ar.created_at as createdAt
      FROM attendance_records ar
      WHERE ar.student_id = ?
      ORDER BY ar.attendance_date DESC, ar.created_at DESC
    `).all(studentId) as AttendanceRecord[];
  }

  getAttendanceStatistics(classId: number): AttendanceStatistics[] {
    return this.db.prepare(`
      SELECT 
        s.id as studentId,
        s.name as studentName,
        COUNT(DISTINCT ar.attendance_date) as totalClasses,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN ar.status = 'leave' THEN 1 ELSE 0 END) as leaveCount,
        CASE 
          WHEN COUNT(DISTINCT ar.attendance_date) > 0 
          THEN ROUND(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT ar.attendance_date), 2)
          ELSE 0 
        END as attendanceRate
      FROM students s
      LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.class_id = ?
      WHERE s.class_id = ?
      GROUP BY s.id, s.name
      ORDER BY s.name
    `).all(classId, classId) as AttendanceStatistics[];
  }

  getParentAttendanceRecords(parentPhone: string): any[] {
    return this.db.prepare(`
      SELECT 
        ar.id,
        c.name as className,
        ar.attendance_date as attendanceDate,
        ar.status
      FROM attendance_records ar
      JOIN classes c ON ar.class_id = c.id
      JOIN students s ON ar.student_id = s.id
      WHERE s.parent_phone = ?
      ORDER BY ar.attendance_date DESC
      LIMIT 100
    `).all(parentPhone);
  }

  hasAttendanceForDate(classId: number, date: string): boolean {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE class_id = ? AND attendance_date = ?
    `).get(classId, date) as { count: number };
    
    return result.count > 0;
  }
}

export default new AttendanceRepository();
