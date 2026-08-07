import * as db from './mockData'
import { generateId } from '../utils/helpers'

const DELAY = 350

function wait(ms = DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const collections = {
  students: db.students,
  teachers: db.teachers,
  classes: db.classes,
  subjects: db.subjects,
  exams: db.exams,
  notices: db.notices,
  fees: db.fees,
  marks: db.marks,
}

async function getAll(key) {
  await wait()
  return [...collections[key]]
}

async function getById(key, id) {
  await wait()
  const record = collections[key].find((item) => item.id === id)
  if (!record) throw new Error(`${key.slice(0, -1)} not found`)
  return { ...record }
}

async function create(key, data) {
  await wait()
  const record = { id: generateId(`${key.slice(0, 3).toUpperCase()}-`), ...data }
  collections[key].unshift(record)
  return { ...record }
}

async function update(key, id, data) {
  await wait()
  const index = collections[key].findIndex((item) => item.id === id)
  if (index === -1) throw new Error(`${key.slice(0, -1)} not found`)
  collections[key][index] = { ...collections[key][index], ...data, id }
  return { ...collections[key][index] }
}

async function remove(key, id) {
  await wait()
  const index = collections[key].findIndex((item) => item.id === id)
  if (index === -1) throw new Error(`${key.slice(0, -1)} not found`)
  const [removed] = collections[key].splice(index, 1)
  return removed
}

export const api = {
  getStudents: () => getAll('students'),
  getStudent: (id) => getById('students', id),
  addStudent: (data) => create('students', data),
  updateStudent: (id, data) => update('students', id, data),
  deleteStudent: (id) => remove('students', id),

  getTeachers: () => getAll('teachers'),
  getTeacher: (id) => getById('teachers', id),
  addTeacher: (data) => create('teachers', data),
  updateTeacher: (id, data) => update('teachers', id, data),
  deleteTeacher: (id) => remove('teachers', id),

  getClasses: () => getAll('classes'),
  getClass: (id) => getById('classes', id),
  addClass: (data) => create('classes', data),
  updateClass: (id, data) => update('classes', id, data),
  deleteClass: (id) => remove('classes', id),

  getSubjects: () => getAll('subjects'),
  getSubject: (id) => getById('subjects', id),
  addSubject: (data) => create('subjects', data),
  updateSubject: (id, data) => update('subjects', id, data),
  deleteSubject: (id) => remove('subjects', id),

  getFees: () => getAll('fees'),
  updateFee: (id, data) => update('fees', id, data),
  getExams: () => getAll('exams'),
  getExam: (id) => getById('exams', id),
  addExam: (data) => create('exams', data),
  updateExam: (id, data) => update('exams', id, data),
  deleteExam: (id) => remove('exams', id),

  getNotices: () => getAll('notices'),
  getNotice: (id) => getById('notices', id),
  addNotice: (data) => create('notices', data),
  updateNotice: (id, data) => update('notices', id, data),
  deleteNotice: (id) => remove('notices', id),

  getMarks: () => getAll('marks'),
  addMark: (data) => create('marks', data),
  updateMark: (id, data) => update('marks', id, data),
  deleteMark: (id) => remove('marks', id),
}

async function getStudentAttendance({ date, className, section }) {
  await wait()
  const entry = db.attendanceEntries.find(
    (item) => item.date === date && item.className === className && item.section === section,
  )
  if (!entry) {
    return db.students
      .filter((s) => s.className === className && s.section === section)
      .map((s) => ({ studentId: s.id, status: 'Present' }))
  }
  return entry.records
}

async function saveStudentAttendance({ date, className, section, records }) {
  await wait()
  const index = db.attendanceEntries.findIndex(
    (item) => item.date === date && item.className === className && item.section === section,
  )
  if (index === -1) {
    db.attendanceEntries.push({
      id: `ATT-${db.attendanceEntries.length + 1}`,
      date,
      className,
      section,
      records,
    })
  } else {
    db.attendanceEntries[index].records = records
  }
  return records
}

async function getTeacherAttendance(date) {
  await wait()
  const entry = db.teacherAttendanceEntries.find((item) => item.date === date)
  if (!entry) {
    return db.teachers.map((t) => ({ teacherId: t.id, status: 'Present' }))
  }
  return entry.records
}

async function saveTeacherAttendance({ date, records }) {
  await wait()
  const index = db.teacherAttendanceEntries.findIndex((item) => item.date === date)
  if (index === -1) {
    db.teacherAttendanceEntries.push({
      id: `TATT-${db.teacherAttendanceEntries.length + 1}`,
      date,
      records,
    })
  } else {
    db.teacherAttendanceEntries[index].records = records
  }
  return records
}

export const attendanceApi = {
  getStudentAttendance,
  saveStudentAttendance,
  getTeacherAttendance,
  saveTeacherAttendance,
}

export async function getDashboardData() {
  return {
    totalStudents: db.students.length,
    totalTeachers: db.teachers.length,
    totalClasses: db.classes.length,
    totalSubjects: db.subjects.length,
    todayAttendance: 94,
    feesCollected: db.fees.reduce((sum, fee) => sum + fee.paidFee, 0),
    upcomingExams: db.exams.filter((exam) => new Date(exam.date) >= new Date()).length,
    activities: db.activities,
    studentStats: db.studentStats,
    attendanceChart: db.attendanceEntries
      .slice(-6)
      .map((entry) => {
        const present = entry.records.filter((r) => r.status === 'Present').length
        const absent = entry.records.filter((r) => r.status === 'Absent').length
        const leave = entry.records.filter((r) => r.status === 'Leave').length
        return {
          date: entry.date.slice(5).replace('-', '/'),
          Present: present,
          Absent: absent,
          Leave: leave,
        }
      }),
  }
}
