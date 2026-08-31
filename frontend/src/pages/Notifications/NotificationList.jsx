import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  CalendarCheck,
  GraduationCap,
  Users,
  FileText,
  Wallet,
  Megaphone,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { cn } from '../../utils/helpers';

const TYPE_CONFIG = {
  STUDENT_ADMISSION: {
    label: 'Admission',
    icon: GraduationCap,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    badgeVariant: 'primary',
  },
  TEACHER_ONBOARDING: {
    label: 'Faculty',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    badgeVariant: 'success',
  },
  ATTENDANCE: {
    label: 'Attendance',
    icon: CalendarCheck,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    badgeVariant: 'warning',
  },
  EXAM: {
    label: 'Exam',
    icon: FileText,
    color: 'text-violet-600 bg-violet-50 border-violet-100',
    badgeVariant: 'purple',
  },
  EXAM_RESULT: {
    label: 'Results',
    icon: FileText,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    badgeVariant: 'purple',
  },
  FEE: {
    label: 'Fee',
    icon: Wallet,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
    badgeVariant: 'danger',
  },
  NOTICE: {
    label: 'Notice',
    icon: Megaphone,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
    badgeVariant: 'info',
  },
  GENERAL: {
    label: 'System',
    icon: Bell,
    color: 'text-slate-600 bg-slate-100 border-slate-200',
    badgeVariant: 'secondary',
  },
};

function NotificationList() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendTestNotification,
    permission,
    requestPermissionAndRegister,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'UNREAD' && n.isRead) return false;
      if (activeTab === 'ADMISSIONS' && n.type !== 'STUDENT_ADMISSION' && n.type !== 'TEACHER_ONBOARDING') return false;
      if (activeTab === 'ATTENDANCE' && n.type !== 'ATTENDANCE') return false;
      if (activeTab === 'EXAMS' && n.type !== 'EXAM' && n.type !== 'EXAM_RESULT') return false;
      if (activeTab === 'FEES' && n.type !== 'FEE') return false;
      if (activeTab === 'NOTICES' && n.type !== 'NOTICE') return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (n.title || '').toLowerCase().includes(term);
        const bodyMatch = (n.body || '').toLowerCase().includes(term);
        return titleMatch || bodyMatch;
      }

      return true;
    });
  }, [notifications, activeTab, searchTerm]);

  const handleAction = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    const url = item.data?.url;
    if (url) {
      navigate(url);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Live Firebase Push & In-App activity alerts across all school operations"
        breadcrumb={[{ label: 'Notifications' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={fetchNotifications}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Bell}
              onClick={sendTestNotification}
            >
              Send Test Push
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={CheckCheck}
                onClick={markAllAsRead}
              >
                Mark All as Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                leftIcon={Trash2}
                onClick={clearAllNotifications}
              >
                Clear All
              </Button>
            )}
          </div>
        }
      />

      {permission !== 'granted' && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Bell size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-amber-900">Enable Desktop Push Notifications</p>
                <p className="text-xs text-amber-700">
                  Receive instant alerts for student admissions, attendance absences, exam marks, and announcements.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              onClick={requestPermissionAndRegister}
            >
              Allow Notifications
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Alerts', count: notifications.length },
              { id: 'UNREAD', label: 'Unread', count: unreadCount },
              { id: 'ADMISSIONS', label: 'Admissions' },
              { id: 'ATTENDANCE', label: 'Attendance' },
              { id: 'EXAMS', label: 'Exams & Results' },
              { id: 'FEES', label: 'Fees' },
              { id: 'NOTICES', label: 'Notices' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition',
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card className="overflow-hidden p-0">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Bell size={28} />
            </div>
            <p className="text-sm font-semibold text-slate-700">No notifications found</p>
            <p className="mt-1 text-xs text-slate-400">
              {searchTerm ? 'Try searching with different keywords.' : 'All caught up! No recent activity to show.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.GENERAL;
              const Icon = config.icon;
              const hasUrl = Boolean(item.data?.url);

              return (
                <div
                  key={item.id}
                  className={cn(
                    'group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 transition hover:bg-slate-50/80',
                    !item.isRead && 'bg-indigo-50/25'
                  )}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs mt-0.5',
                        config.color
                      )}
                    >
                      <Icon size={18} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('text-sm font-bold', !item.isRead ? 'text-slate-900' : 'text-slate-700')}>
                          {item.title}
                        </p>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                          {config.label}
                        </span>
                        {!item.isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">{item.body}</p>

                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : 'Just now'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {hasUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-indigo-600 hover:bg-indigo-50 text-xs font-semibold"
                        rightIcon={ArrowRight}
                        onClick={() => handleAction(item)}
                      >
                        View Details
                      </Button>
                    )}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(item.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default NotificationList;
