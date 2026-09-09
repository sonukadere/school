import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, GraduationCap } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Avatar from '../../components/common/Avatar'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { SECTION_OPTIONS } from '../../utils/constants'
import { STATUS_STYLES, formatDate } from '../../utils/helpers'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

function StudentList() {
  const { user } = useAuth()
  const canManage = ['Admin', 'Super Admin'].includes(user?.role) || Boolean(user?.isAdmin)
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState(searchParams.get('class') || '')
  const [sectionFilter, setSectionFilter] = useState(searchParams.get('section') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [classOptions, setClassOptions] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadStudents = async () => {
    try {
      setLoading(true)
      const [studentsData, classesData] = await Promise.allSettled([
        api.getStudents(),
        api.getClasses(),
      ])

      const studentList =
        studentsData.status === 'fulfilled' && Array.isArray(studentsData.value)
          ? studentsData.value
          : []
      setStudents(studentList)

      const classList =
        classesData.status === 'fulfilled' && Array.isArray(classesData.value)
          ? classesData.value
          : []

      // Extract only dynamic classes from active classes and loaded students
      const dynamicClasses = Array.from(
        new Set([
          ...classList.map((c) => c.name),
          ...studentList.map((s) => s.className),
        ].filter(Boolean))
      ).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10)
        const numB = parseInt(b.replace(/\D/g, ''), 10)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.localeCompare(b)
      })

      setClassOptions(dynamicClasses)
    } catch (err) {
      console.error('Failed to load students:', err)
      showToast(err.message || 'Failed to fetch student data from database.', 'error')
      setStudents([])
      setClassOptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesClass = !classFilter || student.className === classFilter
      const matchesSection = !sectionFilter || student.section === sectionFilter
      const isStudentActive = student.status === 'Active' || student.status === 'ACTIVE'
      const matchesStatus =
        !statusFilter ||
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isStudentActive) ||
        (statusFilter === 'INACTIVE' && !isStudentActive) ||
        student.status === statusFilter

      return matchesClass && matchesSection && matchesStatus
    })
  }, [students, classFilter, sectionFilter, statusFilter])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteStudent(deleteTarget.id)
      showToast(`Student ${deleteTarget.fullName} deleted`, 'success')
      loadStudents()
    } catch (err) {
      showToast(err.message || 'Failed to delete student', 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      searchValue: (student) => `${student.fullName} ${student.id} ${student.email} ${student.phone}`,
      render: (student) => (
        <div className="flex items-center gap-3">
          {student.photo ? (
            <img src={student.photo} alt={student.fullName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <Avatar name={student.fullName} size="md" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{student.fullName}</p>
            <p className="text-xs font-mono text-slate-400">ID: {student.studentId || (student.id ? `STU-${student.id.slice(-4).toUpperCase()}` : '—')}</p>
          </div>
        </div>
      ),
    },
    { key: 'className', header: 'Class', render: (student) => (
      <span className="font-medium text-slate-700">{student.className}</span>
    ) },
    {
      key: 'section',
      header: 'Section',
      render: (student) => <Badge variant="primary">Section {student.section}</Badge>,
    },
    { key: 'rollNumber', header: 'Roll No', render: (student) => (
      <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
        {student.rollNumber ?? '—'}
      </span>
    ) },
    {
      key: 'admissionDate',
      header: 'Admission Date',
      render: (student) => (
        <span className="text-xs text-slate-600 font-medium">
          {formatDate(student.admissionDate)}
        </span>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (student) => <Badge className={STATUS_STYLES[student.gender]}>{student.gender}</Badge>,
    },
    { key: 'phone', header: 'Contact', render: (student) => (
      <div>
        <p className="text-slate-700 text-xs font-medium">{student.phone || '—'}</p>
        <p className="text-[11px] text-slate-400">{student.email}</p>
      </div>
    ) },
    {
      key: 'status',
      header: 'Status',
      render: (student) => <Badge className={STATUS_STYLES[student.status]}>{student.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (student) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/students/${student.id}`}
            title="View Details"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-sky-300 hover:bg-sky-50/60 hover:text-sky-600"
          >
            <Eye size={14} />
          </Link>
          {canManage && (
            <>
              <Link
                to={`/students/edit/${student.id}`}
                title="Edit Student"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-600"
              >
                <Pencil size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(student)}
                title="Delete Student"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50/60 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student records, admissions and profiles"
        breadcrumb={[{ label: 'Students' }]}
        actions={
          canManage ? (
            <Link to="/students/add">
              <Button leftIcon={Plus}>Add Student</Button>
            </Link>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={filteredStudents}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by name, ID, email..."
        emptyTitle="No students found"
        emptyDescription="Try changing filters or add a new student."
        emptyIcon={GraduationCap}
        onRowClick={(student) => navigate(`/students/${student.id}`)}
        toolbar={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-36 md:w-40">
              <Select
                name="classFilter"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                options={classOptions}
                placeholder="All Classes"
              />
            </div>
            <div className="w-full sm:w-36 md:w-40">
              <Select
                name="sectionFilter"
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                options={SECTION_OPTIONS}
                placeholder="All Sections"
              />
            </div>
            <div className="w-full sm:w-36 md:w-40">
              <Select
                name="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All Statuses"
              />
            </div>
            {(classFilter || sectionFilter || statusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClassFilter('')
                  setSectionFilter('')
                  setStatusFilter('')
                }}
              >
                Clear
              </Button>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
      />
    </div>
  )
}

export default StudentList
