import { getDb } from '../db';

export interface WarningFollowup {
  id: number;
  studentId: number;
  enrollmentId: number;
  warningType: 'expiring_soon' | 'low_hours' | 'long_absent';
  followStatus: 'pending' | 'contacted' | 'resolved' | 'ignored';
  nextFollowDate: string | null;
  followResult: string | null;
  operatorId: number | null;
  operatorName?: string;
  createdAt: string;
  updatedAt: string;
}

class WarningFollowupRepository {
  private db = getDb();

  findByEnrollmentId(enrollmentId: number): WarningFollowup | undefined {
    return this.db.prepare(`
      SELECT 
        wf.id,
        wf.student_id as studentId,
        wf.enrollment_id as enrollmentId,
        wf.warning_type as warningType,
        wf.follow_status as followStatus,
        wf.next_follow_date as nextFollowDate,
        wf.follow_result as followResult,
        wf.operator_id as operatorId,
        u.name as operatorName,
        wf.created_at as createdAt,
        wf.updated_at as updatedAt
      FROM warning_followups wf
      LEFT JOIN users u ON wf.operator_id = u.id
      WHERE wf.enrollment_id = ?
      ORDER BY wf.updated_at DESC
      LIMIT 1
    `).get(enrollmentId) as WarningFollowup | undefined;
  }

  findByStudentId(studentId: number): WarningFollowup[] {
    return this.db.prepare(`
      SELECT 
        wf.id,
        wf.student_id as studentId,
        wf.enrollment_id as enrollmentId,
        wf.warning_type as warningType,
        wf.follow_status as followStatus,
        wf.next_follow_date as nextFollowDate,
        wf.follow_result as followResult,
        wf.operator_id as operatorId,
        u.name as operatorName,
        wf.created_at as createdAt,
        wf.updated_at as updatedAt
      FROM warning_followups wf
      LEFT JOIN users u ON wf.operator_id = u.id
      WHERE wf.student_id = ?
      ORDER BY wf.updated_at DESC
    `).all(studentId) as WarningFollowup[];
  }

  findAll(): WarningFollowup[] {
    return this.db.prepare(`
      SELECT 
        wf.id,
        wf.student_id as studentId,
        wf.enrollment_id as enrollmentId,
        wf.warning_type as warningType,
        wf.follow_status as followStatus,
        wf.next_follow_date as nextFollowDate,
        wf.follow_result as followResult,
        wf.operator_id as operatorId,
        u.name as operatorName,
        wf.created_at as createdAt,
        wf.updated_at as updatedAt
      FROM warning_followups wf
      LEFT JOIN users u ON wf.operator_id = u.id
      ORDER BY wf.updated_at DESC
    `).all() as WarningFollowup[];
  }

  upsert(data: {
    studentId: number;
    enrollmentId: number;
    warningType: string;
    followStatus: string;
    nextFollowDate?: string;
    followResult?: string;
    operatorId?: number | null;
  }): WarningFollowup {
    const existing = this.db.prepare(`
      SELECT id FROM warning_followups 
      WHERE enrollment_id = ? AND warning_type = ?
      LIMIT 1
    `).get(data.enrollmentId, data.warningType) as { id: number } | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE warning_followups 
        SET follow_status = ?, next_follow_date = ?, follow_result = ?, operator_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.followStatus,
        data.nextFollowDate || null,
        data.followResult || null,
        data.operatorId || null,
        existing.id
      );
      return this.findByEnrollmentId(data.enrollmentId)!;
    }

    const result = this.db.prepare(`
      INSERT INTO warning_followups (student_id, enrollment_id, warning_type, follow_status, next_follow_date, follow_result, operator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.studentId,
      data.enrollmentId,
      data.warningType,
      data.followStatus,
      data.nextFollowDate || null,
      data.followResult || null,
      data.operatorId || null
    );

    return this.findByEnrollmentId(data.enrollmentId)!;
  }
}

export default new WarningFollowupRepository();
