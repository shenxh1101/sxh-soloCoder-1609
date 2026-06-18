import { getDb } from '../db';
import type { Class, ClassWithStats, StudentWithDetails } from '../../shared/types';

export class ClassRepository {
  private db = getDb();

  findAll(): ClassWithStats[] {
    return this.db.prepare(`
      SELECT 
        c.*,
        c.course_id as courseId,
        c.max_students as maxStudents,
        c.min_age as minAge,
        c.max_age as maxAge,
        c.teacher_id as teacherId,
        c.created_at as createdAt,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as currentStudents,
        u.name as teacherName,
        co.name as courseName
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN courses co ON c.course_id = co.id
      ORDER BY c.created_at DESC
    `).all() as ClassWithStats[];
  }

  findById(id: number): ClassWithStats | null {
    return this.db.prepare(`
      SELECT 
        c.*,
        c.course_id as courseId,
        c.max_students as maxStudents,
        c.min_age as minAge,
        c.max_age as maxAge,
        c.teacher_id as teacherId,
        c.created_at as createdAt,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as currentStudents,
        u.name as teacherName,
        co.name as courseName
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN courses co ON c.course_id = co.id
      WHERE c.id = ?
    `).get(id) as ClassWithStats | null;
  }

  findByTeacherId(teacherId: number): ClassWithStats[] {
    return this.db.prepare(`
      SELECT 
        c.*,
        c.course_id as courseId,
        c.max_students as maxStudents,
        c.min_age as minAge,
        c.max_age as maxAge,
        c.teacher_id as teacherId,
        c.created_at as createdAt,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as currentStudents,
        u.name as teacherName,
        co.name as courseName
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN courses co ON c.course_id = co.id
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(teacherId) as ClassWithStats[];
  }

  getStudents(classId: number): StudentWithDetails[] {
    return this.db.prepare(`
      SELECT 
        s.*,
        c.name as intendedCourseName,
        cl.name as className,
        s.intended_course_id as intendedCourseId,
        s.parent_phone as parentPhone,
        s.class_id as classId,
        s.created_at as createdAt,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.student_id = s.id AND ar.status = 'present') as attendanceCount,
        e.id as enrollmentId,
        e.remaining_hours as remainingHours,
        e.total_hours as totalHours,
        e.is_frozen as isFrozen,
        e.expire_date as expireDate,
        e.paid_amount as paidAmount,
        e.enroll_date as enrollDate,
        e.course_id as enrollmentCourseId,
        co.name as enrollmentCourseName
      FROM students s
      LEFT JOIN courses c ON s.intended_course_id = c.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.course_id = cl.course_id
      LEFT JOIN courses co ON e.course_id = co.id
      WHERE s.class_id = ?
      ORDER BY s.name
    `).all(classId) as StudentWithDetails[];
  }

  create(data: { name: string; courseId: number; maxStudents: number; minAge: number; maxAge: number; schedule: string; teacherId?: number }): number {
    const result = this.db.prepare(`
      INSERT INTO classes (name, course_id, max_students, min_age, max_age, schedule, teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      data.courseId,
      data.maxStudents,
      data.minAge,
      data.maxAge,
      data.schedule,
      data.teacherId || null
    );
    
    return Number(result.lastInsertRowid);
  }

  update(id: number, updates: Partial<Class>): boolean {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.courseId !== undefined) { fields.push('course_id = ?'); values.push(updates.courseId); }
    if (updates.maxStudents !== undefined) { fields.push('max_students = ?'); values.push(updates.maxStudents); }
    if (updates.minAge !== undefined) { fields.push('min_age = ?'); values.push(updates.minAge); }
    if (updates.maxAge !== undefined) { fields.push('max_age = ?'); values.push(updates.maxAge); }
    if (updates.schedule !== undefined) { fields.push('schedule = ?'); values.push(updates.schedule); }
    if (updates.teacherId !== undefined) { fields.push('teacher_id = ?'); values.push(updates.teacherId); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const result = this.db.prepare(`
      UPDATE classes SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);
    
    return result.changes > 0;
  }

  assignStudent(classId: number, studentId: number): boolean {
    const cls = this.findById(classId);
    if (!cls) return false;
    
    const currentCount = cls.currentStudents;
    if (currentCount >= cls.maxStudents) {
      return false;
    }
    
    const result = this.db.prepare(`
      UPDATE students SET class_id = ? WHERE id = ?
    `).run(classId, studentId);
    
    if (result.changes > 0) {
      const newCount = currentCount + 1;
      if (newCount >= cls.maxStudents) {
        this.db.prepare('UPDATE classes SET status = ? WHERE id = ?').run('full', classId);
      }
      return true;
    }
    
    return false;
  }

  removeStudent(classId: number, studentId: number): boolean {
    const result = this.db.prepare(`
      UPDATE students SET class_id = NULL WHERE id = ? AND class_id = ?
    `).run(studentId, classId);
    
    if (result.changes > 0) {
      this.db.prepare('UPDATE classes SET status = ? WHERE id = ? AND status = ?').run('active', classId, 'full');
      return true;
    }
    
    return false;
  }

  findMatchingClasses(studentAge: number, courseId: number): ClassWithStats[] {
    return this.db.prepare(`
      SELECT 
        c.*,
        c.course_id as courseId,
        c.max_students as maxStudents,
        c.min_age as minAge,
        c.max_age as maxAge,
        c.teacher_id as teacherId,
        c.created_at as createdAt,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as currentStudents,
        u.name as teacherName,
        co.name as courseName
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN courses co ON c.course_id = co.id
      WHERE c.course_id = ? 
        AND c.min_age <= ? 
        AND c.max_age >= ?
        AND c.status = 'active'
      ORDER BY currentStudents ASC
    `).all(courseId, studentAge, studentAge) as ClassWithStats[];
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM classes WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export default new ClassRepository();
