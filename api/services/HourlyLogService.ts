import hourlyLogRepository from '../repositories/HourlyLogRepository';

export class HourlyLogService {
  getLogsByStudentId(studentId: number) {
    return hourlyLogRepository.findByStudentId(studentId);
  }

  getLogsByParentPhone(parentPhone: string) {
    return hourlyLogRepository.findByParentPhone(parentPhone);
  }

  getAllLogs() {
    return hourlyLogRepository.findAll();
  }
}

export default new HourlyLogService();
