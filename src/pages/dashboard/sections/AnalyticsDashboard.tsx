import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  BarChart3, 
  Eye, 
  TrendingUp,
  ShoppingCart,
  Users,
  Gift,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { apiCall, API_ENDPOINTS } from '../../../config/api';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { smartToast } from '../../../utils/toastConfig';
import Spinner from '../../../components/ui/Spinner';


interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  selectedOptions?: { [key: string]: string };
  optionsPricing?: { [key: string]: number };
  productImage?: string;
  attachments?: {
    images?: string[];
    text?: string;
  };
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  couponDiscount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  createdAt: string;
  notes?: string;
}

interface Customer {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  lastLogin?: string;
  createdAt: string;
  status?: 'active' | 'inactive';
  cartItemsCount?: number;
  wishlistItemsCount?: number;
}

interface Coupon {
  id: number;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface VisitorStats {
  totalVisitors: number;
  monthlyVisitors: number;
  dailyVisitors: number;
}

interface DailySalesData {
  date: string;
  sales: number;
  orders: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    totalVisitors: 0,
    monthlyVisitors: 0,
    dailyVisitors: 0
  });
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<{ month: string; sales: number; orders: number }[]>([]);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const availableYears = React.useMemo(() => {
    const ys = new Set<number>();
    orders.forEach(o => ys.add(new Date(o.createdAt).getFullYear()));
    const arr = Array.from(ys).sort((a,b) => b-a);
    return arr.length > 0 ? arr : [new Date().getFullYear()];
  }, [orders]);
  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [orders, selectedYear, selectedMonth]);
  const { data: ordersData, isLoading: ordersLoading } = useApiQuery<any>({ endpoint: API_ENDPOINTS.ORDERS, queryKey: ['orders'] });
  const { data: customersData, isLoading: customersLoading } = useApiQuery<any>({ endpoint: API_ENDPOINTS.CUSTOMERS, queryKey: ['customers'] });
  const { data: couponsData, isLoading: couponsLoading } = useApiQuery<any>({ endpoint: API_ENDPOINTS.COUPONS, queryKey: ['coupons'] });
  const loading = ordersLoading || customersLoading || couponsLoading;

  useEffect(() => {
    if (!ordersData) return;
    const arr = Array.isArray(ordersData) ? ordersData : ordersData?.orders || ordersData?.data || [];
    setOrders(arr);
  }, [ordersData]);

  useEffect(() => {
    if (!customersData) return;
    const arr = Array.isArray(customersData) ? customersData : customersData?.customers || customersData?.data || [];
    setCustomers(arr);
  }, [customersData]);

  useEffect(() => {
    if (!couponsData) return;
    const arr = Array.isArray(couponsData) ? couponsData : couponsData?.coupons || couponsData?.data || [];
    setCoupons(arr);
  }, [couponsData]);

  // Fetch orders
  

  // Fetch customers
  

  // Fetch coupons
  

  // Fetch visitor stats
  const fetchVisitorStats = async () => {
    try {
      // In a real app, you would fetch this from an analytics API
      // For now, we'll use mock data
      setVisitorStats({
        totalVisitors: 12500,
        monthlyVisitors: 3200,
        dailyVisitors: 120
      });
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
      smartToast.dashboard.error('فشل في جلب إحصائيات الزوار');
    }
  };

  const generateDailySalesData = () => {
    const year = selectedYear;
    const monthIndex = selectedMonth;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const salesByDate: { [key: string]: { sales: number; orders: number } } = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = new Date(year, monthIndex, d).toISOString().split('T')[0];
      salesByDate[key] = { sales: 0, orders: 0 };
    }
    orders.forEach(order => {
      const od = new Date(order.createdAt);
      if (od.getFullYear() === year && od.getMonth() === monthIndex && (order.status === 'delivered' || order.status === 'confirmed')) {
        const key = new Date(od.getFullYear(), od.getMonth(), od.getDate()).toISOString().split('T')[0];
        if (salesByDate[key]) {
          salesByDate[key].sales += order.total;
          salesByDate[key].orders += 1;
        }
      }
    });
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, monthIndex, i + 1);
      const key = date.toISOString().split('T')[0];
      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        sales: salesByDate[key]?.sales || 0,
        orders: salesByDate[key]?.orders || 0
      };
    });
    setDailySalesData(data);
  };

// في دالة generateMonthlySalesData، استبدل الكود الحالي بهذه الدالة الجديدة:
const generateMonthlySalesData = () => {
  const year = selectedYear;
  const monthly: { sales: number; orders: number }[] = Array.from({ length: 12 }, () => ({ sales: 0, orders: 0 }));
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (orderDate.getFullYear() === year && (order.status === 'delivered' || order.status === 'confirmed')) {
      const monthIndex = orderDate.getMonth();
      monthly[monthIndex].sales += order.total;
      monthly[monthIndex].orders += 1;
    }
  });
  const data = monthly.map((value, index) => ({
    month: months[index],
    sales: value.sales,
    orders: value.orders
  }));
  setMonthlySalesData(data);
};

  // Calculate metrics
  const calculateMetrics = (source: Order[]) => {
    // Total sales
    const totalSales = source.reduce((total, order) => total + order.total, 0);

    // Products sold
    const productsSold = source.reduce((total, order) => 
      total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
    );

    // Average order value
    const averageOrderValue = source.length > 0 ? totalSales / source.length : 0;

    // Growth calculations
    const lastMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const lastYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastYear;
    });

    const currentMonthSales = source.reduce((total, order) => total + order.total, 0);
    const lastMonthSales = lastMonthOrders.reduce((total, order) => total + order.total, 0);
    const currentMonthItems = source.reduce((total, order) => 
      total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
    );
    const lastMonthItems = lastMonthOrders.reduce((total, order) => 
      total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
    );
    const currentMonthAvg = source.length > 0 ? currentMonthSales / source.length : 0;
    const lastMonthAvg = lastMonthOrders.length > 0 ? lastMonthSales / lastMonthOrders.length : 0;

    const salesGrowth = lastMonthSales === 0 && currentMonthSales > 0 ? 100 : 
                       lastMonthSales === 0 && currentMonthSales === 0 ? 0 : 
                       ((currentMonthSales - lastMonthSales) / lastMonthSales * 100);
    
    const itemsGrowth = lastMonthItems === 0 && currentMonthItems > 0 ? 100 : 
                       lastMonthItems === 0 && currentMonthItems === 0 ? 0 : 
                       ((currentMonthItems - lastMonthItems) / lastMonthItems * 100);
    
    const avgGrowth = lastMonthAvg === 0 && currentMonthAvg > 0 ? 100 : 
                     lastMonthAvg === 0 && currentMonthAvg === 0 ? 0 : 
                     ((currentMonthAvg - lastMonthAvg) / lastMonthAvg * 100);

    return {
      totalSales,
      productsSold,
      averageOrderValue,
      salesGrowth,
      itemsGrowth,
      avgGrowth
    };
  };

// Calculate top products
const getTopProducts = (source: Order[]) => {
  const productSales: { [key: string]: number } = {};
  
  // ✅ بدون فلترة حالة الطلب - زي الكود القديم بالضبط
  source.forEach(order => {
    order.items.forEach(item => {
      if (productSales[item.productName]) {
        productSales[item.productName] += item.quantity;
      } else {
        productSales[item.productName] = item.quantity;
      }
    });
  });
  
  // ✅ ترتيب وأخذ أول 5
  return Object.entries(productSales)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([productName, quantity]) => ({ 
      productName, 
      quantity: quantity as number 
    }));
};

  // Calculate order status distribution
  const getOrderStatusDistribution = (source: Order[]) => {
    return [
      { status: 'delivered', label: 'مكتملة', count: source.filter(o => o.status === 'delivered').length, color: '#10B981' },
      { status: 'confirmed', label: 'مؤكدة', count: source.filter(o => o.status === 'confirmed').length, color: '#059669' },
      { status: 'preparing', label: 'قيد التحضير', count: source.filter(o => o.status === 'preparing').length, color: '#F59E0B' },
      { status: 'pending', label: 'معلقة', count: source.filter(o => o.status === 'pending').length, color: '#EAB308' },
      { status: 'cancelled', label: 'ملغية', count: source.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
    ];
  };

// Calculate customer metrics
const getCustomerMetrics = (source: Order[]) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000);
  
  const newCustomersThisMonth = customers.filter(c => {
    const d = new Date(c.createdAt);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  }).length;
  
  // Calculate customer spending
  const customerSpending: { [key: string]: number } = {};
  source.forEach(order => {
    customerSpending[order.customerName] = (customerSpending[order.customerName] || 0) + order.total;
  });
  
  const topCustomer = Object.entries(customerSpending)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  // Calculate returning customers
  const customerOrderCounts: { [key: string]: number } = {};
  source.forEach(order => {
    customerOrderCounts[order.customerName] = (customerOrderCounts[order.customerName] || 0) + 1;
  });
  
  const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
  const totalCustomersWithOrders = Object.keys(customerOrderCounts).length;
  const returningCustomerPercentage = totalCustomersWithOrders > 0 
    ? (returningCustomers / totalCustomersWithOrders) * 100 
    : 0;

  // ✅ حساب عملاء لديهم عناصر في السلة
  let customersWithCart = 0;
  
  try {
    // 1. عد العملاء الذين لديهم طلبات نشطة (pending, confirmed, preparing)
    const customersWithActiveOrders = new Set<string>();
    orders.forEach(order => {
      if (['pending', 'confirmed', 'preparing'].includes(order.status)) {
        customersWithActiveOrders.add(order.customerEmail || order.customerName);
      }
    });
    
    customersWithCart = customersWithActiveOrders.size;
    
    // 2. إضافة العملاء من بيانات الـ API (إذا كان الـ API يرجع cartItemsCount)
    customers.forEach(customer => {
      if (customer.cartItemsCount && customer.cartItemsCount > 0) {
        customersWithCart++;
      }
    });
    
  } catch (error) {
    console.warn('Error calculating customers with cart:', error);
    customersWithCart = 0;
  }

  return {
    totalCustomers: customers.length,
    newCustomersThisMonth,
    avgOrdersPerCustomer: customers.length > 0 ? orders.length / customers.length : 0,
    topCustomerSpending: topCustomer ? topCustomer[1] : 0,
    returningCustomers,
    returningCustomerPercentage,
    customersWithCart // ✅ إضافة العدد الجديد
  };
};

  // Calculate coupon metrics
const getCouponMetrics = (source: Order[]) => {
    const activeCoupons = coupons.filter(c => c.isActive).length;
  const ordersWithCoupons = source.filter(o => o.couponDiscount && o.couponDiscount > 0).length;
  const totalDiscount = source.reduce((total, order) => total + (order.couponDiscount || 0), 0);
  const ordersWithCouponsCount = source.filter(o => o.couponDiscount && o.couponDiscount > 0).length;
    
    const avgDiscount = ordersWithCouponsCount > 0 
      ? totalDiscount / ordersWithCouponsCount 
      : 0;

    return {
      activeCoupons,
      usageRate: source.length > 0 ? (ordersWithCoupons / source.length) * 100 : 0,
      totalDiscount,
      avgDiscount
    };
  };

// في السطر ~345
useEffect(() => {
  fetchVisitorStats();
}, []);

// ✅ أضف useEffect جديد لتوليد البيانات عندما تتغير الطلبات
useEffect(() => {
  generateDailySalesData();
  generateMonthlySalesData();
}, [orders, selectedYear, selectedMonth]);

  if (loading) {
    return <Spinner overlay />;
  }

// في السطر ~364 تقريباً (قبل return مباشرة)
const metrics = calculateMetrics(filteredOrders);
const topProducts = getTopProducts(filteredOrders);
const orderStatusDistribution = getOrderStatusDistribution(filteredOrders);
const customerMetrics = getCustomerMetrics(filteredOrders);
const couponMetrics = getCouponMetrics(filteredOrders);

 return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#203f61] to-[#2a537e] text-white rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8" />
              نظام التحليلات والإحصائيات
            </h2>
            <p className="text-gray-200">تحليل شامل ومتقدم لأداء المتجر والمبيعات مع رؤى تفصيلية لاتخاذ قرارات مدروسة</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-white min-w-[120px]"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-white min-w-[140px]"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#203f61] to-[#2a537e] rounded-lg flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.totalSales.toLocaleString('ar-SA')} ر.س
              </div>
              <div className="text-sm text-gray-600">إجمالي المبيعات</div>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
            <span className="text-green-600 font-medium">
              {metrics.salesGrowth >= 0 ? `+${metrics.salesGrowth.toFixed(1)}%` : `${metrics.salesGrowth.toFixed(1)}%`}
            </span>
            <span className="text-gray-600 mr-2">من الشهر الماضي</span>
          </div>
        </div>

        {/* Products Sold */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#203f61] to-[#2a537e] rounded-lg flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.productsSold}
              </div>
              <div className="text-sm text-gray-600">المنتجات المباعة</div>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
            <span className="text-green-600 font-medium">
              {metrics.itemsGrowth >= 0 ? `+${metrics.itemsGrowth.toFixed(1)}%` : `${metrics.itemsGrowth.toFixed(1)}%`}
            </span>
            <span className="text-gray-600 mr-2">من الشهر الماضي</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#203f61] to-[#2a537e] rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.averageOrderValue.toFixed(0)} ر.س
              </div>
              <div className="text-sm text-gray-600">متوسط قيمة الطلب</div>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
            <span className="text-green-600 font-medium">
              {metrics.avgGrowth >= 0 ? `+${metrics.avgGrowth.toFixed(1)}%` : `${metrics.avgGrowth.toFixed(1)}%`}
            </span>
            <span className="text-gray-600 mr-2">من الشهر الماضي</span>
          </div>
        </div>

        {/* Visitors Stats */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#203f61] to-[#2a537e] rounded-lg flex items-center justify-center shadow-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {visitorStats.monthlyVisitors.toLocaleString('ar-SA')}
              </div>
              <div className="text-sm text-gray-600">الزوار الشهريين</div>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-900 font-medium">
              {visitorStats.dailyVisitors} يومياً
            </span>
            <span className="text-gray-600 mr-2">متوسط الزوار</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#203f61] text-white px-6 py-4">
            <h3 className="text-lg font-bold flex items-center">
              <BarChart3 className="w-5 h-5 ml-2" />
              المبيعات حسب الأشهر
            </h3>
          </div>
          <div className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#203f61" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#203f61] text-white px-6 py-4">
            <h3 className="text-lg font-bold">🏆 أعلى المنتجات مبيعاً</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.productName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#203f61] text-white rounded-lg flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.productName}</div>
                      <div className="text-sm text-gray-600">{product.quantity} قطعة مباعة</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#203f61] h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min((product.quantity / Math.max(...topProducts.map(p => p.quantity))) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#203f61] text-white px-6 py-4">
            <h3 className="text-lg font-bold">توزيع حالات الطلبات</h3>
          </div>
          <div className="p-6 space-y-3">
            {orderStatusDistribution.map(item => (
              <div key={item.status} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Analytics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#203f61] text-white px-6 py-4">
            <h3 className="text-lg font-bold">تحليل العملاء</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">إجمالي العملاء</span>
              <span className="font-bold text-gray-900">{customerMetrics.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">عملاء جدد هذا الشهر</span>
              <span className="font-bold text-green-600">+{customerMetrics.newCustomersThisMonth}</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">متوسط الطلبات لكل عميل</span>
              <span className="font-bold text-blue-600">{customerMetrics.avgOrdersPerCustomer.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">أعلى عميل إنفاقاً</span>
              <span className="font-bold text-purple-600">{customerMetrics.topCustomerSpending.toFixed(0)} ر.س</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">العملاء المتكررين</span>
              <span className="font-bold text-indigo-600">{customerMetrics.returningCustomers}</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">نسبة العملاء المتكررين</span>
              <span className="font-bold text-teal-600">{customerMetrics.returningCustomerPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">عملاء لديهم عناصر في السلة</span>
              <span className="font-bold text-orange-600">{customerMetrics.customersWithCart}</span>
            </div>
          </div>
        </div>

        {/* Coupon Performance */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#203f61] text-white px-6 py-4">
            <h3 className="text-lg font-bold">أداء الكوبونات</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">الكوبونات النشطة</span>
              <span className="font-bold text-gray-900">{couponMetrics.activeCoupons}</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">معدل الاستخدام</span>
              <span className="font-bold text-green-600">{couponMetrics.usageRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">إجمالي الخصم المطبق</span>
              <span className="font-bold text-red-600">{couponMetrics.totalDiscount.toFixed(0)} ر.س</span>
            </div>
            <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">متوسط قيمة الخصم</span>
              <span className="font-bold text-orange-600">{couponMetrics.avgDiscount.toFixed(0)} ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
