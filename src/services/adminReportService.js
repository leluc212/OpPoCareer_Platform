import candidateProfileService from './candidateProfileService';
import adminEmployerService from './adminEmployerService';
import jobPostService from './jobPostService';
import quickJobService from './quickJobService';
import applicationService from './applicationService';

const SUBSCRIPTIONS_API_URL = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API || 'https://u28w4m6yb7.execute-api.ap-southeast-1.amazonaws.com/prod';

class AdminReportService {
  /**
   * Fetch all data needed for the reports page
   */
  async getReportsData() {
    try {
      console.log('📊 AdminReportService: Fetching consolidated reports data...');

      const fetchData = async (serviceMethod, serviceName = 'Service', fallback = []) => {
        try {
          const result = await serviceMethod();
          
          if (result && result._isBlockedByIam) {
            console.error(`🛑 [AdminReportService] ${serviceName} is blocked by AWS_IAM Authorizer. Current statistics for this category will show 0.`);
            console.info(`💡 Fix: Go to AWS Console -> API Gateway -> ${serviceName} -> Authorizers. Ensure it uses 'COGNITO_USER_POOLS', not 'AWS_IAM'.`);
          }
          
          return result;
        } catch (error) {
          console.error(`⚠️ AdminReportService: Sub-request failed for ${serviceName}:`, error);
          return fallback;
        }
      };

      const [candidates, employers, standardJobs, quickJobs, subscriptions, applications] = await Promise.all([
        fetchData(() => candidateProfileService.getAllCandidates(), 'CandidateService'),
        fetchData(() => adminEmployerService.getAllEmployers(), 'EmployerService'),
        fetchData(() => jobPostService.getAllJobPosts(), 'JobPostService'),
        fetchData(() => quickJobService.getAllQuickJobs(), 'QuickJobService'),
        fetchData(() => this.getAllSubscriptions(), 'SubscriptionService'),
        fetchData(() => applicationService.getAllApplications(), 'ApplicationService')
      ]);

      console.log('✅ AdminReportService: Consolidated reports data fetched (with partial fallbacks if needed)');

      return {
        candidates,
        employers,
        standardJobs,
        quickJobs,
        subscriptions,
        applications
      };
    } catch (error) {
      console.error('❌ AdminReportService: Error fetching reports data:', error);
      throw error;
    }
  }

  /**
   * Fetch all subscriptions
   */
  async getAllSubscriptions() {
    try {
      const response = await fetch(`${SUBSCRIPTIONS_API_URL}/subscriptions`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ AdminReportService: Error fetching subscriptions:', error);
      return [];
    }
  }

  /**
   * Process and calculate statistics from raw data with trends
   */
  calculateStats(data) {
    const { 
      candidates: rawCandidates = [], 
      employers: rawEmployers = [], 
      standardJobs = [], 
      quickJobs = [], 
      subscriptions = [], 
      applications: rawApplications = [] 
    } = data;

    // Filter out junk/incomplete records to ensure only "real" data is counted
    const candidates = rawCandidates.filter(c => (c.email && c.email.includes('@')) || (c.fullName && c.fullName.trim() !== '' && c.fullName !== 'Unknown User'));
    const employers = rawEmployers.filter(e => (e.email && e.email.includes('@')) || (e.companyName && e.companyName.trim() !== ''));
    const applications = rawApplications.filter(a => a.candidateId && a.jobId);

    // Time periods for trends (Current vs Previous Month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isCurrentPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const isPreviousPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
    };

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const growth = ((current - previous) / previous) * 100;
      return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
    };

    // Calculate counts for trend comparison
    const currCandidates = candidates.filter(c => isCurrentPeriod(c.createdAt)).length;
    const prevCandidates = candidates.filter(c => isPreviousPeriod(c.createdAt)).length;

    const currEmployers = employers.filter(e => isCurrentPeriod(e.createdAt)).length;
    const prevEmployers = employers.filter(e => isPreviousPeriod(e.createdAt)).length;

    const currStandardJobs = standardJobs.filter(j => isCurrentPeriod(j.createdAt)).length;
    const prevStandardJobs = standardJobs.filter(j => isPreviousPeriod(j.createdAt)).length;

    const currQuickJobs = quickJobs.filter(j => isCurrentPeriod(j.createdAt)).length;
    const prevQuickJobs = quickJobs.filter(j => isPreviousPeriod(j.createdAt)).length;

    // Revenue calculation with trend
    const getRevenueForPeriod = (list, filterFn) => {
      return list
        .filter(s => (s.status === 'active' || s.status === 'expired' || s.status === 'expiring') && filterFn(s.purchaseDateTime || s.createdAt))
        .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    };

    const currRevenue = getRevenueForPeriod(subscriptions, isCurrentPeriod);
    const prevRevenue = getRevenueForPeriod(subscriptions, isPreviousPeriod);

    // Basic counts
    const totalCandidates = candidates.length;
    const totalEmployers = employers.length;
    const totalStandardJobs = standardJobs.length;
    const totalQuickJobs = quickJobs.length;

    // Subscription stats
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending' || s.approvalStatus === 'pending').length;

    const totalRevenue = subscriptions
      .filter(s => s.status === 'active' || s.status === 'expired' || s.status === 'expiring')
      .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

    return {
      totalCandidates,
      totalEmployers,
      totalStandardJobs,
      totalQuickJobs,
      activeSubscriptions,
      pendingSubscriptions,
      totalRevenue,
      trends: {
        candidates: calculateGrowth(currCandidates, prevCandidates),
        employers: calculateGrowth(currEmployers, prevEmployers),
        standardJobs: calculateGrowth(currStandardJobs, prevStandardJobs),
        quickJobs: calculateGrowth(currQuickJobs, prevQuickJobs),
        revenue: calculateGrowth(currRevenue, prevRevenue),
        applications: applications.length > 0 ? calculateGrowth(
          applications.filter(a => isCurrentPeriod(a.createdAt)).length,
          applications.filter(a => isPreviousPeriod(a.createdAt)).length
        ) : '0%'
      }
    };
  }

  /**
   * Calculate pipeline stages from applications
   */
  calculatePipelineStats(applications) {
    if (!Array.isArray(applications)) return [];

    const stats = {
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      negotiating: 0 // some applications might have a custom status
    };

    applications.forEach(a => {
      const status = (a.status || 'pending').toLowerCase();
      if (status.includes('pending')) stats.pending++;
      else if (status.includes('reviewed')) stats.reviewed++;
      else if (status.includes('accepted')) stats.accepted++;
      else if (status.includes('rejected')) stats.rejected++;
      else if (status.includes('negotiating')) stats.negotiating++;
      else stats.pending++; // fallback
    });

    const total = applications.length || 1;

    return [
      { name: 'Lead', count: stats.pending, percentage: Math.round((stats.pending / total) * 100), color: '#3b82f6' },
      { name: 'Qualified', count: stats.reviewed, percentage: Math.round((stats.reviewed / total) * 100), color: '#10b981' },
      { name: 'Accepted', count: stats.accepted, percentage: Math.round((stats.accepted / total) * 100), color: '#f59e0b' },
      { name: 'Negotiation', count: stats.negotiating, percentage: Math.round((stats.negotiating / total) * 100), color: '#8b5cf6' }
    ];
  }

  /**
   * Extract unique districts from available data
   */
  getDynamicDistricts(data) {
    const { candidates, standardJobs, quickJobs } = data;
    const locations = new Set();

    const extract = (list, field) => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        if (item[field] && typeof item[field] === 'string') {
          // Normalize: "Quận 1, TP.HCM" -> "Quận 1"
          const district = item[field].split(',')[0].trim();
          if (district && district.length < 30) locations.add(district);
        }
      });
    };

    extract(candidates, 'location');
    extract(standardJobs, 'location');
    extract(quickJobs, 'location');

    const result = Array.from(locations).sort();
    return result.length > 0 ? ['Tất cả quận', ...result] : ['Tất cả quận', 'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận Thủ Đức', 'Quận Bình Thạnh'];
  }

  /**
   * Calculate detailed stats per service package dynamically from data
   */
  calculatePackageStats(subscriptions) {
    if (!Array.isArray(subscriptions)) return [];

    const cleanDuration = (raw) => {
      if (!raw) return '7 ngày';
      const str = String(raw);
      // Detect by number in the raw string regardless of encoding
      if (str.includes('24')) return '24h';
      if (str.includes('7')) return '7 ngày';
      // Try normalize
      const cleaned = str
        .normalize('NFC')
        .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || '7 ngày';
    };

    // Map to store stats per unique package name
    const statsMap = {};

    subscriptions.forEach(s => {
      const pkgName = s.packageName || 'Unknown Package';
      if (!statsMap[pkgName]) {
        statsMap[pkgName] = {
          name: pkgName,
          type: (pkgName.toLowerCase().includes('gấp') || pkgName.toLowerCase().includes('urgent')) ? 'urgent' : 'standard',
          activeCount: 0,
          totalCount: 0,
          revenue: 0,
          price: s.price || 0,
          duration: cleanDuration(s.duration),
          pendingCount: 0,
          expiredCount: 0
        };
      }

      statsMap[pkgName].totalCount += 1;
      if (s.status === 'active') {
        statsMap[pkgName].activeCount += 1;
      } else if (s.status === 'expired' || s.status === 'expiring') {
        statsMap[pkgName].expiredCount += 1;
      } else if (s.status === 'pending') {
        statsMap[pkgName].pendingCount += 1;
      }

      // Revenue from successful, expired or pending subscriptions (all except rejected)
      if (s.status === 'active' || s.status === 'expired' || s.status === 'expiring' || s.status === 'pending') {
        statsMap[pkgName].revenue += (parseFloat(s.price) || 0);
      }
    });

    return Object.values(statsMap).map(pkg => ({
      ...pkg,
      revenue: new Intl.NumberFormat('vi-VN').format(pkg.revenue) + ' VND',
      rawRevenue: pkg.revenue,
      price: pkg.price ? `${new Intl.NumberFormat('vi-VN').format(pkg.price)}` : 'Sắp có'
    })).sort((a, b) => b.rawRevenue - a.rawRevenue);
  }

  /**
   * Group subscriptions by month for revenue chart
   */
  getRevenueByMonth(subscriptions) {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentYear = new Date().getFullYear();

    const revenueByMonth = months.map(m => ({ month: m, revenue: 0 }));

    subscriptions.forEach(s => {
      // Check for valid status for revenue
      if (s.status === 'pending' || s.approvalStatus === 'rejected') return;

      const dateStr = s.purchaseDateTime || s.createdAt;
      const date = dateStr ? new Date(dateStr) : null;

      if (date && date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        // Convert to Millions (M) for display
        revenueByMonth[monthIndex].revenue += (parseFloat(s.price) || 0) / 1000000;
      }
    });

    // Add targets (simulated based on a steady growth)
    return revenueByMonth.map((d, i) => ({
      ...d,
      target: 2 + (i * 0.5) // Increasing target from 2M to 7.5M
    }));
  }

  /**
   * Get top employers by total revenue spend
   */
  getTopEmployersByRevenue(subscriptions) {
    const revenueMap = {};
    const pkgCountMap = {};

    subscriptions.forEach(s => {
      if (s.status === 'pending') return;

      const company = s.companyName || 'Unknown Company';
      revenueMap[company] = (revenueMap[company] || 0) + (parseFloat(s.price) || 0);
      pkgCountMap[company] = (pkgCountMap[company] || 0) + 1;
    });

    return Object.entries(revenueMap)
      .map(([name, revenue]) => ({
        name,
        revenue: (revenue / 1000000).toFixed(1) + 'M',
        rawRevenue: revenue,
        packages: pkgCountMap[name]
      }))
      .sort((a, b) => b.rawRevenue - a.rawRevenue)
      .slice(0, 5);
  }

  /**
   * Get activity data for the last 7 days
   */
  getActivityData(data) {
    const { standardJobs, quickJobs, applications = [] } = data;
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('vi-VN', { weekday: 'short' });

      const postsCount = standardJobs.filter(j => (j.createdAt || '').startsWith(dateStr)).length +
        quickJobs.filter(j => (j.createdAt || '').startsWith(dateStr)).length;

      const appsCount = applications.filter(a => (a.createdAt || '').startsWith(dateStr)).length;

      days.push({ day: label, posts: postsCount, applications: appsCount });
    }

    return days;
  }

  /**
   * Get quarterly aggregate data
   */
  getQuarterlyData(data) {
    const { standardJobs, quickJobs } = data;
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentYear = new Date().getFullYear();

    const results = quarters.map(q => ({ name: q, jobs: 0 }));

    [...standardJobs, ...quickJobs].forEach(j => {
      const date = new Date(j.createdAt);
      if (date.getFullYear() === currentYear) {
        const qIndex = Math.floor(date.getMonth() / 3);
        results[qIndex].jobs++;
      }
    });

    return results;
  }
}

export default new AdminReportService();
