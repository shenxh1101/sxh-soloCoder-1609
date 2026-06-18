import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'app.db');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  const migrationDir = path.join(process.cwd(), 'migrations');
  const migrationFiles = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  const tablesExist = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
  ).get();
  
  if (!tablesExist) {
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
      db.exec(sql);
    }
    
    seedInitialData(db);
  } else {
    checkAndFreezeExpiredEnrollments(db);
  }
}

function seedInitialData(db: Database.Database) {
  const passwordHash = bcrypt.hashSync('123456', 10);
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, name, phone)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertUser.run('admin', passwordHash, 'admin', '系统管理员', '13800000000');
  insertUser.run('consultant1', passwordHash, 'consultant', '张老师', '13800000001');
  insertUser.run('teacher1', passwordHash, 'teacher', '李老师', '13800000002');
  insertUser.run('parent1', passwordHash, 'parent', '王女士', '13900000001');
  insertUser.run('parent2', passwordHash, 'parent', '刘女士', '13900000002');
  
  const insertCourse = db.prepare(`
    INSERT INTO courses (name, total_hours, price, validity_days, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertCourse.run('英语启蒙班', 48, 4800, 180, '适合4-6岁儿童的英语启蒙课程');
  insertCourse.run('数学思维班', 36, 3600, 120, '培养数学逻辑思维能力');
  insertCourse.run('创意绘画班', 24, 2400, 90, '激发创造力的绘画课程');
  
  const insertClass = db.prepare(`
    INSERT INTO classes (name, course_id, max_students, min_age, max_age, schedule, teacher_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertClass.run('英语启蒙A班', 1, 12, 4, 6, '每周一、三 16:00-17:30', 3, 'active');
  insertClass.run('英语启蒙B班', 1, 12, 5, 7, '每周二、四 16:00-17:30', 3, 'active');
  insertClass.run('数学思维A班', 2, 15, 6, 8, '每周六 09:00-11:00', null, 'active');

  const insertStudent = db.prepare(`
    INSERT INTO students (name, age, parent_phone, intended_course_id, status, class_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run('小明', 5, '13900000001', 1, 'enrolled', 1);
  insertStudent.run('小红', 6, '13900000002', 1, 'enrolled', 2);
  insertStudent.run('小刚', 7, '13900000003', 2, 'consulting', null);
  insertStudent.run('小美', 4, '13900000001', 1, 'consulting', null);

  const today = new Date().toISOString().split('T')[0];
  const expireDate1 = new Date();
  expireDate1.setDate(expireDate1.getDate() + 180);
  const expireDate2 = new Date();
  expireDate2.setDate(expireDate2.getDate() + 180);

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, total_hours, remaining_hours, paid_amount, enroll_date, expire_date, is_frozen)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);

  insertEnrollment.run(1, 1, 48, 45, 4800, today, expireDate1.toISOString().split('T')[0]);
  insertEnrollment.run(2, 1, 36, 30, 3600, today, expireDate2.toISOString().split('T')[0]);

  const insertHourlyLog = db.prepare(`
    INSERT INTO hourly_logs (student_id, course_id, class_id, change_type, change_amount, balance_after, reason, operator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHourlyLog.run(1, 1, 1, 'enroll', 48, 48, '报名成功，充值48课时，实付¥4800', 1);
  insertHourlyLog.run(1, 1, 1, 'deduct', -1, 47, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(1, 1, 1, 'deduct', -1, 46, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(1, 1, 1, 'deduct', -1, 45, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(2, 1, 2, 'enroll', 36, 36, '报名成功，充值36课时，实付¥3600', 1);
  insertHourlyLog.run(2, 1, 2, 'deduct', -1, 35, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(2, 1, 2, 'deduct', -1, 34, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(2, 1, 2, 'deduct', -1, 33, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(2, 1, 2, 'deduct', -1, 32, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(2, 1, 2, 'deduct', -1, 31, '签到出勤，扣减1课时', 3);
  insertHourlyLog.run(2, 1, 2, 'deduct', -1, 30, '签到出勤，扣减1课时', 3);

  const insertAttendance = db.prepare(`
    INSERT INTO attendance_records (class_id, student_id, attendance_date, status)
    VALUES (?, ?, ?, ?)
  `);

  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    dates.push(d.toISOString().split('T')[0]);
  }

  dates.forEach(date => {
    insertAttendance.run(1, 1, date, 'present');
  });

  for (let i = 1; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 5);
    insertAttendance.run(2, 2, d.toISOString().split('T')[0], i % 3 === 0 ? 'leave' : 'present');
  }
}

export function checkAndFreezeExpiredEnrollments(db: Database.Database) {
  const today = new Date().toISOString().split('T')[0];
  
  db.prepare(`
    UPDATE enrollments
    SET is_frozen = 1
    WHERE expire_date < ? AND is_frozen = 0
  `).run(today);
}

export default getDb;
