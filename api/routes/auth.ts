import { Router } from 'express';
import authService from '../services/AuthService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const result = authService.login(req.body);
    
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }
    
    const user = authService.getCurrentUser(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

export default router;
