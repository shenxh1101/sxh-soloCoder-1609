import { useEffect, useState } from 'react';
import { CalendarCheck, UserCheck, UserX, CalendarX, CheckCircle, AlertCircle } from 'lucide-react';
import { classApi, attendanceApi } from '../../utils/api';
import type { ClassWithStats, StudentWithDetails } from '../../../shared/types';

export default function TeacherCheckIn() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, 'present' | 'absent' | 'leave'>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents();
    }
  }, [selectedClass, attendanceDate]);

  const loadClasses = async () => {
    try {
      const res = await classApi.getAll();
      setClasses(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const [studentsRes, checkRes] = await Promise.all([
        classApi.getStudents(selectedClass),
        attendanceApi.checkExists(selectedClass, attendanceDate),
      ]);
      
      const studentData = studentsRes.data || [];
      setStudents(studentData);
      
      const initialStatus: Record<number, 'present' | 'absent' | 'leave'> = {};
      studentData.forEach(s => {
        initialStatus[s.id] = 'present';
      });
      setAttendanceStatus(initialStatus);
      setAlreadySubmitted(checkRes.data?.exists || false);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'leave') => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || Object.keys(attendanceStatus).length === 0) return;
    
    setSubmitting(true);
    setMessage(null);
    
    try {
      const records = Object.entries(attendanceStatus).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        status,
      }));
      
      const res = await attendanceApi.submit({
        classId: selectedClass,
        attendanceDate,
        records,
      });
      
      if (res.success) {
        setMessage({ type: 'success', text: '考勤提交成功！已自动扣减课时。' });
        setAlreadySubmitted(true);
      } else {
        setMessage({ type: 'error', text: res.message || '提交失败，请重试' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '提交失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendanceStatus).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceStatus).filter(s => s === 'absent').length;
  const leaveCount = Object.values(attendanceStatus).filter(s => s === 'leave').length;

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">上课签到</h1>
        <p className="text-slate-500 mt-1">选择班级和日期，勾选签到学员</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择班级</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择班级</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.courseName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">签到日期</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {alreadySubmitted && (
          <div className="mb-4 p-4 bg-amber-50 rounded-xl flex items-center gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            <span>该班级今日考勤已提交，如需修改请联系管理员</span>
          </div>
        )}

        {selectedClass && students.length > 0 && (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">出勤 {presentCount} 人</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl">
                <UserX className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-700">缺勤 {absentCount} 人</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl">
                <CalendarX className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">请假 {leaveCount} 人</span>
              </div>
            </div>

            <div className="space-y-3">
              {students.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.age}岁 · {student.parentPhone}</p>
                    </div>
                    {student.enrollment && (
                      <div className="ml-4 px-3 py-1 bg-blue-50 rounded-lg">
                        <span className="text-xs text-blue-700">剩余 {student.enrollment.remainingHours} 课时</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      disabled={alreadySubmitted}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        attendanceStatus[student.id] === 'present'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } ${alreadySubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      出勤
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      disabled={alreadySubmitted}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        attendanceStatus[student.id] === 'absent'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } ${alreadySubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      缺勤
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'leave')}
                      disabled={alreadySubmitted}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        attendanceStatus[student.id] === 'leave'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } ${alreadySubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      请假
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!alreadySubmitted && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CalendarCheck className="w-5 h-5" />
                  {submitting ? '提交中...' : '提交考勤'}
                </button>
              </div>
            )}
          </>
        )}

        {selectedClass && students.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            该班级暂无学员
          </div>
        )}

        {!selectedClass && (
          <div className="text-center py-12 text-slate-500">
            请先选择班级
          </div>
        )}
      </div>
    </div>
  );
}
