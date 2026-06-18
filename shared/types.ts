export interface User {
  id: number;
  username: string;
  role: 'consultant' | 'teacher' | 'parent' | 'admin';
  name: string;
  phone: string;
  createdAt: string;
}

export interface Student {
  id: number;
  name: string;
  age: number;
  parentPhone: string;
  intendedCourseId: number | null;
  status: 'consulting' | 'enrolled' | 'suspended';
  classId: number | null;
  createdAt: string;
}

export interface ConsultationRecord {
  id: number;
  studentId: number;
  content: string;
  consultantId: number;
  consultantName?: string;
  followUpStatus: 'pending' | 'contacted' | 'enrolled' | 'lost';
  createdAt: string;
}

export interface Course {
  id: number;
  name: string;
  totalHours: number;
  price: number;
  validityDays: number;
  description: string;
  createdAt: string;
}

export interface Class {
  id: number;
  name: string;
  courseId: number;
  maxStudents: number;
  minAge: number;
  maxAge: number;
  schedule: string;
  teacherId: number | null;
  status: 'active' | 'full' | 'completed';
  createdAt: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  totalHours: number;
  remainingHours: number;
  paidAmount: number;
  enrollDate: string;
  expireDate: string;
  isFrozen: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  classId: number;
  studentId: number;
  attendanceDate: string;
  status: 'present' | 'absent' | 'leave';
  createdAt: string;
}

export interface LoginRequest {
  role: string;
  username?: string;
  phone?: string;
  password: string;
}

export interface CreateStudentRequest {
  name: string;
  age: number;
  parentPhone: string;
  intendedCourseId?: number;
}

export interface EnrollRequest {
  courseId: number;
  totalHours: number;
  paidAmount: number;
}

export interface CreateClassRequest {
  name: string;
  courseId: number;
  maxStudents: number;
  minAge: number;
  maxAge: number;
  schedule: string;
  teacherId?: number;
}

export interface AttendanceSubmitRequest {
  classId: number;
  attendanceDate: string;
  records: {
    studentId: number;
    status: 'present' | 'absent' | 'leave';
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ClassWithStats extends Class {
  currentStudents: number;
  teacherName?: string;
  courseName: string;
}

export interface StudentWithDetails extends Student {
  intendedCourseName?: string;
  className?: string;
  enrollment?: Enrollment;
  attendanceCount: number;
}

export interface AutoAssignResult {
  studentId: number;
  studentName: string;
  recommendedClassId: number;
  recommendedClassName: string;
  matchScore: number;
  reason: string;
}

export interface AttendanceStatistics {
  studentId: number;
  studentName: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number;
}

export interface ClassRosterReport {
  classId: number;
  className: string;
  courseName: string;
  schedule: string;
  teacherName?: string;
  maxStudents: number;
  currentStudents: number;
  students: {
    id: number;
    name: string;
    age: number;
    parentPhone: string;
    remainingHours: number;
    enrollDate: string;
  }[];
}

export interface ParentStudentInfo {
  id: number;
  name: string;
  age: number;
  status: 'consulting' | 'enrolled' | 'suspended';
  className?: string;
  courseName?: string;
  remainingHours: number;
  totalHours: number;
  expireDate?: string;
  isFrozen: boolean;
}

export interface ParentAttendanceRecord {
  id: number;
  className: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'leave';
}

export interface HourlyLog {
  id: number;
  studentId: number;
  studentName?: string;
  courseId: number;
  courseName?: string;
  classId?: number;
  className?: string;
  changeType: 'deduct' | 'refund' | 'enroll' | 'renew' | 'manual';
  changeAmount: number;
  balanceAfter: number;
  reason: string;
  operatorId?: number;
  operatorName?: string;
  relatedAttendanceId?: number;
  createdAt: string;
}
