import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Settings,
  ListOrdered,
  Users,
  School,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'

import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Loader from '../../components/common/Loader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import WeeklyTimetableGrid from '../../components/timetable/WeeklyTimetableGrid'
import TimetableSlotModal from '../../components/timetable/TimetableSlotModal'
import PeriodManagerModal from '../../components/timetable/PeriodManagerModal'
import TimetableSettingsModal from '../../components/timetable/TimetableSettingsModal'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../services/api'

function TimetablePage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { showToast } = useToast()

  const roleUpper = (user?.role || '').toUpperCase()
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN'
  const isTeacher = roleUpper === 'TEACHER' || user?.isTeacher
  const isStudent = roleUpper === 'STUDENT' || user?.isStudent || user?.role === 'Student'

  // Filter states
  const [viewMode, setViewMode] = useState('class') // 'class' | 'teacher'
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  // Data states
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [periods, setPeriods] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modals state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [slotPreset, setSlotPreset] = useState({ day: 'MONDAY', periodId: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // 1. Initial Load: classes, teachers, subjects, periods
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.all([
      api.getClasses(),
      api.getTeachers(),
      api.getSubjects(),
      api.getPeriods(),
    ])
      .then(([classList, teacherList, subjectList, periodList]) => {
        if (!isMounted) return
        setClasses(classList || [])
        setTeachers(teacherList || [])
        setSubjects(subjectList || [])
        setPeriods(periodList || [])

        // Set initial selections based on role
        if (isTeacher) {
          setViewMode('teacher')
          const myTeacherId = user?.teacher?.id
          if (myTeacherId) {
            setSelectedTeacherId(myTeacherId)
          } else if (teacherList?.length) {
            setSelectedTeacherId(teacherList[0].id)
          }
        } else if (isStudent) {
          setViewMode('class')
          const myClassId = user?.student?.classId
          if (myClassId) {
            setSelectedClassId(myClassId)
          } else if (classList?.length) {
            setSelectedClassId(classList[0].id)
          }
        } else {
          // Admin default
          if (classList?.length) {
            setSelectedClassId(classList[0].id)
          }
          if (teacherList?.length) {
            setSelectedTeacherId(teacherList[0].id)
          }
        }
      })
      .catch((err) => {
        console.error('[TimetablePage] Error loading base metadata:', err)
        showToast('Failed to load classes or teachers', 'error')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isTeacher, isStudent, user, showToast])

  // 2. Fetch Timetable Slots whenever viewMode, selectedClassId, or selectedTeacherId changes
  const loadTimetableSlots = useCallback(async () => {
    if (viewMode === 'class' && !selectedClassId) return
    if (viewMode === 'teacher' && !selectedTeacherId) return

    setRefreshing(true)
    try {
      if (viewMode === 'class') {
        const res = await api.getWeeklyClassTimetable(selectedClassId)
        setSlots(res?.slots || [])
        if (res?.periods) setPeriods(res.periods)
      } else {
        const res = await api.getWeeklyTeacherTimetable(selectedTeacherId)
        setSlots(res?.slots || [])
        if (res?.periods) setPeriods(res.periods)
      }
    } catch (err) {
      console.error('[TimetablePage] Error loading weekly timetable:', err)
    } finally {
      setRefreshing(false)
    }
  }, [viewMode, selectedClassId, selectedTeacherId])

  useEffect(() => {
    loadTimetableSlots()
  }, [loadTimetableSlots])

  // Reload periods helper
  const reloadPeriods = async () => {
    try {
      const p = await api.getPeriods()
      setPeriods(p || [])
    } catch (err) {
      console.error(err)
    }
    loadTimetableSlots()
  }

  // Handle slot assignment from grid cell click
  const handleAssignSlot = ({ day, periodId }) => {
    setEditingSlot(null)
    setSlotPreset({
      day,
      periodId,
    })
    setIsSlotModalOpen(true)
  }

  // Handle slot edit
  const handleEditSlot = (slot) => {
    setEditingSlot(slot)
    setIsSlotModalOpen(true)
  }

  // Handle slot delete
  const handleDeleteSlot = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteTimetableSlot(deleteTarget.id)
      showToast('Timetable slot removed successfully', 'success')
      setDeleteTarget(null)
      loadTimetableSlots()
    } catch (err) {
      showToast(err?.message || 'Failed to remove slot', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const workingDays = useMemo(() => {
    if (settings?.workingDays?.length) return settings.workingDays
    return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  }, [settings?.workingDays])

  if (loading) {
    return <Loader fullScreen label="Loading timetable..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Management"
        description={
          isTeacher
            ? 'Your weekly lecture schedule across all assigned classes.'
            : isStudent
            ? 'Your weekly class schedule and period timetable.'
            : 'Configure school timetable settings, lecture periods, and weekly class allocations.'
        }
        breadcrumb={[{ label: 'Academics' }, { label: 'Timetable' }]}
        actions={
          isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                leftIcon={Settings}
                size="sm"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                Timetable Settings
              </Button>
              <Button
                variant="outline"
                leftIcon={ListOrdered}
                size="sm"
                onClick={() => setIsPeriodModalOpen(true)}
              >
                Manage Periods
              </Button>
              <Button
                variant="primary"
                leftIcon={Plus}
                size="sm"
                onClick={() => {
                  setEditingSlot(null)
                  setSlotPreset({ day: 'MONDAY', periodId: null })
                  setIsSlotModalOpen(true)
                }}
              >
                Assign Period
              </Button>
            </div>
          )
        }
      />

      {/* Control / Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('class')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'class'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <School size={14} /> Class Timetable
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('teacher')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'teacher'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users size={14} /> Teacher Timetable
                </button>
              </div>
            )}

            {/* Class Selector */}
            {viewMode === 'class' && (
              <div className="w-64">
                <Select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  options={classes.map((c) => ({
                    value: c.id,
                    label: `${c.name} ${c.section ? `(${c.section})` : ''}`,
                  }))}
                  disabled={isStudent}
                  placeholder="Select Class..."
                  leftIcon={School}
                />
              </div>
            )}

            {/* Teacher Selector */}
            {viewMode === 'teacher' && (
              <div className="w-64">
                <Select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  options={teachers.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.teacherId})`,
                  }))}
                  disabled={isTeacher}
                  placeholder="Select Teacher..."
                  leftIcon={Users}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-500">
            <span className="font-medium">
              {slots.length} period{slots.length === 1 ? '' : 's'} assigned
            </span>
            <button
              type="button"
              onClick={loadTimetableSlots}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition"
              title="Refresh timetable"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </Card>

      {/* Main Weekly Grid Card */}
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {viewMode === 'class' ? (
                <span>
                  {classes.find((c) => c.id === selectedClassId)?.name}{' '}
                  {classes.find((c) => c.id === selectedClassId)?.section
                    ? `(${classes.find((c) => c.id === selectedClassId)?.section})`
                    : ''}{' '}
                  Weekly Schedule
                </span>
              ) : (
                <span>
                  {teachers.find((t) => t.id === selectedTeacherId)?.name || 'Teacher'}&apos;s Weekly Schedule
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly lecture distribution across period hours
            </p>
          </div>

          {isAdmin && periods.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Sparkles}
              onClick={() => setIsSettingsModalOpen(true)}
            >
              Quick Setup Periods
            </Button>
          )}
        </div>

        <WeeklyTimetableGrid
          periods={periods}
          workingDays={workingDays}
          slots={slots}
          isAdmin={isAdmin}
          viewMode={viewMode}
          onAssignSlot={handleAssignSlot}
          onEditSlot={handleEditSlot}
          onDeleteSlot={(slot) => setDeleteTarget(slot)}
        />
      </Card>

      {/* Modals */}
      <TimetableSlotModal
        open={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        initialSlot={editingSlot}
        classes={classes}
        periods={periods.filter((p) => !p.isBreak)}
        subjects={subjects}
        teachers={teachers}
        preselectedClassId={viewMode === 'class' ? selectedClassId : null}
        preselectedDay={slotPreset.day}
        preselectedPeriodId={slotPreset.periodId}
        onSaved={loadTimetableSlots}
      />

      <PeriodManagerModal
        open={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        periods={periods}
        onRefresh={reloadPeriods}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <TimetableSettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onPeriodsGenerated={reloadPeriods}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSlot}
        title="Remove Timetable Slot"
        message={`Are you sure you want to remove ${deleteTarget?.subject?.name} scheduled on ${deleteTarget?.day} (${deleteTarget?.startTime} - ${deleteTarget?.endTime})?`}
        confirmText="Remove Slot"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default TimetablePage
