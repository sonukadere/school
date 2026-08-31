import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/90 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1 text-xs font-bold text-slate-400">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {entry.name}
            </span>
            <span className="text-xs font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function StudentStatistics({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
            <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#f1f5f9' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
          <Bar dataKey="students" name="Students" fill="url(#studentGradient)" radius={[5, 5, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StudentStatistics
