import { Router } from 'express';
import hourlyLogService from '../services/HourlyLogService';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import type { HourlyLogFilters } from '../repositories/HourlyLogRepository';

const router = Router();

function parseFiltersFromQuery(query: any): HourlyLogFilters {
  const filters: HourlyLogFilters = {};
  if (query.studentId) filters.studentId = parseInt(query.studentId);
  if (query.classId) filters.classId = parseInt(query.classId);
  if (query.courseId) filters.courseId = parseInt(query.courseId);
  if (query.changeType) filters.changeType = query.changeType;
  if (query.startDate) filters.startDate = query.startDate;
  if (query.endDate) filters.endDate = query.endDate;
  return filters;
}

router.get('/all', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const filters = parseFiltersFromQuery(req.query);
    const logs = hourlyLogService.getAllLogs(filters);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课时流水失败'
    });
  }
});

router.get('/export', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const filters = parseFiltersFromQuery(req.query);
    const csv = hourlyLogService.exportAllLogs(filters);
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hourly-logs-${timestamp}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '导出课时流水失败'
    });
  }
});

router.get('/student/:studentId', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const filters = parseFiltersFromQuery(req.query);
    filters.studentId = studentId;
    const logs = hourlyLogService.getAllLogs(filters);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课时流水失败'
    });
  }
});

router.get('/parent', authenticateToken, requireRole('parent'), (req: AuthRequest, res) => {
  try {
    const parentPhone = req.user?.phone || '';
    const filters = parseFiltersFromQuery(req.query);
    const logs = hourlyLogService.getLogsByParentPhone(parentPhone, filters);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课时流水失败'
    });
  }
});

export default router;
