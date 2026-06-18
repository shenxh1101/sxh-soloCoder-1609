import userRepository from '../repositories/UserRepository';
import { generateToken } from '../middleware/auth';
import type { LoginRequest } from '../../shared/types';

export class AuthService {
  login(data: LoginRequest): { token: string; user: any } | null {
    let user: any;
    
    if (data.role === 'parent') {
      if (!data.phone) return null;
      user = userRepository.verifyPasswordByPhone(data.phone, data.password);
    } else {
      if (!data.username) return null;
      user = userRepository.verifyPassword(data.username, data.password);
    }
    
    if (!user) return null;
    if (user.role !== data.role) return null;
    
    const token = generateToken(user);
    
    return { token, user };
  }

  getCurrentUser(userId: number) {
    return userRepository.findById(userId);
  }
}

export default new AuthService();
