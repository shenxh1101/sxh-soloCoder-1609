import { getDb } from '../db';
import type { HourlyLog } from '../../shared/types';

export interface HourlyLogFilters {
  studentId?: number;
  classId?: number;
  courseId?: number;
  startDate?: string;
  endDate?: string;
  changeType?: string;
  parentPhone?: string;
}

class HourlyLogRepository {
  private db = getDb();

  private BASE_SELECT_SQL = `
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
  `;

  private buildWhereAndParams(filters: HourlyLogFilters): { where: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.studentId) {
      conditions.push('hl.student_id = ?');
      params.push(filters.studentId);
    }
    if (filters.classId) {
      conditions.push('hl.class_id = ?');
      params.push(filters.classId);
    }
    if (filters.courseId) {
      conditions.push('hl.course_id = ?');
      params.push(filters.courseId);
    }
    if (filters.changeType) {
      conditions.push('hl.change_type = ?');
      params.push(filters.changeType);
    }
    if (filters.startDate) {
      conditions.push('DATE(hl.created_at) >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('DATE(hl.created_at) <= ?');
      params.push(filters.endDate);
    }
    if (filters.parentPhone) {
      conditions.push('s.parent_phone = ?');
      params.push(filters.parentPhone);
    }

    return {
      where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
      params,
    };
  }

  createLog(
    studentId: number,
    courseId: number,
    classId: number | null,
    changeType: 'deduct' | 'refund' | 'enroll' | 'renew' | 'manual',
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

  findWithFilters(filters: HourlyLogFilters): HourlyLog[] {
    const { where, params } = this.buildWhereAndParams(filters);
    const sql = `${this.BASE_SELECT_SQL} ${where} ORDER BY hl.created_at DESC LIMIT 2000`;
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as HourlyLog[];
  }

  exportWithFilters(filters: HourlyLogFilters): string {
    const logs = this.findWithFilters(filters);
    const headers = ['流水ID', '学员姓名', '课程', '班级', '变动类型', '变动时长(小时)', '变动后余额', '原因', '操作人', '发生时间'];
    const typeLabels: Record<string, string> = {
      deduct: '扣课',
      refund: '补回',
      enroll: '报名充值',
      renew: '续费充值',
      manual: '手动调整',
    };

    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const rows = logs.map(l => [
      l.id,
      l.studentName,
      l.courseName,
      l.className,
      typeLabels[l.changeType] || l.changeType,
      l.changeAmount,
      l.balanceAfter,
      l.reason,
      l.operatorName,
      l.createdAt,
    ].map(escape).join(','));

    return headers.map(escape).join(',') + '\n' + rows.join('\n') + '\n';
  }

  getEnrollmentByStudentAndCourse(studentId: number, courseId: number) {
    const stmt = this.db.prepare(`
      SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
    `);
    return stmt.get(studentId, courseId) as any;
  }
}

export default new HourlyLogRepository();
