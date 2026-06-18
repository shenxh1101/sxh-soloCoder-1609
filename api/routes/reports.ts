import { Router } from 'express';
import reportService from '../services/ReportService';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/class-roster/:classId', authenticateToken, requireRole('admin', 'consultant', 'teacher'), (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const report = reportService.getClassRoster(classId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取班级名单失败'
    });
  }
});

router.get('/attendance/:classId', authenticateToken, requireRole('admin', 'consultant', 'teacher'), (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const report = reportService.getAttendanceReport(classId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取出勤报表失败'
    });
  }
});

router.get('/export/roster/:classId', authenticateToken, requireRole('admin', 'consultant', 'teacher'), (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const csv = reportService.exportClassRosterToCSV(classId);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="class-roster-${classId}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
});

router.get('/warnings', authenticateToken, requireRole('admin', 'consultant'), (req, res) => {
  try {
    const data = reportService.getHourWarnings();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预警数据失败',
    });
  }
});

export default router;
