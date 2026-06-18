import { getDb } from '../db';
import type { User } from '../../shared/types';
import bcrypt from 'bcryptjs';

export class UserRepository {
  private db = getDb();

  findByUsername(username: string): User | null {
    return this.db.prepare(`
      SELECT id, username, role, name, phone, created_at as createdAt
      FROM users
      WHERE username = ?
    `).get(username) as User | null;
  }

  findByPhone(phone: string): User | null {
    return this.db.prepare(`
      SELECT id, username, role, name, phone, created_at as createdAt
      FROM users
      WHERE phone = ?
    `).get(phone) as User | null;
  }

  findById(id: number): User | null {
    return this.db.prepare(`
      SELECT id, username, role, name, phone, created_at as createdAt
      FROM users
      WHERE id = ?
    `).get(id) as User | null;
  }

  findByRole(role: string): User[] {
    return this.db.prepare(`
      SELECT id, username, role, name, phone, created_at as createdAt
      FROM users
      WHERE role = ?
    `).all(role) as User[];
  }

  findAll(): User[] {
    return this.db.prepare(`
      SELECT id, username, role, name, phone, created_at as createdAt
      FROM users
      ORDER BY created_at DESC
    `).all() as User[];
  }

  verifyPassword(username: string, password: string): User | null {
    const user = this.db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username) as any;
    
    if (!user) return null;
    
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return null;
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at
    };
  }

  verifyPasswordByPhone(phone: string, password: string): User | null {
    const user = this.db.prepare(`
      SELECT * FROM users WHERE phone = ?
    `).get(phone) as any;
    
    if (!user) return null;
    
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return null;
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at
    };
  }

  create(user: { username: string; password: string; role: string; name: string; phone: string }): number {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    
    const result = this.db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.username, passwordHash, user.role, user.name, user.phone);
    
    return Number(result.lastInsertRowid);
  }

  update(id: number, updates: { name?: string; phone?: string; role?: string }): boolean {
    const fields = [];
    const values = [];
    
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.phone) { fields.push('phone = ?'); values.push(updates.phone); }
    if (updates.role) { fields.push('role = ?'); values.push(updates.role); }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const result = this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);
    
    return result.changes > 0;
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export default new UserRepository();
