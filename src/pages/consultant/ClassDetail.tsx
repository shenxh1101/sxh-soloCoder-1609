import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, GraduationCap, UserMinus, ArrowRightLeft, Download, AlertCircle } from 'lucide-react';
import { classApi, reportApi } from '../../utils/api';
import type { ClassWithStats, StudentWithDetails } from '../../../shared/types';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const classId = id ? parseInt(id) : 0;

  const [classInfo, setClassInfo] = useState<ClassWithStats | null>(null);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [allClasses, setAllClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [classRes, studentsRes, allClassesRes] = await Promise.all([
        classApi.getById(classId),
        classApi.getStudents(classId),
        classApi.getAll(),
      ]);

      setClassInfo(classRes.data || null);
      setStudents(studentsRes.data || []);
      setAllClasses(allClassesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      const res = await classApi.removeStudent(classId, selectedStudent.id);
      if (res.success) {
        setMessage({ type: 'success', text: '学员移出成功！' });
        setShowRemoveModal(false);
        setSelectedStudent(null);
        loadData();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: res.message || '移出失败' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedStudent || !targetClassId) return;

    setSubmitting(true);
    try {
      const res = await classApi.assignStudent(parseInt(targetClassId), selectedStudent.id);
      if (res.success) {
        setMessage({ type: 'success', text: '学员换班成功！' });
        setShowTransferModal(false);
        setSelectedStudent(null);
        setTargetClassId('');
        loadData();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: res.message || '换班失败' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportRoster = () => {
    reportApi.exportRoster(classId);
  };

  const openRemoveModal = (student: StudentWithDetails) => {
    setSelectedStudent(student);
    setShowRemoveModal(true);
  };

  const openTransferModal = (student: StudentWithDetails) => {
    setSelectedStudent(student);
    setTargetClassId('');
    setShowTransferModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!classInfo) {
    return <div className="text-center py-12 text-slate-500">班级不存在</div>;
  }

  const availableClasses = allClasses.filter(c => {
    if (c.id === classId) return false;
    if (c.status !== 'active') return false;
    if (c.currentStudents >= c.maxStudents) return false;
    
    if (classInfo && selectedStudent) {
      if (c.courseId !== classInfo.courseId) return false;
      if (selectedStudent.age < c.minAge || selectedStudent.age > c.maxAge) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{classInfo.name}</h1>
          <p className="text-slate-500 mt-1">{classInfo.courseName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportRoster}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出名单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">当前人数</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {classInfo.currentStudents}
            <span className="text-lg text-slate-400 font-normal"> / {classInfo.maxStudents}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-slate-500">授课教师</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{classInfo.teacherName || '未分配'}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">上课时间</span>
          </div>
          <p className="text-sm font-medium text-slate-900">{classInfo.schedule}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">年龄段</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{classInfo.minAge} - {classInfo.maxAge} 岁</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">学员名单</h2>
          <span className="text-sm text-slate-500">共 {students.length} 名学员</span>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>该班级暂无学员</p>
          </div>
        ) : (
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
                </div>
                <div className="flex items-center gap-2">
                  {student.enrollment && (
                    <div className="mr-4 text-right">
                      <p className="text-sm text-slate-500">剩余课时</p>
                      <p className="text-lg font-bold text-blue-600">{student.enrollment.remainingHours}</p>
                    </div>
                  )}
                  <button
                    onClick={() => openTransferModal(student)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="换班"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openRemoveModal(student)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="移出班级"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRemoveModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">移出学员</h3>
            <p className="text-slate-600 mb-6">
              确定要将 <span className="font-medium text-slate-900">{selectedStudent.name}</span> 移出班级吗？
              <br />
              <span className="text-sm text-slate-500">移出后学员将变为未分班状态</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRemoveModal(false); setSelectedStudent(null); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRemove}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '处理中...' : '确认移出'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">学员换班</h3>
            <p className="text-slate-600 mb-4">
              将 <span className="font-medium text-slate-900">{selectedStudent.name}</span> 调整到其他班级
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">目标班级</label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">请选择目标班级</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.courseName}) · {cls.currentStudents}/{cls.maxStudents}人
                  </option>
                ))}
              </select>
              {availableClasses.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">暂无可转入的班级</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowTransferModal(false); setSelectedStudent(null); setTargetClassId(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTransfer}
                disabled={submitting || !targetClassId}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '处理中...' : '确认换班'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
