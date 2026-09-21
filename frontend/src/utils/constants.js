import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  BookOpen,
  CalendarCheck,
  Calendar,
  Wallet,
  CreditCard,
  FileText,
  ClipboardList,
  Bell,
  UserCircle,
  Settings,
  PhoneCall,
  UserCheck,
  Award,
  Layers,
  BarChart3,
} from 'lucide-react'

export const MENU_ITEMS = [
  {
    heading: 'Main',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Academic Management',
    items: [
      { label: 'Students', path: '/students', icon: GraduationCap },
      { label: 'Student Promotion', path: '/students/promote', icon: Award },
      { label: 'Teachers', path: '/teachers', icon: Users },
      { label: 'Staff Directory', path: '/staff', icon: Users },
      { label: 'Classes', path: '/classes', icon: School },
      { label: 'Subjects', path: '/subjects', icon: BookOpen },
    ],
  },
  {
    heading: 'Learning & Classwork',
    items: [
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { label: 'Timetable', path: '/timetable', icon: Calendar },
      { label: 'Homework', path: '/homework', icon: BookOpen },
      { label: 'Assignments', path: '/assignments', icon: ClipboardList },
      { label: 'Study Material', path: '/study-material', icon: Layers },
      { label: 'Leave Requests', path: '/leave', icon: CalendarCheck },
      { label: 'School Calendar', path: '/calendar', icon: Calendar },
    ],
  },
  {
    heading: 'Assessment & Records',
    items: [
      { label: 'Exams', path: '/exams', icon: FileText },
      { label: 'Question Bank', path: '/questions', icon: BookOpen },
      { label: 'Marks', path: '/marks', icon: ClipboardList },
      { label: 'Certificates (TC)', path: '/certificates', icon: FileText },
    ],
  },
  {
    heading: 'Financials & Reports',
    items: [
      { label: 'Student Fees', path: '/fees', icon: Wallet },
      { label: 'Teacher Salary', path: '/payroll', icon: CreditCard },
      { label: 'Reports Center', path: '/reports', icon: BarChart3 },
    ],
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
  '/parents': 'Parents & Guardians',
  '/students': 'Students',
  '/students/add': 'Add Student',
  '/students/promote': 'Student Promotion',
  '/teachers': 'Teachers',
  '/teachers/add': 'Add Teacher',
  '/staff': 'Staff Directory',
  '/classes': 'Classes',
  '/classes/add': 'Add Class',
  '/subjects': 'Subjects',
  '/subjects/add': 'Add Subject',
  '/attendance': 'Attendance',
  '/attendance/students': 'Student Attendance',
  '/attendance/teachers': 'Teacher Attendance',
  '/timetable': 'Timetable Management',
  '/homework': 'Homework & Tasks',
  '/assignments': 'Assignments & Projects',
  '/study-material': 'Study Material & Notes',
  '/leave': 'Leave Management',
  '/calendar': 'School Academic Calendar',
  '/fees': 'Student Fees',
  '/payroll': 'Teacher Salary & Payroll',
  '/reports': 'Institutional Reports Center',
  '/exams': 'Exams',
  '/exams/create': 'Create Exam',
  '/questions': 'Question Bank',
  '/marks': 'Marks',
  '/marks/entry': 'Marks Entry',
  '/marks/results': 'Result View',
  '/marks/generate': 'Generate Marksheet',
  '/marksheets': 'Generate Marksheet',
  '/certificates': 'Transfer Certificates',
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

export const PARENT_USER = {
  email: 'parent@school.com',
  password: 'parent123',
  name: 'Tariq Khan (Parent)',
  role: 'Parent',
}

