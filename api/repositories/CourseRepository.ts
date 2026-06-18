import { getDb } from '../db';
import type { Course } from '../../shared/types';

export class CourseRepository {
  private db = getDb();

  findAll(): Course[] {
    return this.db.prepare(`
      SELECT 
        id, name, total_hours as totalHours, price, 
        validity_days as validityDays, description, 
        created_at as createdAt
      FROM courses
      ORDER BY created_at DESC
    `).all() as Course[];
  }

  findById(id: number): Course | null {
    return this.db.prepare(`
      SELECT 
        id, name, total_hours as totalHours, price, 
        validity_days as validityDays, description, 
        created_at as createdAt
      FROM courses
      WHERE id = ?
    `).get(id) as Course | null;
  }

  create(data: { name: string; totalHours: number; price: number; validityDays: number; description: string }): number {
    const result = this.db.prepare(`
      INSERT INTO courses (name, total_hours, price, validity_days, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.name, data.totalHours, data.price, data.validityDays, data.description);
    
    return Number(result.lastInsertRowid);
  }

  update(id: number, updates: Partial<Course>): boolean {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.totalHours !== undefined) { fields.push('total_hours = ?'); values.push(updates.totalHours); }
    if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price); }
    if (updates.validityDays !== undefined) { fields.push('validity_days = ?'); values.push(updates.validityDays); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const result = this.db.prepare(`
      UPDATE courses SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);
    
    return result.changes > 0;
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export default new CourseRepository();
