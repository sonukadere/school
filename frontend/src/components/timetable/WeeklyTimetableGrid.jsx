import { useState } from 'react'
import { Plus, Edit2, Trash2, Clock, BookOpen, Users, MapPin, Coffee } from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'

const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

const SUBJECT_COLOR_PALETTES = [
  'bg-blue-50/80 border-blue-200 text-blue-900',
  'bg-emerald-50/80 border-emerald-200 text-emerald-900',
  'bg-purple-50/80 border-purple-200 text-purple-900',
  'bg-amber-50/80 border-amber-200 text-amber-900',
  'bg-rose-50/80 border-rose-200 text-rose-900',
  'bg-indigo-50/80 border-indigo-200 text-indigo-900',
  'bg-teal-50/80 border-teal-200 text-teal-900',
]

function getSubjectColor(subjectName = '') {
  let hash = 0
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % SUBJECT_COLOR_PALETTES.length
  return SUBJECT_COLOR_PALETTES[index]
}

function WeeklyTimetableGrid({
  periods = [],
  workingDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  slots = [],
  isAdmin = false,
  onAssignSlot,
  onEditSlot,
  onDeleteSlot,
  viewMode = 'class', // 'class' or 'teacher'
}) {
  // Mobile day tab selection (defaults to today's weekday if valid, else first day)
  const todayDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
    new Date().getDay()
  ]
  const [activeMobileDay, setActiveMobileDay] = useState(
    workingDays.includes(todayDayName) ? todayDayName : workingDays[0] || 'MONDAY'
  )

  // Map slots for instant lookup by: `${day}_${periodId}` or by matching time ranges
  const slotMap = {}
  slots.forEach((slot) => {
    if (slot.periodId) {
      slotMap[`${slot.day}_${slot.periodId}`] = slot
    }
    // Also store by time key as fallback
    slotMap[`${slot.day}_${slot.startTime}`] = slot
  })

  const getSlot = (day, period) => {
    return slotMap[`${day}_${period.id}`] || slotMap[`${day}_${period.startTime}`]
  }

  return (
    <div className="space-y-4">
      {/* Mobile Day Selector Tabs (< md screens) */}
      <div className="flex md:hidden overflow-x-auto pb-1 gap-1.5 scrollbar-none">
        {workingDays.map((day) => {
          const isActive = activeMobileDay === day
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveMobileDay(day)}
              className={`shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {DAY_LABELS[day] || day}
            </button>
          )
        })}
      </div>

      {/* Desktop / Tablet Matrix Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700">
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider w-36 border-r border-slate-200">
                Period / Time
              </th>
              {workingDays.map((day) => (
                <th
                  key={day}
                  className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-center border-r border-slate-200 last:border-r-0"
                >
                  <span className="block">{DAY_LABELS[day] || day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {periods.length === 0 ? (
              <tr>
                <td
                  colSpan={workingDays.length + 1}
                  className="py-12 text-center text-slate-400 text-sm"
                >
                  No periods configured. Use &quot;Configure Settings&quot; or &quot;Manage Periods&quot; to set up daily lecture periods.
                </td>
              </tr>
            ) : (
              periods.map((period) => {
                if (period.isBreak) {
                  return (
                    <tr key={period.id} className="bg-amber-50/40">
                      <td className="py-2.5 px-4 font-semibold text-xs text-amber-900 border-r border-slate-200 flex items-center gap-1.5">
                        <Coffee size={14} className="text-amber-600" />
                        <div>
                          <p>{period.name}</p>
                          <p className="text-[10px] text-amber-700/80 font-normal">
                            {period.startTime} – {period.endTime}
                          </p>
                        </div>
                      </td>
                      <td
                        colSpan={workingDays.length}
                        className="py-2 px-4 text-center text-xs font-semibold text-amber-800 tracking-wider uppercase bg-amber-50/30"
                      >
                        Recess / Lunch Break ({period.startTime} – {period.endTime})
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={period.id} className="hover:bg-slate-50/30 transition">
                    {/* Period Header Column */}
                    <td className="py-3 px-4 text-xs border-r border-slate-200 bg-slate-50/40 align-top">
                      <p className="font-bold text-slate-900">{period.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock size={11} className="text-slate-400" />
                        {period.startTime} – {period.endTime}
                      </p>
                    </td>

                    {/* Day Cells */}
                    {workingDays.map((day) => {
                      const slot = getSlot(day, period)

                      return (
                        <td
                          key={`${day}_${period.id}`}
                          className="p-2 border-r border-slate-200 last:border-r-0 align-top min-w-[150px] max-w-[200px]"
                        >
                          {slot ? (
                            <div
                              className={`group relative rounded-xl border p-2.5 transition shadow-xs hover:shadow-sm ${getSubjectColor(
                                slot.subject?.name
                              )}`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-xs truncate" title={slot.subject?.name}>
                                  {slot.subject?.name}
                                </span>
                                {isAdmin && (
                                  <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => onEditSlot?.(slot)}
                                      className="p-1 rounded-md bg-white/80 hover:bg-white text-slate-700 shadow-xs"
                                      title="Edit slot"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteSlot?.(slot)}
                                      className="p-1 rounded-md bg-white/80 hover:bg-white text-rose-600 shadow-xs"
                                      title="Delete slot"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {viewMode === 'teacher' ? (
                                <p className="text-[11px] mt-1 font-semibold text-slate-700 flex items-center gap-1">
                                  <span>Class:</span> {slot.class?.name} {slot.class?.section}
                                </p>
                              ) : (
                                slot.teacher?.name && (
                                  <p className="text-[11px] mt-1 text-slate-700 flex items-center gap-1">
                                    <Users size={11} className="shrink-0 text-slate-400" />
                                    <span className="truncate">{slot.teacher.name}</span>
                                  </p>
                                )
                              )}

                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                                <span>{slot.startTime}–{slot.endTime}</span>
                                {slot.roomNumber && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/70 font-medium">
                                    <MapPin size={9} /> {slot.roomNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : isAdmin ? (
                            <button
                              type="button"
                              onClick={() => onAssignSlot?.({ day, periodId: period.id, period })}
                              className="w-full h-full min-h-[72px] rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-400 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
                              title={`Assign ${period.name} on ${DAY_LABELS[day]}`}
                            >
                              <Plus size={14} />
                              <span>Assign</span>
                            </button>
                          ) : (
                            <div className="h-full min-h-[72px] flex items-center justify-center text-slate-300 text-xs">
                              —
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< md screens) */}
      <div className="md:hidden space-y-2.5">
        <div className="bg-slate-100/70 p-2 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>{DAY_LABELS[activeMobileDay] || activeMobileDay}&apos;s Schedule</span>
          <span className="text-[10px] font-normal text-slate-500">
            {periods.filter((p) => !p.isBreak).length} Periods
          </span>
        </div>

        {periods.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border">
            No periods configured.
          </div>
        ) : (
          periods.map((period) => {
            const slot = getSlot(activeMobileDay, period)

            if (period.isBreak) {
              return (
                <div
                  key={period.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Coffee size={16} className="text-amber-600" />
                    <span>{period.name}</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium">
                    {period.startTime} – {period.endTime}
                  </span>
                </div>
              )
            }

            return (
              <div
                key={period.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">{period.name}</span>
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Clock size={12} /> {period.startTime} – {period.endTime}
                  </span>
                </div>

                <div className="pt-2">
                  {slot ? (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{slot.subject?.name}</p>
                        {viewMode === 'teacher' ? (
                          <p className="text-xs text-slate-600 mt-0.5">
                            Class: <span className="font-semibold">{slot.class?.name} {slot.class?.section}</span>
                          </p>
                        ) : (
                          slot.teacher?.name && (
                            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                              <Users size={12} className="text-slate-400" /> {slot.teacher.name}
                            </p>
                          )
                        )}
                        {slot.roomNumber && (
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin size={11} /> Room {slot.roomNumber}
                          </p>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditSlot?.(slot)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSlot?.(slot)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isAdmin ? (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Plus}
                      onClick={() =>
                        onAssignSlot?.({ day: activeMobileDay, periodId: period.id, period })
                      }
                      className="w-full text-xs"
                    >
                      Assign Slot
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No class scheduled</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default WeeklyTimetableGrid
