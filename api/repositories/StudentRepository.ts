import { getDb } from '../db';
import type { Student, StudentWithDetails, ConsultationRecord, Enrollment, CreateStudentRequest } from '../../shared/types';
import hourlyLogRepository from './HourlyLogRepository';

export class StudentRepository {
  private db = getDb();

  findAll(status?: string): StudentWithDetails[] {
    let sql = `
      SELECT 
        s.*,
        c.name as intendedCourseName,
        cl.name as className,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.student_id = s.id AND ar.status = 'present') as attendanceCount
      FROM students s
      LEFT JOIN courses c ON s.intended_course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
    `;
    
    const params: any[] = [];
    if (status) {
      sql += ' WHERE s.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY s.created_at DESC';
    
    const students = this.db.prepare(sql).all(...params) as any[];
    
    return students.map(s => ({
      ...s,
      intendedCourseId: s.intended_course_id,
      parentPhone: s.parent_phone,
      classId: s.class_id,
      createdAt: s.created_at
    }));
  }

  findById(id: number): StudentWithDetails | null {
    const student = this.db.prepare(`
      SELECT 
        s.*,
        c.name as intendedCourseName,
        cl.name as className,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.student_id = s.id AND ar.status = 'present') as attendanceCount
      FROM students s
      LEFT JOIN courses c ON s.intended_course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE s.id = ?
    `).get(id) as any;
    
    if (!student) return null;
    
    return {
      ...student,
      intendedCourseId: student.intended_course_id,
      parentPhone: student.parent_phone,
      classId: student.class_id,
      createdAt: student.created_at
    };
  }

  create(data: CreateStudentRequest): number {
    const result = this.db.prepare(`
      INSERT INTO students (name, age, parent_phone, intended_course_id)
      VALUES (?, ?, ?, ?)
    `).run(data.name, data.age, data.parentPhone, data.intendedCourseId || null);
    
    return Number(result.lastInsertRowid);
  }

  update(id: number, updates: Partial<Student>): boolean {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.age !== undefined) { fields.push('age = ?'); values.push(updates.age); }
    if (updates.parentPhone !== undefined) { fields.push('parent_phone = ?'); values.push(updates.parentPhone); }
    if (updates.intendedCourseId !== undefined) { fields.push('intended_course_id = ?'); values.push(updates.intendedCourseId); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.classId !== undefined) { fields.push('class_id = ?'); values.push(updates.classId); }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const result = this.db.prepare(`
      UPDATE students SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);
    
    return result.changes > 0;
  }

  updateClass(id: number, classId: number | null): boolean {
    const result = this.db.prepare(`
      UPDATE students SET class_id = ? WHERE id = ?
    `).run(classId, id);
    
    return result.changes > 0;
  }

  getEnrollments(studentId: number): Enrollment[] {
    return this.db.prepare(`
      SELECT 
        e.*,
        e.enroll_date as enrollDate,
        e.expire_date as expireDate,
        e.is_frozen as isFrozen,
        e.total_hours as totalHours,
        e.remaining_hours as remainingHours,
        e.paid_amount as paidAmount,
        e.student_id as studentId,
        e.course_id as courseId,
        e.created_at as createdAt
      FROM enrollments e
      WHERE e.student_id = ?
      ORDER BY e.created_at DESC
    `).all(studentId) as Enrollment[];
  }

  getConsultationRecords(studentId: number): ConsultationRecord[] {
    return this.db.prepare(`
      SELECT 
        cr.*,
        u.name as consultantName,
        cr.student_id as studentId,
        cr.consultant_id as consultantId,
        cr.follow_up_status as followUpStatus,
        cr.created_at as createdAt
      FROM consultation_records cr
      LEFT JOIN users u ON cr.consultant_id = u.id
      WHERE cr.student_id = ?
      ORDER BY cr.created_at DESC
    `).all(studentId) as ConsultationRecord[];
  }

  addConsultationRecord(studentId: number, content: string, consultantId: number, followUpStatus: string): number {
    const result = this.db.prepare(`
      INSERT INTO consultation_records (student_id, content, consultant_id, follow_up_status)
      VALUES (?, ?, ?, ?)
    `).run(studentId, content, consultantId, followUpStatus);
    
    return Number(result.lastInsertRowid);
  }

  enroll(studentId: number, courseId: number, totalHours: number, paidAmount: number, operatorId: number | null = null): number {
    const today = new Date();
    const course = this.db.prepare('SELECT validity_days FROM courses WHERE id = ?').get(courseId) as any;
    const expireDate = new Date(today);
    expireDate.setDate(expireDate.getDate() + course.validity_days);
    
    const result = this.db.prepare(`
      INSERT INTO enrollments (student_id, course_id, total_hours, remaining_hours, paid_amount, enroll_date, expire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      studentId,
      courseId,
      totalHours,
      totalHours,
      paidAmount,
      today.toISOString().split('T')[0],
      expireDate.toISOString().split('T')[0]
    );
    
    this.db.prepare(`
      UPDATE students SET status = 'enrolled' WHERE id = ?
    `).run(studentId);

    hourlyLogRepository.createLog(
      studentId,
      courseId,
      null,
      'enroll',
      totalHours,
      totalHours,
      `报名成功，充值${totalHours}课时，实付¥${paidAmount}`,
      operatorId,
      null
    );
    
    return Number(result.lastInsertRowid);
  }

  renewEnrollment(
    studentId: number,
    courseId: number,
    addHours: number,
    paidAmount: number,
    extendDays: number = 0,
    operatorId: number | null = null
  ): { success: boolean; remainingHours: number; message?: string } {
    const existing = this.db.prepare(`
      SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
    `).get(studentId, courseId) as any;

    if (!existing) {
      return { success: false, remainingHours: 0, message: '未找到对应报名记录，请先报名' };
    }

    if (addHours <= 0) {
      return { success: false, remainingHours: existing.remaining_hours, message: '追加课时必须大于0' };
    }

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE enrollments 
        SET 
          total_hours = total_hours + ?,
          remaining_hours = remaining_hours + ?,
          paid_amount = paid_amount + ?,
          expire_date = CASE
            WHEN ? > 0 THEN DATE(MAX(expire_date, DATE('now')), '+' || ? || ' days')
            ELSE expire_date
          END
        WHERE id = ?
      `).run(addHours, addHours, paidAmount, extendDays, extendDays, existing.id);

      const updated = this.db.prepare(`
        SELECT remaining_hours FROM enrollments WHERE id = ?
      `).get(existing.id) as { remaining_hours: number };

      const reason = extendDays > 0
        ? `续费追加${addHours}课时，实付¥${paidAmount}，有效期延长${extendDays}天`
        : `续费追加${addHours}课时，实付¥${paidAmount}`;

      hourlyLogRepository.createLog(
        studentId,
        courseId,
        null,
        'enroll',
        addHours,
        updated.remaining_hours,
        reason,
        operatorId,
        null
      );

      return updated.remaining_hours;
    });

    try {
      const remaining = transaction();
      return { success: true, remainingHours: remaining };
    } catch (error) {
      console.error('续费失败:', error);
      return { success: false, remainingHours: existing.remaining_hours, message: '续费失败' };
    }
  }

  findByParentPhone(parentPhone: string): StudentWithDetails[] {
    const students = this.db.prepare(`
      SELECT 
        s.*,
        c.name as intendedCourseName,
        cl.name as className,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.student_id = s.id AND ar.status = 'present') as attendanceCount
      FROM students s
      LEFT JOIN courses c ON s.intended_course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE s.parent_phone = ?
      ORDER BY s.created_at DESC
    `).all(parentPhone) as any[];
    
    return students.map(s => ({
      ...s,
      intendedCourseId: s.intended_course_id,
      parentPhone: s.parent_phone,
      classId: s.class_id,
      createdAt: s.created_at
    }));
  }

  getUnassignedStudents(): StudentWithDetails[] {
    return this.findAll('enrolled').filter(s => !s.classId);
  }
}

export default new StudentRepository();
