import { getDb } from '../db';
import type { AttendanceRecord, AttendanceStatistics } from '../../shared/types';
import hourlyLogRepository from './HourlyLogRepository';

class AttendanceRepository {
  private db = getDb();

  checkExists(classId: number, attendanceDate: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM attendance_records 
      WHERE class_id = ? AND attendance_date = ?
    `);
    const result = stmt.get(classId, attendanceDate) as { count: number };
    return result.count > 0;
  }

  getClassAttendance(classId: number, attendanceDate: string): AttendanceRecord[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, class_id as classId, student_id as studentId, 
        attendance_date as attendanceDate, status, created_at as createdAt
      FROM attendance_records 
      WHERE class_id = ? AND attendance_date = ?
    `);
    return stmt.all(classId, attendanceDate) as AttendanceRecord[];
  }

  getStudentAttendance(studentId: number): AttendanceRecord[] {
    const stmt = this.db.prepare(`
      SELECT 
        ar.id, ar.class_id as classId, ar.student_id as studentId, 
        ar.attendance_date as attendanceDate, ar.status, ar.created_at as createdAt,
        c.name as className
      FROM attendance_records ar
      LEFT JOIN classes c ON ar.class_id = c.id
      WHERE ar.student_id = ?
      ORDER BY ar.attendance_date DESC
    `);
    return stmt.all(studentId) as AttendanceRecord[];
  }

  getStatistics(classId: number): AttendanceStatistics[] {
    const stmt = this.db.prepare(`
      SELECT 
        s.id as studentId,
        s.name as studentName,
        COUNT(ar.id) as totalClasses,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN ar.status = 'leave' THEN 1 ELSE 0 END) as leaveCount,
        CASE 
          WHEN COUNT(ar.id) = 0 THEN 0
          ELSE ROUND(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(ar.id))
        END as attendanceRate
      FROM students s
      LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.class_id = ?
      WHERE s.class_id = ?
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    return stmt.all(classId, classId) as AttendanceStatistics[];
  }

  getParentAttendanceRecords(parentPhone: string): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        ar.id,
        c.name as className,
        ar.attendance_date as attendanceDate,
        ar.status
      FROM attendance_records ar
      LEFT JOIN classes c ON ar.class_id = c.id
      LEFT JOIN students s ON ar.student_id = s.id
      WHERE s.parent_phone = ?
      ORDER BY ar.attendance_date DESC
    `);
    return stmt.all(parentPhone) as any[];
  }

  submitAttendance(
    classId: number, 
    attendanceDate: string, 
    records: { studentId: number; status: string }[],
    operatorId: number | null = null
  ): { success: boolean; warnings: { studentId: number; studentName: string; message: string }[] } {
    const courseStmt = this.db.prepare('SELECT course_id FROM classes WHERE id = ?');
    const courseInfo = courseStmt.get(classId) as { course_id: number } | undefined;
    if (!courseInfo) return { success: false, warnings: [] };
    const courseId = courseInfo.course_id;

    const warnings: { studentId: number; studentName: string; message: string }[] = [];

    const transaction = this.db.transaction((records: any[]) => {
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO attendance_records (class_id, student_id, attendance_date, status)
        VALUES (?, ?, ?, ?)
      `);
      
      const getOldStatusStmt = this.db.prepare(`
        SELECT id, status FROM attendance_records 
        WHERE class_id = ? AND student_id = ? AND attendance_date = ?
      `);
      
      const getEnrollmentStmt = this.db.prepare(`
        SELECT id, remaining_hours, is_frozen FROM enrollments 
        WHERE student_id = ? AND course_id = ?
      `);

      const getStudentNameStmt = this.db.prepare(`
        SELECT name FROM students WHERE id = ?
      `);
      
      const addHoursStmt = this.db.prepare(`
        UPDATE enrollments 
        SET remaining_hours = remaining_hours + 1
        WHERE id = ? AND is_frozen = 0
      `);
      
      const deductHoursStmt = this.db.prepare(`
        UPDATE enrollments 
        SET remaining_hours = remaining_hours - 1
        WHERE id = ? AND is_frozen = 0 AND remaining_hours > 0
      `);

      for (const record of records) {
        const studentName = (getStudentNameStmt.get(record.studentId) as { name: string } | undefined)?.name || '';

        const oldRecord = getOldStatusStmt.get(classId, record.studentId, attendanceDate) as { id: number; status: string } | undefined;
        const oldStatus = oldRecord?.status;
        
        insertStmt.run(classId, record.studentId, attendanceDate, record.status);
        const attendanceId = this.db.prepare('SELECT last_insert_rowid() as id').pluck().get() as number;
        
        const enrollmentBefore = getEnrollmentStmt.get(record.studentId, courseId) as any;
        if (!enrollmentBefore) continue;
        
        let actualHoursChange = 0;
        let changeType: 'deduct' | 'refund' | null = null;
        let reason = '';

        if (oldStatus === 'present' && record.status !== 'present') {
          if (enrollmentBefore.is_frozen === 1) {
            warnings.push({
              studentId: record.studentId,
              studentName,
              message: `${studentName}课时已冻结，仅更新考勤状态，余额不变动`
            });
          } else {
            const updateResult = addHoursStmt.run(enrollmentBefore.id);
            if (updateResult.changes > 0) {
              actualHoursChange = 1;
              changeType = 'refund';
              reason = `考勤修改：${attendanceDate} 出勤改为${record.status === 'absent' ? '缺勤' : '请假'}，补回1课时`;
            }
          }
        }
        
        if (oldStatus !== 'present' && record.status === 'present') {
          if (enrollmentBefore.is_frozen === 1) {
            warnings.push({
              studentId: record.studentId,
              studentName,
              message: `${studentName}课时已冻结，无法扣减课时，请先解冻`
            });
          } else if (enrollmentBefore.remaining_hours <= 0) {
            warnings.push({
              studentId: record.studentId,
              studentName,
              message: `${studentName}剩余课时不足，请先续费`
            });
          } else {
            const updateResult = deductHoursStmt.run(enrollmentBefore.id);
            if (updateResult.changes > 0) {
              actualHoursChange = 1;
              changeType = 'deduct';
              reason = oldStatus 
                ? `考勤修改：${attendanceDate} ${oldStatus === 'absent' ? '缺勤' : '请假'}改为出勤，扣减1课时`
                : `${attendanceDate} 签到出勤，扣减1课时`;
            }
          }
        }

        if (changeType && actualHoursChange > 0) {
          const enrollmentAfter = getEnrollmentStmt.get(record.studentId, courseId) as any;
          const balanceAfter = enrollmentAfter?.remaining_hours ?? enrollmentBefore.remaining_hours;
          hourlyLogRepository.createLog(
            record.studentId,
            courseId,
            classId,
            changeType,
            changeType === 'deduct' ? -actualHoursChange : actualHoursChange,
            balanceAfter,
            reason,
            operatorId,
            attendanceId
          );
        }
      }
      
      return records.length;
    });
    
    try {
      transaction(records);
      return { success: true, warnings };
    } catch (error) {
      console.error('考勤提交失败:', error);
      return { success: false, warnings };
    }
  }
}

export default new AttendanceRepository();
