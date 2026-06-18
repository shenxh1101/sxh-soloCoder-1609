import type {
  ApiResponse,
  User,
  Student,
  StudentWithDetails,
  Course,
  ClassWithStats,
  ConsultationRecord,
  Enrollment,
  AttendanceRecord,
  AttendanceStatistics,
  AutoAssignResult,
  ClassRosterReport,
  ParentStudentInfo,
  ParentAttendanceRecord,
  HourlyLog,
  LoginRequest,
  CreateStudentRequest,
  EnrollRequest,
  CreateClassRequest,
  AttendanceSubmitRequest
} from '../../shared/types';

const API_BASE = '/api';

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const pairs: string[] = [];
  Object.keys(params).forEach(k => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') {
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  });
  return pairs.length > 0 ? '?' + pairs.join('&') : '';
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  return response.json();
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getCurrentUser: () =>
    request<User>('/auth/me'),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const studentApi = {
  getAll: (status?: string) =>
    request<StudentWithDetails[]>(`/students${status ? `?status=${status}` : ''}`),
  
  getUnassigned: () =>
    request<StudentWithDetails[]>('/students/unassigned'),
  
  getById: (id: number) =>
    request<StudentWithDetails & { enrollments: Enrollment[]; consultations: ConsultationRecord[] }>(`/students/${id}`),
  
  create: (data: CreateStudentRequest) =>
    request<{ id: number }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Student>) =>
    request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  addConsultation: (id: number, data: { content: string; followUpStatus: string }) =>
    request<{ id: number }>(`/students/${id}/consultations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  enroll: (id: number, data: EnrollRequest) =>
    request<{ id: number }>(`/students/${id}/enroll`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  renew: (id: number, data: { courseId: number; addHours: number; paidAmount: number; extendDays?: number }) =>
    request<{ remainingHours: number }>(`/students/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const classApi = {
  getAll: () =>
    request<ClassWithStats[]>('/classes'),
  
  getById: (id: number) =>
    request<ClassWithStats & { students: StudentWithDetails[] }>(`/classes/${id}`),
  
  create: (data: CreateClassRequest) =>
    request<{ id: number }>('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: any) =>
    request(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    request(`/classes/${id}`, {
      method: 'DELETE',
    }),
  
  getStudents: (id: number) =>
    request<StudentWithDetails[]>(`/classes/${id}/students`),
  
  assignStudent: (classId: number, studentId: number) =>
    request(`/classes/${classId}/assign-student`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
  
  removeStudent: (classId: number, studentId: number) =>
    request(`/classes/${classId}/remove-student`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
  
  autoAssign: () =>
    request<AutoAssignResult[]>('/classes/auto-assign'),
  
  autoAssignConfirm: (assignments: { studentId: number; classId: number }[]) =>
    request<{ successCount: number; failCount: number }>('/classes/auto-assign', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    }),
};

export const courseApi = {
  getAll: () =>
    request<Course[]>('/courses'),
  
  getById: (id: number) =>
    request<Course>(`/courses/${id}`),
  
  create: (data: any) =>
    request<{ id: number }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: any) =>
    request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    request(`/courses/${id}`, {
      method: 'DELETE',
    }),
};

export const attendanceApi = {
  submit: (data: AttendanceSubmitRequest) =>
    request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getClassAttendance: (classId: number, date?: string) =>
    request<AttendanceRecord[]>(`/attendance/class/${classId}${date ? `?date=${date}` : ''}`),
  
  getStudentAttendance: (studentId: number) =>
    request<AttendanceRecord[]>(`/attendance/student/${studentId}`),
  
  getStatistics: (classId: number) =>
    request<AttendanceStatistics[]>(`/attendance/statistics/${classId}`),
  
  checkExists: (classId: number, date: string) =>
    request<{ exists: boolean }>(`/attendance/check/${classId}/${date}`),
};

export const reportApi = {
  getClassRoster: (classId: number) =>
    request<ClassRosterReport>(`/reports/class-roster/${classId}`),
  
  getAttendanceReport: (classId: number) =>
    request(`/reports/attendance/${classId}`),

  getHourWarnings: () =>
    request<{ expiringSoon: any[]; lowHours: any[]; longAbsent: any[] }>(`/reports/warnings`),
  
  exportRoster: async (classId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/reports/export/roster/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('导出失败');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class-roster-${classId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  },

  getHourlyLogsByStudent: (studentId: number, filters?: any) => {
    const q = buildQuery(filters);
    return request<HourlyLog[]>(`/hourly-logs/student/${studentId}${q}`);
  },

  getAllHourlyLogs: (filters?: any) => {
    const q = buildQuery(filters);
    return request<HourlyLog[]>(`/hourly-logs/all${q}`);
  },

  getParentHourlyLogs: (filters?: any) => {
    const q = buildQuery(filters);
    return request<HourlyLog[]>(`/hourly-logs/parent${q}`);
  },

  exportHourlyLogs: async (filters?: any) => {
    const token = localStorage.getItem('token');
    const q = buildQuery(filters);
    try {
      const response = await fetch(`${API_BASE}/hourly-logs/export${q}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('导出失败');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().slice(0, 10);
      a.download = `hourly-logs-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  },
};

export const parentApi = {
  getRemainingHours: () =>
    request(`/parent/remaining-hours`),
  
  getAttendanceRecords: () =>
    request<ParentAttendanceRecord[]>('/parent/attendance-records'),
  
  getStudents: () =>
    request<ParentStudentInfo[]>('/parent/students'),
};

export const userApi = {
  getAll: (role?: string) =>
    request<User[]>(`/users${role ? `?role=${role}` : ''}`),
  
  getTeachers: () =>
    request<User[]>('/users/teachers'),
  
  getById: (id: number) =>
    request<User>(`/users/${id}`),
  
  create: (data: any) =>
    request<{ id: number }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: any) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    request(`/users/${id}`, {
      method: 'DELETE',
    }),
};
