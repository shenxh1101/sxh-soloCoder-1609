CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('consultant', 'teacher', 'parent', 'admin')),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  parent_phone VARCHAR(20) NOT NULL,
  intended_course_id INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'consulting' CHECK (status IN ('consulting', 'enrolled', 'suspended')),
  class_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intended_course_id) REFERENCES courses(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE consultation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  consultant_id INTEGER NOT NULL,
  follow_up_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'contacted', 'enrolled', 'lost')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (consultant_id) REFERENCES users(id)
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  total_hours INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  validity_days INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  course_id INTEGER NOT NULL,
  max_students INTEGER NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  schedule VARCHAR(200) NOT NULL,
  teacher_id INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  total_hours INTEGER NOT NULL,
  remaining_hours INTEGER NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL,
  enroll_date DATE NOT NULL,
  expire_date DATE NOT NULL,
  is_frozen BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE(student_id, course_id)
);

CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(class_id, student_id, attendance_date)
);

CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_classes_course_id ON classes(course_id);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_attendance_class_date ON attendance_records(class_id, attendance_date);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_expire ON enrollments(expire_date, is_frozen);

CREATE TABLE hourly_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  class_id INTEGER,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('deduct', 'refund', 'enroll', 'manual')),
  change_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason VARCHAR(500) NOT NULL,
  operator_id INTEGER,
  related_attendance_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (operator_id) REFERENCES users(id),
  FOREIGN KEY (related_attendance_id) REFERENCES attendance_records(id)
);

CREATE INDEX idx_hourly_logs_student ON hourly_logs(student_id);
CREATE INDEX idx_hourly_logs_course ON hourly_logs(course_id);
CREATE INDEX idx_hourly_logs_created ON hourly_logs(created_at);
