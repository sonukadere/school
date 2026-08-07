import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, GraduationCap } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Avatar from '../../components/common/Avatar'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../utils/constants'
import { STATUS_STYLES, formatDate } from '../../utils/helpers'

function StudentList() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadStudents = async () => {
    setLoading(true)
    const data = await api.getStudents()
    setStudents(data)
    setLoading(false)
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        (!classFilter || student.className === classFilter) &&
        (!sectionFilter || student.section === sectionFilter),
    )
  }, [students, classFilter, sectionFilter])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteStudent(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    showToast(`Student ${deleteTarget.fullName} deleted`, 'success')
    loadStudents()
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
            <p className="text-xs text-slate-500">ID: {student.id}</p>
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
      render: (student) => <Badge className="bg-indigo-100 text-indigo-700">{student.section}</Badge>,
    },
    { key: 'rollNumber', header: 'Roll No', render: (student) => student.rollNumber },
    {
      key: 'gender',
      header: 'Gender',
      render: (student) => <Badge className={STATUS_STYLES[student.gender]}>{student.gender}</Badge>,
    },
    { key: 'phone', header: 'Contact', render: (student) => (
      <div>
        <p className="text-slate-700">{student.phone}</p>
        <p className="text-xs text-slate-400">{student.email}</p>
      </div>
    ) },
    { key: 'admissionDate', header: 'Admission', render: (student) => formatDate(student.admissionDate) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (student) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <Link to={`/students/${student.id}`} title="View" className="rounded-lg p-2 text-sky-600 transition hover:bg-sky-50">
            <Eye size={16} />
          </Link>
          <Link to={`/students/edit/${student.id}`} title="Edit" className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50">
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(student)}
            title="Delete"
            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={16} />
          </button>
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
          <Link to="/students/add">
            <Button leftIcon={Plus}>Add Student</Button>
          </Link>
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
          <>
            <Select
              name="classFilter"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              options={CLASS_OPTIONS}
              placeholder="All Classes"
              className="w-40"
            />
            <Select
              name="sectionFilter"
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
              options={SECTION_OPTIONS}
              placeholder="All Sections"
              className="w-40"
            />
            {(classFilter || sectionFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClassFilter('')
                  setSectionFilter('')
                }}
              >
                Clear
              </Button>
            )}
          </>
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
