import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  School,
  Users,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  Calculator,
  FlaskConical,
  Code2,
  Languages,
  Globe2,
  UserCheck,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

// Helper: Color and icon styling based on subject name
function getSubjectTheme(name = '') {
  const lower = name.toLowerCase()
  if (lower.includes('computer') || lower.includes('code') || lower.includes('it') || lower.includes('software')) {
    return {
      icon: Code2,
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800/40',
      badgeColor: 'bg-cyan-100/70 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    }
  }
  if (lower.includes('math')) {
    return {
      icon: Calculator,
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/40',
      badgeColor: 'bg-indigo-100/70 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    }
  }
  if (lower.includes('science') || lower.includes('physic') || lower.includes('chem') || lower.includes('bio')) {
    return {
      icon: FlaskConical,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40',
      badgeColor: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    }
  }
  if (lower.includes('english')) {
    return {
      icon: BookOpen,
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/40',
      badgeColor: 'bg-amber-100/70 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    }
  }
  if (lower.includes('hindi') || lower.includes('sanskrit') || lower.includes('french') || lower.includes('german') || lower.includes('language')) {
    return {
      icon: Languages,
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/40',
      badgeColor: 'bg-rose-100/70 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    }
  }
  if (lower.includes('social') || lower.includes('history') || lower.includes('geography') || lower.includes('civics') || lower.includes('sst')) {
    return {
      icon: Globe2,
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40',
      badgeColor: 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    }
  }
  return {
    icon: BookOpen,
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/40',
    badgeColor: 'bg-purple-100/70 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  }
}

// Extract natural numeric grade for orderly sorting
function extractGradeNumber(name = '') {
  const match = String(name || '').match(/\d+/)
  return match ? parseInt(match[0], 10) : 999
}

const COMMON_SUBJECT_SUGGESTIONS = [
  'Mathematics',
  'Science',
  'English',
  'Social Studies',
  'Hindi',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Physical Education',
  'Art & Craft',
  'Economics',
]

function SubjectList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const roleUpper = (user?.role || '').toUpperCase()
  const canManage = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN' || Boolean(user?.isAdmin)
  const isStudent = user?.role === 'Student' || user?.isStudent || roleUpper === 'STUDENT'
  const isParent = user?.role === 'Parent' || user?.isParent || roleUpper === 'PARENT'

  // Data state
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('ALL')
  const [selectedSection, setSelectedSection] = useState('ALL')
  const [selectedTeacher, setSelectedTeacher] = useState('ALL')
  const [selectedSubjectName, setSelectedSubjectName] = useState('ALL')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [openClasses, setOpenClasses] = useState(new Set())

  // Modal & mutation state
  const [modalState, setModalState] = useState(null) // null | { mode: 'create' | 'edit', classId, subject }
  const [modalForm, setModalForm] = useState({
    name: '',
    code: '',
    classId: '',
    teacherId: '',
  })
  const [modalErrors, setModalErrors] = useState({})
  const [submittingModal, setSubmittingModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch initial data
  const loadData = async () => {
    setLoading(true)
    try {
      const [subjectsRes, classesRes, teachersRes] = await Promise.allSettled([
        fetchAllSubjects(),
        api.getClasses({ limit: 100 }),
        api.getTeachers({ limit: 100 }),
      ])

      const rawSubjects = subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value) ? subjectsRes.value : []
      const rawClasses = classesRes.status === 'fulfilled' && Array.isArray(classesRes.value) ? classesRes.value : []
      const rawTeachers = teachersRes.status === 'fulfilled' && Array.isArray(teachersRes.value) ? teachersRes.value : []

      setSubjects(rawSubjects)
      setClasses(rawClasses)
      setTeachers(rawTeachers)
    } catch (err) {
      console.error('[SubjectList] Error loading data:', err)
      showToast('Failed to load subjects', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Backend validates limit <= 100, so fetch all subjects by paging through results
  const fetchAllSubjects = async () => {
    const all = []
    const pageSize = 100
    let page = 1
    let done = false
    while (!done) {
      const chunk = await api.getSubjects({ limit: pageSize, page })
      if (!Array.isArray(chunk) || chunk.length === 0) {
        done = true
      } else {
        all.push(...chunk)
        if (chunk.length < pageSize) done = true
        else page += 1
      }
    }
    return all
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-generate code when name or class changes in modal (only in create mode)
  const handleModalFieldChange = (field, value) => {
    setModalForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (modalState?.mode === 'create' && (field === 'name' || field === 'classId')) {
        const subName = field === 'name' ? value : prev.name
        const targetClassId = field === 'classId' ? value : prev.classId
        const clsObj = classes.find((c) => c.id === targetClassId)
        if (subName && clsObj) {
          const prefix = subName.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '')
          const cleanClassName = `${clsObj.name || ''}${clsObj.section || ''}`.replace(/\s+/g, '')
          updated.code = `${prefix || 'SUB'}-${cleanClassName}`
        }
      }
      return updated
    })
    if (modalErrors[field]) {
      setModalErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Open Create Modal
  const handleOpenCreateModal = (defaultClassId = '') => {
    const targetClassId = defaultClassId || classes[0]?.id || ''
    const clsObj = classes.find((c) => c.id === targetClassId)
    setModalForm({
      name: '',
      code: clsObj ? `SUB-${clsObj.name.replace(/\s+/g, '')}${clsObj.section || ''}` : '',
      classId: targetClassId,
      teacherId: '',
    })
    setModalErrors({})
    setModalState({ mode: 'create', classId: targetClassId })
  }

  // Open Edit Modal
  const handleOpenEditModal = (subject) => {
    setModalForm({
      name: subject.name || '',
      code: subject.code || '',
      classId: subject.classId || subject.class?.id || '',
      teacherId: subject.teacherId || subject.teacher?.id || '',
    })
    setModalErrors({})
    setModalState({ mode: 'edit', subject })
  }

  // Handle Save (Create or Update)
  const handleSaveModal = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!modalForm.name?.trim()) errors.name = 'Subject name is required'
    if (!modalForm.classId) errors.classId = 'Target class is required'
    if (!modalForm.code?.trim()) errors.code = 'Subject code is required'

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors)
      return
    }

    setSubmittingModal(true)
    try {
      if (modalState.mode === 'create') {
        await api.addSubject({
          name: modalForm.name.trim(),
          code: modalForm.code.trim().toUpperCase(),
          classId: modalForm.classId,
          teacherId: modalForm.teacherId || null,
        })
        showToast(`Subject "${modalForm.name.trim()}" added successfully`, 'success')
      } else {
        await api.updateSubject(modalState.subject.id, {
          name: modalForm.name.trim(),
          code: modalForm.code.trim().toUpperCase(),
          classId: modalForm.classId,
          teacherId: modalForm.teacherId || null,
        })
        showToast(`Subject "${modalForm.name.trim()}" updated successfully`, 'success')
      }
      setModalState(null)
      await loadData()
    } catch (err) {
      console.error('[SubjectList] Save error:', err)
      showToast(err?.message || 'Failed to save subject', 'error')
    } finally {
      setSubmittingModal(false)
    }
  }

  // Handle Delete Subject
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteSubject(deleteTarget.id)
      showToast(`Subject "${deleteTarget.name}" deleted successfully`, 'success')
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      console.error('[SubjectList] Delete error:', err)
      showToast(err?.message || 'Failed to delete subject', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Toggle Open/Close class
  const toggleClassOpen = (classId) => {
    setOpenClasses((prev) => {
      const next = new Set(prev)
      if (next.has(classId)) {
        next.delete(classId)
      } else {
        next.add(classId)
      }
      return next
    })
  }

  const expandAll = () => setOpenClasses(new Set(classes.map((c) => c.id)))
  const collapseAll = () => setOpenClasses(new Set())

  // Sort classes naturally
  const sortedClasses = useMemo(() => {
    const list = [...classes]
    list.sort((a, b) => {
      const gA = extractGradeNumber(a.name)
      const gB = extractGradeNumber(b.name)
      if (gA !== gB) return gB - gA
      return (a.section || '').localeCompare(b.section || '')
    })
    return list
  }, [classes])

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const gradeSet = new Set()
    const sectionSet = new Set()
    const subjectNameSet = new Set()

    sortedClasses.forEach((c) => {
      if (c.name) gradeSet.add(c.name)
      if (c.section) sectionSet.add(c.section)
    })

    subjects.forEach((s) => {
      if (s.name) subjectNameSet.add(s.name)
    })

    return {
      grades: Array.from(gradeSet),
      sections: Array.from(sectionSet).sort(),
      subjectNames: Array.from(subjectNameSet).sort(),
    }
  }, [sortedClasses, subjects])

  // Group subjects by Class and apply Search / Filters
  const { classGroups, summaryStats, totalMatchingSubjects } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    // Map subjects to class IDs
    const subjectByClassId = new Map()
    subjects.forEach((sub) => {
      const cId = sub.classId || sub.class?.id
      if (cId) {
        if (!subjectByClassId.has(cId)) subjectByClassId.set(cId, [])
        subjectByClassId.get(cId).push(sub)
      }
    })

    let totalSubjectsCount = 0
    let totalAssignedTeachers = new Set()
    let unassignedCount = 0

    // Construct groups
    const groups = sortedClasses.map((cls) => {
      let classSubjects = subjectByClassId.get(cls.id) || []

      // Safeguard: Deduplicate any exact duplicate subjects inside the same class
      const seenKey = new Set()
      classSubjects = classSubjects.filter((s) => {
        const key = `${s.name?.trim().toLowerCase()}_${s.code?.trim().toLowerCase()}`
        if (seenKey.has(key)) return false
        seenKey.add(key)
        return true
      })

      // Track summary stats before filter
      classSubjects.forEach((s) => {
        totalSubjectsCount += 1
        if (s.teacherId || (s.teacher && s.teacher.id)) {
          totalAssignedTeachers.add(s.teacherId || s.teacher.id)
        } else {
          unassignedCount += 1
        }
      })

      // Filter matching subjects for this class
      const matchingSubjects = classSubjects.filter((sub) => {
        // Teacher filter
        if (selectedTeacher !== 'ALL') {
          const tId = sub.teacherId || sub.teacher?.id
          if (tId !== selectedTeacher) return false
        }
        // Subject Name filter
        if (selectedSubjectName !== 'ALL') {
          if (sub.name !== selectedSubjectName) return false
        }
        // Search query
        if (query) {
          const matchName = sub.name?.toLowerCase().includes(query)
          const matchCode = sub.code?.toLowerCase().includes(query)
          const matchTeacher = (sub.assignedTeacher || sub.teacherName || '').toLowerCase().includes(query)
          const matchClass = `${cls.name} ${cls.section || ''}`.toLowerCase().includes(query)
          if (!matchName && !matchCode && !matchTeacher && !matchClass) return false
        }
        return true
      })

      // Check if class itself passes grade/section filter
      const matchesGrade = selectedGrade === 'ALL' || cls.name === selectedGrade
      const matchesSection = selectedSection === 'ALL' || cls.section === selectedSection

      const isClassVisible = matchesGrade && matchesSection && (query ? matchingSubjects.length > 0 : true)

      return {
        class: cls,
        className: `${cls.name} ${cls.section || ''}`.trim(),
        subjects: matchingSubjects,
        totalClassSubjects: classSubjects.length,
        isVisible: isClassVisible,
      }
    })

    const visibleGroups = groups.filter((g) => g.isVisible)
    const matchingCount = visibleGroups.reduce((acc, g) => acc + g.subjects.length, 0)

    return {
      classGroups: visibleGroups,
      totalMatchingSubjects: matchingCount,
      summaryStats: {
        totalClasses: sortedClasses.length,
        totalSubjects: totalSubjectsCount,
        assignedTeachersCount: totalAssignedTeachers.size,
        unassignedCount,
      },
    }
  }, [
    sortedClasses,
    subjects,
    searchQuery,
    selectedGrade,
    selectedSection,
    selectedTeacher,
    selectedSubjectName,
  ])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedGrade !== 'ALL' ||
    selectedSection !== 'ALL' ||
    selectedTeacher !== 'ALL' ||
    selectedSubjectName !== 'ALL'

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedGrade('ALL')
    setSelectedSection('ALL')
    setSelectedTeacher('ALL')
    setSelectedSubjectName('ALL')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isStudent ? 'My Curriculum Subjects' : isParent ? "Child's Class Subjects" : 'Subjects Management'}
        description={
          isStudent
            ? 'View subjects and faculty assigned to your active academic grade'
            : isParent
            ? "View curriculum subjects and teachers assigned to your child's class"
            : 'Organize, assign, and manage curriculum subjects class-wise across academic grades'
        }
        breadcrumb={[{ label: isStudent ? 'My Subjects' : 'Subjects' }]}
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <Button leftIcon={Plus} onClick={() => handleOpenCreateModal()}>
                Add Subject
              </Button>
            </div>
          ) : null
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Classes Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Classes</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <School size={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {loading ? <div className="h-7 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : summaryStats.totalClasses}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Configured class sections</p>
        </div>

        {/* Total Subjects Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Subjects</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {loading ? <div className="h-7 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : summaryStats.totalSubjects}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Active class allocations</p>
        </div>

        {/* Assigned Teachers Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faculty Assigned</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {loading ? <div className="h-7 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : summaryStats.assignedTeachersCount}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Teachers taking subjects</p>
        </div>

        {/* Unassigned Subjects Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unassigned</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {loading ? <div className="h-7 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : summaryStats.unassignedCount}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Subjects without teacher</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject name, code, class or teacher..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* View mode toggle & Expand/Collapse */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-2xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-2xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Table view"
              >
                <List size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={openClasses.size === 0 ? expandAll : collapseAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/70 transition shadow-2xs cursor-pointer"
            >
              {openClasses.size === 0 ? (
                <>
                  <ChevronDown size={14} />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronUp size={14} />
                  <span>Collapse All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <SlidersHorizontal size={13} />
            <span>Filters:</span>
          </div>

          {/* Grade/Class Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Classes</option>
            {filterOptions.grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Sections</option>
            {filterOptions.sections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>

          {/* Subject Name Filter */}
          <select
            value={selectedSubjectName}
            onChange={(e) => setSelectedSubjectName(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 max-w-[160px] truncate"
          >
            <option value="ALL">All Subjects</option>
            {filterOptions.subjectNames.map((sName) => (
              <option key={sName} value={sName}>
                {sName}
              </option>
            ))}
          </select>

          {/* Teacher Filter */}
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 max-w-[160px] truncate"
          >
            <option value="ALL">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer ml-auto"
            >
              <X size={12} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : classGroups.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <BookOpen size={28} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {hasActiveFilters ? 'No subjects match your filters' : 'No classes or subjects found'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search criteria or resetting filters to see class subjects.'
              : 'Create classes and assign subjects to organize your academic curriculum.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Reset All Filters
              </Button>
            ) : canManage ? (
              <Button leftIcon={Plus} onClick={() => handleOpenCreateModal()}>
                Add First Subject
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        /* Class-wise Sections */
        <div className="space-y-5">
          {classGroups.map((group) => {
            const cls = group.class
            const isOpen = searchQuery.trim() ? group.subjects.length > 0 : openClasses.has(cls.id)
            const subjectCount = group.subjects.length

            return (
              <div
                key={cls.id}
                className={`rounded-2xl border bg-white shadow-xs transition-all dark:bg-slate-900 overflow-hidden ${
                  isOpen
                    ? 'border-blue-200/80 dark:border-blue-900/50 shadow-sm'
                    : 'border-slate-200/80 hover:border-blue-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                {/* Class Card Header - CLICK TO OPEN / CLOSE */}
                <div
                  onClick={() => toggleClassOpen(cls.id)}
                  className={`flex items-center justify-between px-5 py-4 cursor-pointer transition select-none ${
                    isOpen
                      ? 'bg-gradient-to-r from-blue-50/40 via-slate-50/70 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/30 border-b border-slate-100 dark:border-slate-800/80'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                  }`}
                  title={isOpen ? 'Click to collapse' : 'Click to view subjects and add options'}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        isOpen
                          ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <School size={20} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {cls.name} {cls.section ? `Section ${cls.section}` : ''}
                        </h2>
                        <Badge variant={isOpen ? 'primary' : 'secondary'} className="font-semibold text-xs px-2.5 py-0.5">
                          Section {cls.section || 'A'}
                        </Badge>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {subjectCount} {subjectCount === 1 ? 'Subject' : 'Subjects'}
                        </span>
                        {cls.roomNumber && (
                          <span className="text-xs text-slate-400 font-medium hidden md:inline">
                            &bull; Room {cls.roomNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cls.classTeacher?.name ? (
                          <span>
                            Class Teacher: <strong className="text-slate-700 dark:text-slate-200">{cls.classTeacher.name}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No class teacher assigned</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Open/Close prompt and Chevron indicator */}
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {isOpen ? 'Close' : 'View Subjects'}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg transition-transform duration-200 ${
                        isOpen
                          ? 'rotate-180 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* Class Content (Revealed ONLY when Class is Open) */}
                {isOpen && (
                  <div className="p-4 sm:p-5">
                    {/* Top Action Bar inside opened class */}
                    <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Curriculum Subjects ({subjectCount})
                        </h3>
                        <p className="text-xs text-slate-400">
                          Allocated academic subjects for {cls.name} Section {cls.section || 'A'}
                        </p>
                      </div>

                      {canManage && (
                        <Button
                          size="sm"
                          leftIcon={Plus}
                          onClick={() => handleOpenCreateModal(cls.id)}
                          className="text-xs font-semibold shadow-xs"
                        >
                          Add Subject
                        </Button>
                      )}
                    </div>

                    {group.subjects.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 px-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                        <BookOpen className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={24} />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          No subjects assigned to {cls.name} Section {cls.section || 'A'} yet
                        </p>
                        {canManage && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              leftIcon={Plus}
                              onClick={() => handleOpenCreateModal(cls.id)}
                            >
                              Add First Subject
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : viewMode === 'grid' ? (
                      /* Grid View Cards */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {group.subjects.map((sub) => {
                          const theme = getSubjectTheme(sub.name)
                          const SubjectIcon = theme.icon
                          const teacherName = sub.assignedTeacher || sub.teacherName || sub.teacher?.name
                          const isAssigned = teacherName && teacherName !== 'Not Assigned'

                          return (
                            <div
                              key={sub.id}
                              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-850 dark:hover:border-blue-500/50"
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${theme.bgColor} transition group-hover:scale-105`}
                                  >
                                    <SubjectIcon size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {sub.name}
                                    </h4>
                                    <span
                                      className={`inline-block mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold ${theme.badgeColor}`}
                                    >
                                      {sub.code || 'CODE-N/A'}
                                    </span>
                                  </div>
                                </div>

                                {canManage && (
                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(sub)}
                                      className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition cursor-pointer"
                                      title="Edit Subject"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget(sub)}
                                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                                      title="Delete Subject"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Teacher assignment pill */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-[11px] font-medium text-slate-400">Assigned Teacher:</span>
                                {isAssigned ? (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                      {teacherName.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                                      {teacherName}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-md">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Not Assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* Table View */
                      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            <tr>
                              <th className="px-4 py-3">Subject Name</th>
                              <th className="px-4 py-3">Subject Code</th>
                              <th className="px-4 py-3">Assigned Faculty</th>
                              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {group.subjects.map((sub) => {
                              const theme = getSubjectTheme(sub.name)
                              const SubjectIcon = theme.icon
                              const teacherName = sub.assignedTeacher || sub.teacherName || sub.teacher?.name
                              const isAssigned = teacherName && teacherName !== 'Not Assigned'

                              return (
                                <tr
                                  key={sub.id}
                                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                                >
                                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${theme.bgColor}`}
                                      >
                                        <SubjectIcon size={16} />
                                      </div>
                                      <span>{sub.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-block rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${theme.badgeColor}`}
                                    >
                                      {sub.code}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {isAssigned ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                          {teacherName.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                                          {teacherName}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-md">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        Not Assigned
                                      </span>
                                    )}
                                  </td>
                                  {canManage && (
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditModal(sub)}
                                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition cursor-pointer"
                                          title="Edit Subject"
                                        >
                                          <Pencil size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeleteTarget(sub)}
                                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                                          title="Delete Subject"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {modalState && (
        <Modal
          open={Boolean(modalState)}
          onClose={() => setModalState(null)}
          title={modalState.mode === 'create' ? 'Add Subject to Class' : 'Edit Subject Assignment'}
          description={
            modalState.mode === 'create'
              ? 'Assign a new curriculum subject and faculty teacher to a specific class'
              : `Modify details or assigned teacher for ${modalState.subject?.name}`
          }
          size="md"
        >
          <form onSubmit={handleSaveModal} className="space-y-4 pt-2">
            {/* Target Class Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class & Section <span className="text-rose-500">*</span>
              </label>
              <select
                value={modalForm.classId}
                onChange={(e) => handleModalFieldChange('classId', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select target class</option>
                {sortedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} Section {c.section || 'A'}
                  </option>
                ))}
              </select>
              {modalErrors.classId && (
                <p className="mt-1 text-xs text-rose-500">{modalErrors.classId}</p>
              )}
            </div>

            {/* Subject Name with Quick Suggestions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={modalForm.name}
                onChange={(e) => handleModalFieldChange('name', e.target.value)}
                placeholder="e.g. Computer Science, Mathematics"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {modalErrors.name && (
                <p className="mt-1 text-xs text-rose-500">{modalErrors.name}</p>
              )}

              {/* Suggestions Pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 self-center mr-1">Suggestions:</span>
                {COMMON_SUBJECT_SUGGESTIONS.slice(0, 6).map((suggest) => (
                  <button
                    key={suggest}
                    type="button"
                    onClick={() => handleModalFieldChange('name', suggest)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={modalForm.code}
                onChange={(e) => handleModalFieldChange('code', e.target.value)}
                placeholder="e.g. CS-Class10A"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 uppercase focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {modalErrors.code && (
                <p className="mt-1 text-xs text-rose-500">{modalErrors.code}</p>
              )}
            </div>

            {/* Assigned Faculty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Teacher (Optional)
              </label>
              <select
                value={modalForm.teacherId}
                onChange={(e) => handleModalFieldChange('teacherId', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">-- Not Assigned (Assign later) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.teacherId ? `(${t.teacherId})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                You can assign or change the faculty teacher at any time.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalState(null)}
                disabled={submittingModal}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submittingModal}>
                {modalState.mode === 'create' ? 'Add Subject' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Subject Assignment"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.code || ''})? This will remove this subject assignment from the class.`}
      />
    </div>
  )
}

export default SubjectList