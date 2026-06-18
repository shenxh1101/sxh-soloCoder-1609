import { Router } from 'express';
import userRepository from '../repositories/UserRepository';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { role } = req.query;
    let users;
    
    if (role) {
      users = userRepository.findByRole(role as string);
    } else {
      users = userRepository.findAll();
    }
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

router.get('/teachers', authenticateToken, (req, res) => {
  try {
    const teachers = userRepository.findByRole('teacher');
    
    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取教师列表失败'
    });
  }
});

router.get('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = userRepository.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户详情失败'
    });
  }
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = userRepository.create(req.body);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = userRepository.update(id, req.body);
    
    res.json({
      success,
      message: success ? '更新成功' : '更新失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户失败'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = userRepository.delete(id);
    
    res.json({
      success,
      message: success ? '删除成功' : '删除失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
});

export default router;
