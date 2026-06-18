import { Router } from 'express';
import hourlyLogService from '../services/HourlyLogService';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/all', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const logs = hourlyLogService.getAllLogs();
    
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

router.get('/student/:studentId', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const logs = hourlyLogService.getLogsByStudentId(studentId);
    
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
    const logs = hourlyLogService.getLogsByParentPhone(parentPhone);
    
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
