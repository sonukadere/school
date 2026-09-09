import { apiClient } from './apiClient'

// -------------------------------------------------------------
// Normalization Helpers (Mapping backend schemas to UI props)
// -------------------------------------------------------------

function normalizeStudent(s) {
  if (!s) return null
  const cleanStudentId =
    s.studentId && (!s.studentId.startsWith('cm') || s.studentId.length <= 15)
      ? s.studentId
      : (s.id && s.id.startsWith('STU') ? s.id : (s.studentId || (s.id ? `STU-${s.id.slice(-4).toUpperCase()}` : 'STU-001')))
  return {
    ...s,
    id: s.id,
    studentId: cleanStudentId,
    fullName: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}`.trim() : (s.name || s.firstName || 'Student'),
    firstName: s.firstName,
    lastName: s.lastName,
    className: s.class?.name || s.className || '',
    section: s.class?.section || s.section || '',
    rollNumber: s.rollNumber ?? '',
    gender: s.gender === 'MALE' ? 'Male' : s.gender === 'FEMALE' ? 'Female' : s.gender === 'OTHER' ? 'Other' : s.gender || '',
    dob: s.dob ? s.dob.slice(0, 10) : '',
    admissionDate: s.admissionDate ? s.admissionDate.slice(0, 10) : '',
    email: s.email || '',
    phone: s.phone || '',
    address: s.address || '',
    fatherName: s.fatherName || '',
    motherName: s.motherName || '',
    status: s.status === 'ACTIVE' ? 'Active' : s.status === 'INACTIVE' ? 'Inactive' : s.status || 'Active',
  }
}

function normalizeTeacher(t) {
  if (!t) return null
  return {
    ...t,
    id: t.id,
    teacherId: t.teacherId,
    name: t.name,
    email: t.email || '',
    phone: t.phone || '',
    qualification: t.qualification || '',
    salary: t.salary ? Number(t.salary) : 0,
    joiningDate: t.joiningDate ? t.joiningDate.slice(0, 10) : '',
    address: t.address || '',
    subject: t.subject?.name || t.subjectName || t.subject || 'General',
    className: t.classes?.[0]?.name || t.className || '',
    status: t.status || 'Active',
  }
}

function normalizeClass(c) {
  if (!c) return null
  const teacherName =
    typeof c.classTeacher === 'string'
      ? c.classTeacher
      : c.classTeacher?.name || 'Not Assigned'
  return {
    ...c,
    id: c.id,
    name: c.name,
    section: c.section,
    roomNumber: c.roomNumber || '',
    classTeacherId: c.classTeacherId || c.classTeacher?.id || null,
    classTeacher: teacherName,
    classTeacherName: teacherName,
    studentCount: c._count?.students ?? c.students?.length ?? 0,
    subjectCount: c._count?.subjects ?? c.subjects?.length ?? 0,
  }
}

function normalizeSubject(s) {
  if (!s) return null
  const teacherName =
    typeof s.teacher === 'string'
      ? s.teacher
      : s.teacher?.name || (typeof s.assignedTeacher === 'string' ? s.assignedTeacher : 'Not Assigned')
  return {
    ...s,
    id: s.id,
    name: s.name,
    code: s.code,
    classId: s.classId,
    className: s.class ? `${s.class.name} ${s.class.section || ''}`.trim() : (s.className || ''),
    teacherId: s.teacherId || s.teacher?.id || null,
    assignedTeacher: teacherName,
    teacherName: teacherName,
  }
}

function normalizeFee(f) {
  if (!f) return null
  const total = Number(f.totalFee || 0)
  const paid = Number(f.paidAmount || f.paidFee || 0)
  const due = Number(f.dueAmount ?? (total - paid))
  return {
    ...f,
    id: f.id,
    studentId: f.studentId,
    studentName: f.student ? `${f.student.firstName} ${f.student.lastName}`.trim() : (f.studentName || 'Student'),
    className: f.student?.class ? `${f.student.class.name} ${f.student.class.section}`.trim() : (f.className || ''),
    totalFee: total,
    paidFee: paid,
    dueFee: due,
    paymentDate: f.paymentDate ? f.paymentDate.slice(0, 10) : null,
    status: f.paymentStatus === 'PAID' ? 'Paid' : f.paymentStatus === 'PARTIAL' ? 'Partial' : 'Pending',
    paymentStatus: f.paymentStatus,
    paymentMethod: f.paymentMethod || 'CASH',
  }
}

function normalizeExam(e) {
  if (!e) return null
  return {
    ...e,
    id: e.id,
    name: e.name,
    classId: e.classId,
    className: e.class ? `${e.class.name} ${e.class.section || ''}`.trim() : (e.className || ''),
    subject: e.subjectName || e.subject?.name || e.subject || 'All Subjects',
    subjectName: e.subjectName || e.subject?.name || e.subject || 'All Subjects',
    type: e.type || 'NORMAL',
    status: e.status || 'DRAFT',
    board: e.board || 'CBSE',
    totalMarks: e.totalMarks ?? 100,
    passingMarks: e.passingMarks ?? 33,
    durationMinutes: e.durationMinutes ?? 180,
    instructions: e.instructions || '',
    questionCount: e._count?.questions ?? (Array.isArray(e.questions) ? e.questions.length : 0),
    questions: e.questions || [],
    date: e.startDate ? e.startDate.slice(0, 10) : (e.date || ''),
    startDate: e.startDate ? e.startDate.slice(0, 10) : '',
    endDate: e.endDate ? e.endDate.slice(0, 10) : '',
  }
}

function normalizeMark(m) {
  if (!m) return null
  return {
    ...m,
    id: m.id,
    studentId: m.studentId,
    examId: m.examId,
    subjectId: m.subjectId,
    subject: m.subject?.name || m.subject || '',
    marks: Number(m.marks || 0),
    maxMarks: Number(m.maxMarks || 100),
    grade: m.grade || '',
    remarks: m.remarks || '',
  }
}

function normalizeNotice(n) {
  if (!n) return null
  return {
    ...n,
    id: n.id,
    title: n.title,
    description: n.description || '',
    date: n.publishDate ? n.publishDate.slice(0, 10) : (n.date || ''),
    publishDate: n.publishDate,
    priority: n.priority || 'Medium',
    audience: n.audience || 'ALL',
  }
}

// -------------------------------------------------------------
// Core API Methods (Live Backend Integration)
// -------------------------------------------------------------

export async function getDashboardData() {
  try {
    const data = await apiClient.get('/dashboard')
    if (!data) throw new Error('No dashboard data received')

    return {
      totalStudents: data.widgets?.totalStudents ?? 0,
      totalTeachers: data.widgets?.totalTeachers ?? 0,
      totalClasses: data.widgets?.totalClasses ?? 0,
      totalSubjects: data.widgets?.totalSubjects ?? 0,
      todayAttendance: data.widgets?.todayAttendance ?? data.widgets?.attendancePercentage ?? 0,
      feesCollected: data.widgets?.monthlyFeeCollection ?? 0,
      upcomingExams: Array.isArray(data.widgets?.upcomingExams) ? data.widgets.upcomingExams.length : (data.widgets?.upcomingExams ?? 0),
      activities: data.widgets?.recentActivities ?? [],
      studentStats: data.charts?.studentStats?.map((s) => ({ name: s.name, students: s.count })) ?? [],
      attendanceChart: data.charts?.attendanceChart ?? [],
      role: data.role,
      roleLabel: data.roleLabel,
      widgets: data.widgets || {},
      studentSummary: data.role === 'STUDENT' ? {
        profile: data.widgets?.profile,
        attendancePercentage: data.widgets?.attendancePercentage ?? 0,
        subjects: data.widgets?.subjects || [],
        timetable: data.widgets?.timetable || [],
        upcomingExams: data.widgets?.upcomingExams || [],
        results: data.widgets?.results || [],
        feeStatus: data.widgets?.feeStatus,
        notices: data.widgets?.notices || [],
        events: data.widgets?.events || [],
      } : null,
      raw: data,
    }
  } catch (error) {
    console.error('[api] getDashboardData error:', error.message)
    throw error
  }
}

// -------------------------------------------------------------
// Unified API Object (Exported for all components)
// -------------------------------------------------------------

export const api = {
  // --- Students ---
  getStudents: async (params = {}) => {
    const res = await apiClient.get('/students', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeStudent)
  },

  getStudent: async (id) => {
    const res = await apiClient.get(`/students/${id}`)
    return normalizeStudent(res)
  },

  addStudent: async (data) => {
    // Resolve classId if className & section provided
    let classId = data.classId
    if (!classId && data.className) {
      const classes = await api.getClasses()
      const found = classes.find(
        (c) => c.name === data.className && (!data.section || c.section === data.section)
      )
      if (found) classId = found.id
    }

    const payload = {
      firstName: data.firstName || data.fullName?.split(' ')[0] || 'Student',
      lastName: data.lastName || data.fullName?.split(' ').slice(1).join(' ') || '.',
      email: data.email || null,
      phone: data.phone || null,
      gender: data.gender ? data.gender.toUpperCase() : 'MALE',
      dob: data.dob ? new Date(data.dob) : null,
      address: data.address || null,
      fatherName: data.fatherName || null,
      motherName: data.motherName || null,
      rollNumber: data.rollNumber ? Number(data.rollNumber) : null,
      admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
      classId: classId || null,
      section: data.section || null,
      status: 'ACTIVE',
      createLoginAccount: data.createLoginAccount !== false,
      username: data.username || null,
      password: data.password || null,
    }

    const res = await apiClient.post('/students', payload)
    const normalized = normalizeStudent(res)
    if (res?.credentials) {
      normalized.credentials = res.credentials
    }
    return normalized
  },

  registerStudent: async (data) => {
    const payload = {
      firstName: data.firstName || data.fullName?.split(' ')[0] || 'Student',
      lastName: data.lastName || data.fullName?.split(' ').slice(1).join(' ') || '.',
      email: data.email || null,
      phone: data.phone || null,
      gender: data.gender ? data.gender.toUpperCase() : 'OTHER',
      dob: data.dob ? new Date(data.dob) : null,
      address: data.address || null,
      fatherName: data.fatherName || null,
      motherName: data.motherName || null,
      className: data.className || null,
      section: data.section || null,
      username: data.username || null,
      password: data.password,
    }
    return apiClient.post('/auth/register-student', payload)
  },

  resetStudentCredentials: async (id, data) => {
    return apiClient.post(`/students/${id}/credentials`, data)
  },

  updateStudent: async (id, data) => {
    let classId = data.classId
    if (!classId && data.className) {
      const classes = await api.getClasses()
      const found = classes.find(
        (c) => c.name === data.className && (!data.section || c.section === data.section)
      )
      if (found) classId = found.id
    }

    const payload = {
      ...(data.firstName ? { firstName: data.firstName } : data.fullName ? { firstName: data.fullName.split(' ')[0] } : {}),
      ...(data.lastName ? { lastName: data.lastName } : data.fullName ? { lastName: data.fullName.split(' ').slice(1).join(' ') || '.' } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.gender ? { gender: data.gender.toUpperCase() } : {}),
      ...(data.dob ? { dob: new Date(data.dob) } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.fatherName !== undefined ? { fatherName: data.fatherName || null } : {}),
      ...(data.motherName !== undefined ? { motherName: data.motherName || null } : {}),
      ...(data.rollNumber !== undefined ? { rollNumber: Number(data.rollNumber) } : {}),
      ...(classId ? { classId } : {}),
      ...(data.section ? { section: data.section } : {}),
    }

    const res = await apiClient.put(`/students/${id}`, payload)
    return normalizeStudent(res)
  },

  deleteStudent: async (id) => {
    return apiClient.delete(`/students/${id}`)
  },

  // --- Teachers ---
  getTeachers: async (params = {}) => {
    const res = await apiClient.get('/teachers', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeTeacher)
  },

  getTeacher: async (id) => {
    const res = await apiClient.get(`/teachers/${id}`)
    return normalizeTeacher(res)
  },

  addTeacher: async (data) => {
    const payload = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      qualification: data.qualification || null,
      salary: data.salary ? Number(data.salary) : null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
      address: data.address || null,
      createLoginAccount: data.createLoginAccount !== false,
      username: data.username || null,
      password: data.password || null,
    }
    const res = await apiClient.post('/teachers', payload)
    const normalized = normalizeTeacher(res)
    if (res?.credentials) {
      normalized.credentials = res.credentials
    }
    return normalized
  },

  resetTeacherCredentials: async (id, data) => {
    return apiClient.post(`/teachers/${id}/credentials`, data)
  },

  updateTeacher: async (id, data) => {
    const payload = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.qualification !== undefined ? { qualification: data.qualification || null } : {}),
      ...(data.salary !== undefined ? { salary: Number(data.salary) } : {}),
      ...(data.joiningDate ? { joiningDate: new Date(data.joiningDate) } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
    }
    const res = await apiClient.put(`/teachers/${id}`, payload)
    return normalizeTeacher(res)
  },

  deleteTeacher: async (id) => {
    return apiClient.delete(`/teachers/${id}`)
  },

  // --- Classes ---
  getClasses: async (params = {}) => {
    const res = await apiClient.get('/classes', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeClass)
  },

  getClass: async (id) => {
    const res = await apiClient.get(`/classes/${id}`)
    return normalizeClass(res)
  },

  addClass: async (data) => {
    let teacherId = data.classTeacherId
    if (!teacherId && data.classTeacher) {
      try {
        const teachers = await api.getTeachers()
        const found = teachers.find(
          (t) => t.id === data.classTeacher || t.name?.toLowerCase() === data.classTeacher?.toLowerCase()
        )
        if (found) teacherId = found.id
      } catch (err) {
        console.warn('Could not resolve teacher', err)
      }
    }
    const payload = {
      name: data.name,
      section: data.section || 'A',
      roomNumber: data.roomNumber || null,
      classTeacherId: teacherId || null,
    }
    const res = await apiClient.post('/classes', payload)
    return normalizeClass(res)
  },

  updateClass: async (id, data) => {
    let teacherId = data.classTeacherId
    if (teacherId === undefined && data.classTeacher !== undefined) {
      try {
        const teachers = await api.getTeachers()
        const found = teachers.find(
          (t) => t.id === data.classTeacher || t.name?.toLowerCase() === data.classTeacher?.toLowerCase?.()
        )
        teacherId = found ? found.id : null
      } catch (err) {
        console.warn('Could not resolve teacher', err)
      }
    }
    const payload = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.section ? { section: data.section } : {}),
      ...(data.roomNumber !== undefined ? { roomNumber: data.roomNumber || null } : {}),
      ...(teacherId !== undefined ? { classTeacherId: teacherId || null } : {}),
    }
    const res = await apiClient.put(`/classes/${id}`, payload)
    return normalizeClass(res)
  },

  deleteClass: async (id) => {
    return apiClient.delete(`/classes/${id}`)
  },

  // --- Subjects ---
  getSubjects: async (params = {}) => {
    const res = await apiClient.get('/subjects', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeSubject)
  },

  getSubject: async (id) => {
    const res = await apiClient.get(`/subjects/${id}`)
    return normalizeSubject(res)
  },

  addSubject: async (data) => {
    let classId = data.classId
    if (!classId && data.className) {
      const classes = await api.getClasses()
      const found = classes.find(
        (c) =>
          c.name === data.className ||
          `${c.name} ${c.section || ''}`.trim() === data.className ||
          c.id === data.className
      )
      if (found) classId = found.id
    }

    let teacherId = data.teacherId || null
    if (!teacherId && data.assignedTeacher) {
      const teachers = await api.getTeachers()
      const foundTeacher = teachers.find(
        (t) =>
          t.name?.toLowerCase() === data.assignedTeacher.toLowerCase() ||
          t.id === data.assignedTeacher
      )
      if (foundTeacher) teacherId = foundTeacher.id
    }

    const payload = {
      name: data.name,
      code: data.code || `${data.name.slice(0, 3).toUpperCase()}-101`,
      classId: classId,
      teacherId: teacherId,
    }
    const res = await apiClient.post('/subjects', payload)
    return normalizeSubject(res)
  },

  updateSubject: async (id, data) => {
    const payload = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.code ? { code: data.code } : {}),
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.teacherId !== undefined ? { teacherId: data.teacherId || null } : {}),
    }
    const res = await apiClient.put(`/subjects/${id}`, payload)
    return normalizeSubject(res)
  },

  deleteSubject: async (id) => {
    return apiClient.delete(`/subjects/${id}`)
  },

  // --- Fees (Legacy & Invoices) ---
  getFees: async (params = {}) => {
    const res = await apiClient.get('/fees', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeFee)
  },

  getFee: async (id) => {
    const res = await apiClient.get(`/fees/${id}`)
    return normalizeFee(res)
  },

  addFee: async (data) => {
    const payload = {
      studentId: data.studentId,
      totalFee: Number(data.totalFee),
      paidAmount: Number(data.paidAmount || data.paidFee || 0),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      paymentMethod: data.paymentMethod || 'CASH',
      paymentStatus: data.paymentStatus || (Number(data.paidAmount) >= Number(data.totalFee) ? 'PAID' : Number(data.paidAmount) > 0 ? 'PARTIAL' : 'PENDING'),
    }
    const res = await apiClient.post('/fees', payload)
    return normalizeFee(res)
  },

  updateFee: async (id, data) => {
    const payload = {
      ...(data.totalFee !== undefined ? { totalFee: Number(data.totalFee) } : {}),
      ...(data.paidAmount !== undefined || data.paidFee !== undefined ? { paidAmount: Number(data.paidAmount ?? data.paidFee) } : {}),
      ...(data.paymentDate ? { paymentDate: new Date(data.paymentDate) } : {}),
      ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
      ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
    }
    const res = await apiClient.put(`/fees/${id}`, payload)
    return normalizeFee(res)
  },

  deleteFee: async (id) => {
    return apiClient.delete(`/fees/${id}`)
  },

  // --- Payment Management ---
  getPayments: async (params = {}) => {
    return apiClient.get('/payments', params)
  },

  getPayment: async (id) => {
    return apiClient.get(`/payments/${id}`)
  },

  recordPayment: async (data) => {
    return apiClient.post('/payments', data)
  },

  updatePayment: async (id, data) => {
    return apiClient.put(`/payments/${id}`, data)
  },

  cancelPayment: async (id) => {
    return apiClient.delete(`/payments/${id}`)
  },

  getPaymentReceipt: async (idOrNumber) => {
    const clean = typeof idOrNumber === 'string' ? idOrNumber.trim() : String(idOrNumber || '')
    return apiClient.get('/payments/receipt', { receiptNumber: clean, id: clean })
  },

  getPendingFees: async (params = {}) => {
    return apiClient.get('/payments/pending-fees', params)
  },

  getPaymentReports: async (params = {}) => {
    return apiClient.get('/payments/reports', params)
  },

  getStudentFeeLedger: async (studentId) => {
    return apiClient.get(`/payments/student/${studentId}`)
  },

  getFeeStructures: async (params = {}) => {
    return apiClient.get('/payments/fee-structures', params)
  },

  createFeeStructure: async (data) => {
    return apiClient.post('/payments/fee-structures', data)
  },

  updateFeeStructure: async (id, data) => {
    return apiClient.put(`/payments/fee-structures/${id}`, data)
  },

  deleteFeeStructure: async (id) => {
    return apiClient.delete(`/payments/fee-structures/${id}`)
  },

  assignFeeStructureToClass: async (data) => {
    return apiClient.post('/payments/assign-class', data)
  },

  assignFeeToStudent: async (data) => {
    return apiClient.post('/payments/assign-student', data)
  },

  getFinanceSummary: async (params = {}) => {
    return apiClient.get('/payments/finance-summary', params)
  },

  getPaymentSchools: async () => {
    return apiClient.get('/payments/schools')
  },

  // --- Teacher Salary & Payroll ---
  getTeacherSalaryStructures: async (params = {}) => {
    return apiClient.get('/payroll/structures', params)
  },

  saveTeacherSalaryStructure: async (data) => {
    return apiClient.post('/payroll/structures', data)
  },

  generateMonthlyPayroll: async (data) => {
    return apiClient.post('/payroll/generate', data)
  },

  getPayrollList: async (params = {}) => {
    return apiClient.get('/payroll', params)
  },

  getPayrollById: async (id) => {
    return apiClient.get(`/payroll/${id}`)
  },

  markSalaryPaid: async (id, data) => {
    return apiClient.post(`/payroll/${id}/pay`, data)
  },

  getPayslip: async (idOrNumber) => {
    const pathParam = encodeURIComponent(idOrNumber)
    return apiClient.get(`/payroll/payslip/${pathParam}`)
  },

  getPayrollReports: async (params = {}) => {
    return apiClient.get('/payroll/reports', params)
  },

  // --- Exams ---
  getExams: async (params = {}) => {
    const res = await apiClient.get('/exams', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeExam)
  },

  getExam: async (id) => {
    const res = await apiClient.get(`/exams/${id}`)
    return normalizeExam(res)
  },

  addExam: async (data) => {
    let classId = data.classId
    if (!classId && data.className) {
      const classes = await api.getClasses()
      const found = classes.find((c) => c.name === data.className)
      if (found) classId = found.id
    }

    const payload = {
      name: data.name,
      classId: classId,
      type: data.type || 'NORMAL',
      status: data.status || 'DRAFT',
      board: data.board || 'CBSE',
      subjectName: data.subjectName || data.subject || '',
      totalMarks: data.totalMarks ? Number(data.totalMarks) : 100,
      passingMarks: data.passingMarks ? Number(data.passingMarks) : 33,
      durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : 180,
      instructions: data.instructions || '',
      startDate: data.startDate ? new Date(data.startDate) : new Date(data.date || Date.now()),
      endDate: data.endDate ? new Date(data.endDate) : new Date(data.date || Date.now() + 5 * 86400000),
      questions: data.questions || [],
    }
    const res = await apiClient.post('/exams', payload)
    return normalizeExam(res)
  },

  updateExam: async (id, data) => {
    const payload = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.board ? { board: data.board } : {}),
      ...(data.subjectName ? { subjectName: data.subjectName } : {}),
      ...(data.totalMarks !== undefined ? { totalMarks: Number(data.totalMarks) } : {}),
      ...(data.passingMarks !== undefined ? { passingMarks: Number(data.passingMarks) } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: Number(data.durationMinutes) } : {}),
      ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
    }
    const res = await apiClient.put(`/exams/${id}`, payload)
    return normalizeExam(res)
  },

  deleteExam: async (id) => {
    return apiClient.delete(`/exams/${id}`)
  },

  addExamQuestions: async (examId, questions) => {
    return apiClient.post(`/exams/${examId}/questions`, { questions })
  },

  getExamPaper: async (examId) => {
    return apiClient.get(`/exams/${examId}/paper`)
  },

  startDigitalAttempt: async (examId) => {
    return apiClient.post(`/exams/${examId}/digital/attempt`)
  },

  submitDigitalAttempt: async (examId, answers) => {
    return apiClient.post(`/exams/${examId}/digital/submit`, { answers })
  },

  evaluateDigitalAttempt: async (attemptId, evaluations) => {
    return apiClient.post(`/exams/attempts/${attemptId}/evaluate`, { evaluations })
  },

  // --- Question Bank & Question Matching ---
  matchQuestions: async (params) => {
    return apiClient.post('/questions/match', params)
  },

  checkDuplicateQuestion: async (params) => {
    return apiClient.post('/questions/check-duplicate', params)
  },

  getQuestions: async (params = {}) => {
    const res = await apiClient.get('/questions', params)
    return Array.isArray(res) ? res : (res?.data || [])
  },

  getQuestion: async (id) => {
    return apiClient.get(`/questions/${id}`)
  },

  addQuestion: async (data) => {
    return apiClient.post('/questions', data)
  },

  updateQuestion: async (id, data) => {
    return apiClient.put(`/questions/${id}`, data)
  },

  deleteQuestion: async (id) => {
    return apiClient.delete(`/questions/${id}`)
  },

  // --- Marks ---
  getMarks: async (params = {}) => {
    const res = await apiClient.get('/marks', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeMark)
  },

  getMark: async (id) => {
    const res = await apiClient.get(`/marks/${id}`)
    return normalizeMark(res)
  },

  addMark: async (data) => {
    // If subjectId is missing, resolve by subject name or class
    let subjectId = data.subjectId
    if (!subjectId && data.subject) {
      const subjects = await api.getSubjects()
      const found = subjects.find((s) => s.name.toLowerCase() === data.subject.toLowerCase())
      if (found) subjectId = found.id
    }

    const payload = {
      studentId: data.studentId,
      examId: data.examId,
      subjectId: subjectId,
      marks: Number(data.marks),
      grade: data.grade || 'A',
      remarks: data.remarks || null,
    }
    const res = await apiClient.post('/marks', payload)
    return normalizeMark(res)
  },

  updateMark: async (id, data) => {
    const payload = {
      ...(data.marks !== undefined ? { marks: Number(data.marks) } : {}),
      ...(data.grade ? { grade: data.grade } : {}),
      ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
    }
    const res = await apiClient.put(`/marks/${id}`, payload)
    return normalizeMark(res)
  },

  deleteMark: async (id) => {
    return apiClient.delete(`/marks/${id}`)
  },

  // --- Notices ---
  getNotices: async (params = {}) => {
    const res = await apiClient.get('/notices', { limit: 100, ...params })
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list.map(normalizeNotice)
  },

  getNotice: async (id) => {
    const res = await apiClient.get(`/notices/${id}`)
    return normalizeNotice(res)
  },

  addNotice: async (data) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      audience: data.audience || 'ALL',
      publishDate: data.date ? new Date(data.date) : new Date(),
    }
    const res = await apiClient.post('/notices', payload)
    return normalizeNotice(res)
  },

  updateNotice: async (id, data) => {
    const payload = {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.audience ? { audience: data.audience } : {}),
      ...(data.date ? { publishDate: new Date(data.date) } : {}),
    }
    const res = await apiClient.put(`/notices/${id}`, payload)
    return normalizeNotice(res)
  },

  deleteNotice: async (id) => {
    return apiClient.delete(`/notices/${id}`)
  },

  // --- Settings ---
  getSettings: async () => {
    return apiClient.get('/settings')
  },

  updateSettings: async (data) => {
    return apiClient.put('/settings', data)
  },

  // --- Notifications ---
  getNotifications: async (params = {}) => {
    return apiClient.get('/notifications', params)
  },

  markNotificationRead: async (id) => {
    return apiClient.patch(`/notifications/${id}/read`)
  },

  markAllNotificationsRead: async () => {
    return apiClient.patch('/notifications/mark-all-read')
  },

  registerDeviceToken: async (token, deviceType = 'web') => {
    return apiClient.post('/notifications/register-token', { token, deviceType })
  },

  unregisterDeviceToken: async (token) => {
    return apiClient.post('/notifications/unregister-token', { token })
  },

  sendTestNotification: async () => {
    return apiClient.post('/notifications/test')
  },

  sendPushNotification: async (payload) => {
    return apiClient.post('/notifications/send', payload)
  },

  deleteNotification: async (id) => {
    return apiClient.delete(`/notifications/${id}`)
  },

  clearAllNotifications: async () => {
    return apiClient.delete('/notifications/clear-all')
  },

  // --- Marksheets ---
  getMarksheet: async (studentId, examId) => {
    return apiClient.get('/marksheets/generate', { studentId, examId })
  },

  getStudentMarksheets: async (studentId) => {
    return apiClient.get(`/marksheets/student/${studentId}`)
  },

  getMyMarksheets: async () => {
    return apiClient.get('/me/marksheets')
  },

  // --- Transfer Certificates (TC) ---
  getTransferCertificates: async (params = {}) => {
    const res = await apiClient.get('/transfer-certificates', params)
    return Array.isArray(res) ? res : (res?.data || [])
  },

  getTransferCertificate: async (id) => {
    return apiClient.get(`/transfer-certificates/${id}`)
  },

  getStudentTransferCertificate: async (studentId) => {
    return apiClient.get(`/transfer-certificates/student/${studentId}`)
  },

  getMyTransferCertificate: async () => {
    return apiClient.get('/me/transfer-certificate')
  },

  createTransferCertificate: async (data) => {
    return apiClient.post('/transfer-certificates', data)
  },

  updateTransferCertificate: async (id, data) => {
    return apiClient.put(`/transfer-certificates/${id}`, data)
  },

  deleteTransferCertificate: async (id) => {
    return apiClient.delete(`/transfer-certificates/${id}`)
  },
}

// -------------------------------------------------------------
// Attendance API Service
// -------------------------------------------------------------

export const attendanceApi = {
  getStudentAttendance: async ({ date, className, section, classId }) => {
    try {
      let targetClassId = classId
      if (!targetClassId && className) {
        const classes = await api.getClasses()
        const found = classes.find(
          (c) => c.name === className && (!section || c.section === section)
        )
        if (found) targetClassId = found.id
      }

      const res = await apiClient.get('/attendance', {
        date,
        ...(targetClassId ? { classId: targetClassId } : {}),
        limit: 100,
      })

      const list = Array.isArray(res) ? res : (res?.data || [])
      return list.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        date: a.date ? a.date.slice(0, 10) : date,
        status: a.status === 'PRESENT' ? 'Present' : a.status === 'ABSENT' ? 'Absent' : 'Leave',
        remark: a.remark || '',
      }))
    } catch (error) {
      console.warn('[attendanceApi] getStudentAttendance error:', error.message)
      return []
    }
  },

  saveStudentAttendance: async ({ date, className, section, classId, records }) => {
    let targetClassId = classId
    if (!targetClassId && className) {
      const classes = await api.getClasses()
      const found = classes.find(
        (c) => c.name === className && (!section || c.section === section)
      )
      if (found) targetClassId = found.id
    }

    if (!targetClassId) {
      throw new Error('Class ID is required to mark attendance.')
    }

    const payload = {
      classId: targetClassId,
      date: new Date(date),
      records: records.map((r) => ({
        studentId: r.studentId,
        status: (r.status || 'PRESENT').toUpperCase(),
        remark: r.remark || null,
      })),
    }

    return apiClient.post('/attendance/bulk', payload)
  },

  getTeacherAttendance: async (date) => {
    try {
      const res = await apiClient.get('/teacher-attendance', { date, limit: 100 })
      const list = Array.isArray(res) ? res : (res?.data || [])
      return list.map((a) => ({
        id: a.id,
        teacherId: a.teacherId,
        date: a.date ? a.date.slice(0, 10) : date,
        status: a.status === 'PRESENT' ? 'Present' : a.status === 'ABSENT' ? 'Absent' : 'Leave',
        remark: a.remark || '',
      }))
    } catch (error) {
      console.warn('[attendanceApi] getTeacherAttendance error:', error.message)
      return []
    }
  },

  saveTeacherAttendance: async ({ date, records }) => {
    const promises = records.map((r) =>
      apiClient.post('/teacher-attendance/mark', {
        teacherId: r.teacherId,
        date: new Date(date),
        status: (r.status || 'PRESENT').toUpperCase(),
        remark: r.remark || null,
      })
    )
    return Promise.all(promises)
  },

  // -------------------------------------------------------------
  // Marksheets & Transfer Certificates
  // -------------------------------------------------------------
  getMarksheet: async (studentId, examId) => {
    return apiClient.get(`/marksheets/student/${studentId}/exam/${examId}`)
  },

  getStudentMarksheets: async (studentId) => {
    const res = await apiClient.get(`/marksheets/student/${studentId}`)
    return Array.isArray(res) ? res : (res?.data || [])
  },

  getMyMarksheets: async () => {
    const res = await apiClient.get('/me/marksheets')
    return Array.isArray(res) ? res : (res?.data || [])
  },

  getClassMarksheets: async (classId, examId) => {
    const res = await apiClient.get(`/marksheets/class/${classId}/exam/${examId}`)
    return Array.isArray(res) ? res : (res?.data || [])
  },

  getTransferCertificates: async (params = {}) => {
    const res = await apiClient.get('/transfer-certificates', params)
    const list = Array.isArray(res) ? res : (res?.data || [])
    return list
  },

  getTransferCertificate: async (id) => {
    return apiClient.get(`/transfer-certificates/${id}`)
  },

  getStudentTransferCertificate: async (studentId) => {
    return apiClient.get(`/transfer-certificates/student/${studentId}`)
  },

  getMyTransferCertificate: async () => {
    return apiClient.get('/me/transfer-certificate')
  },

  createTransferCertificate: async (data) => {
    return apiClient.post('/transfer-certificates', data)
  },

  updateTransferCertificate: async (id, data) => {
    return apiClient.patch(`/transfer-certificates/${id}`, data)
  },

  deleteTransferCertificate: async (id) => {
    return apiClient.delete(`/transfer-certificates/${id}`)
  },
}

export default api

