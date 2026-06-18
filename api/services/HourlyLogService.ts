import hourlyLogRepository, { HourlyLogFilters } from '../repositories/HourlyLogRepository';

export class HourlyLogService {
  getLogsByStudentId(studentId: number) {
    return hourlyLogRepository.findWithFilters({ studentId });
  }

  getLogsByParentPhone(parentPhone: string, filters?: Omit<HourlyLogFilters, 'parentPhone'>) {
    return hourlyLogRepository.findWithFilters({ ...filters, parentPhone });
  }

  getAllLogs(filters?: HourlyLogFilters) {
    return hourlyLogRepository.findWithFilters(filters || {});
  }

  exportAllLogs(filters?: HourlyLogFilters): string {
    return hourlyLogRepository.exportWithFilters(filters || {});
  }
}

export default new HourlyLogService();
