import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  BookOpen,
  CalendarCheck,
  Wallet,
  FileText,
  ClipboardList,
  Bell,
  UserCircle,
  Settings,
} from 'lucide-react'

export const MENU_ITEMS = [
  {
    heading: 'Main',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Management',
    items: [
      { label: 'Students', path: '/students', icon: GraduationCap },
      { label: 'Teachers', path: '/teachers', icon: Users },
      { label: 'Classes', path: '/classes', icon: School },
      { label: 'Subjects', path: '/subjects', icon: BookOpen },
    ],
  },
  {
    heading: 'Academics',
    items: [
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { label: 'Exams', path: '/exams', icon: FileText },
      { label: 'Marks', path: '/marks', icon: ClipboardList },
    ],
  },
  {
    heading: 'Financials',
    items: [{ label: 'Fees', path: '/fees', icon: Wallet }],
  },
  {
    heading: 'Communication',
    items: [{ label: 'Notice Board', path: '/notices', icon: Bell }],
  },
  {
    heading: 'Account',
    items: [
      { label: 'Profile', path: '/profile', icon: UserCircle },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/students/add': 'Add Student',
  '/teachers': 'Teachers',
  '/teachers/add': 'Add Teacher',
  '/classes': 'Classes',
  '/classes/add': 'Add Class',
  '/subjects': 'Subjects',
  '/subjects/add': 'Add Subject',
  '/attendance': 'Attendance',
  '/attendance/students': 'Student Attendance',
  '/attendance/teachers': 'Teacher Attendance',
  '/fees': 'Fees',
  '/exams': 'Exams',
  '/exams/create': 'Create Exam',
  '/marks': 'Marks',
  '/marks/entry': 'Marks Entry',
  '/marks/results': 'Result View',
  '/notices': 'Notice Board',
  '/notices/create': 'Create Notice',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export const CLASS_OPTIONS = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
]

export const SECTION_OPTIONS = ['A', 'B', 'C']

export const GENDER_OPTIONS = ['Male', 'Female', 'Other']

export const ATTENDANCE_STATUS = ['Present', 'Absent', 'Leave']

export const PAYMENT_STATUS = ['Paid', 'Partial', 'Pending', 'Overdue']

export const EXAM_TYPE_OPTIONS = [
  'Weekly Test',
  'Monthly Test',
  'Mid-Term',
  'Final',
]

export const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
]

export const SUPER_ADMIN_USER = {
  email: 'superadmin@school.com',
  password: 'superadmin123',
  name: 'Chief Super Administrator',
  role: 'Super Admin',
}

export const ADMIN_USER = {
  email: 'admin@school.com',
  password: 'admin123',
  name: 'Admin User',
  role: 'Admin',
}

export const TEACHER_USER = {
  email: 'teacher@school.com',
  password: 'teacher123',
  name: 'Teacher User',
  role: 'Teacher',
}

export const STUDENT_USER = {
  email: 'student@school.com',
  password: 'student123',
  name: 'Student User',
  role: 'Student',
}
