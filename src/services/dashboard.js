import { apiService } from './api';

class DashboardService {
  static async getStats() {
    try {
      const response = await apiService.get('/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
  
  static async getActivityData(timeRange = '7d') {
    try {
      const response = await apiService.get(`/dashboard/activity?timeRange=${timeRange}`);
      return response;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }
  
  static async getRecentTransactions(limit = 10) {
    try {
      const response = await apiService.get(`/dashboard/transactions?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }
}

export default DashboardService;
