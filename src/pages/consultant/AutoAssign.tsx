import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { classApi } from '../../utils/api';
import type { AutoAssignResult } from '../../../shared/types';

export default function AutoAssign() {
  const navigate = useNavigate();
  const [results, setResults] = useState<AutoAssignResult[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await classApi.autoAssign();
      setResults(res.data || []);
      setSelectedAssignments(new Set(
        (res.data || []).filter(r => r.recommendedClassId > 0).map(r => r.studentId)
      ));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (studentId: number) => {
    const newSelected = new Set(selectedAssignments);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedAssignments(newSelected);
  };

  const handleConfirm = async () => {
    const assignments = results
      .filter(r => selectedAssignments.has(r.studentId) && r.recommendedClassId > 0)
      .map(r => ({ studentId: r.studentId, classId: r.recommendedClassId }));

    if (assignments.length === 0) {
      alert('请选择要分配的学员');
      return;
    }

    setSubmitting(true);
    try {
      const res = await classApi.autoAssignConfirm(assignments);
      if (res.success) {
        alert(`分班完成！成功 ${res.data?.successCount || 0} 人，失败 ${res.data?.failCount || 0} 人`);
        loadRecommendations();
      } else {
        alert(res.message || '分班失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectAll = () => {
    const eligible = results.filter(r => r.recommendedClassId > 0).map(r => r.studentId);
    setSelectedAssignments(new Set(eligible));
  };

  const clearSelection = () => {
    setSelectedAssignments(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">自动分班</h1>
          <p className="text-slate-500 mt-1">系统根据学员年龄和意向课程智能推荐班级</p>
        </div>
        <button
          onClick={loadRecommendations}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>刷新推荐</span>
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold">智能分班推荐</h2>
            </div>
            <p className="text-blue-100">
              共找到 {results.length} 名待分班学员，其中 {results.filter(r => r.recommendedClassId > 0).length} 名可自动匹配
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm"
            >
              全选可分配
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm"
            >
              清空选择
            </button>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <UserCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">太棒了！</h3>
          <p className="text-slate-500">当前没有待分班的学员</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={results.filter(r => r.recommendedClassId > 0).every(r => selectedAssignments.has(r.studentId))}
                        onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      学员信息
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      年龄
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      推荐班级
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      匹配度
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      说明
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((result) => (
                    <tr
                      key={result.studentId}
                      className={`hover:bg-slate-50 transition-colors ${
                        result.recommendedClassId === 0 ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAssignments.has(result.studentId)}
                          onChange={() => toggleSelection(result.studentId)}
                          disabled={result.recommendedClassId === 0}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{result.studentName.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-900">{result.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{result.reason.match(/年龄(\d+)岁/)?.[1] || '-'}岁</td>
                      <td className="px-6 py-4">
                        {result.recommendedClassId > 0 ? (
                          <span className="font-medium text-slate-900">{result.recommendedClassName}</span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <X className="w-4 h-4" />
                            无匹配
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.matchScore > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  result.matchScore >= 80 ? 'bg-emerald-500' :
                                  result.matchScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${result.matchScore}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              result.matchScore >= 80 ? 'text-emerald-600' :
                              result.matchScore >= 60 ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              {result.matchScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {result.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-600">
                已选择 <span className="font-semibold text-blue-600">{selectedAssignments.size}</span> 名学员进行分班
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={submitting || selectedAssignments.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? '处理中...' : '确认分班'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
