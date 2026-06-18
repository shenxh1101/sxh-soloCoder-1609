CREATE TABLE IF NOT EXISTS renew_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  package_name VARCHAR(100),
  add_hours INTEGER NOT NULL,
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  extend_days INTEGER NOT NULL DEFAULT 0,
  remark VARCHAR(500),
  operator_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_renew_orders_student ON renew_orders(student_id);

CREATE TABLE IF NOT EXISTS warning_followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  enrollment_id INTEGER NOT NULL,
  warning_type VARCHAR(20) NOT NULL CHECK (warning_type IN ('expiring_soon', 'low_hours', 'long_absent')),
  follow_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (follow_status IN ('pending', 'contacted', 'resolved', 'ignored')),
  next_follow_date DATE,
  follow_result VARCHAR(500),
  operator_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_warning_followups_enrollment ON warning_followups(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_warning_followups_status ON warning_followups(follow_status);

ALTER TABLE hourly_logs RENAME TO hourly_logs_old;

CREATE TABLE hourly_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  class_id INTEGER,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('deduct', 'refund', 'enroll', 'renew', 'manual')),
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

INSERT INTO hourly_logs SELECT * FROM hourly_logs_old;

DROP TABLE hourly_logs_old;

CREATE INDEX idx_hourly_logs_student ON hourly_logs(student_id);
CREATE INDEX idx_hourly_logs_course ON hourly_logs(course_id);
CREATE INDEX idx_hourly_logs_created ON hourly_logs(created_at);
