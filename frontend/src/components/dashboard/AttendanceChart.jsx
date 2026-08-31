import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/90 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1.5 text-xs font-bold text-slate-400">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      entry.name === 'Present'
                        ? '#4f46e5'
                        : entry.name === 'Absent'
                          ? '#f43f5e'
                          : '#f59e0b',
                  }}
                />
                {entry.name}
              </span>
              <span className="text-xs font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function AttendanceChart({ data }) {
  return (
    <div className="w-full space-y-4">
      {/* Professional Top Legend */}
      <div className="flex items-center justify-end gap-5 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Leave
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="20%">
            <defs>
              <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="leaveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              dx={-8}
            />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
            <Bar dataKey="Present" fill="url(#presentGradient)" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="Absent" fill="url(#absentGradient)" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="Leave" fill="url(#leaveGradient)" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AttendanceChart
