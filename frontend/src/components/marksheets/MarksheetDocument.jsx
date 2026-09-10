import React from 'react'
import { formatDate } from '../../utils/helpers'
import { Award, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function MarksheetDocument({ marksheet }) {
  if (!marksheet) return null

  const { school, student, exam, subjects, summary } = marksheet

  const isPassed = summary.resultStatus === 'PASS' || summary.resultStatus === 'PROMOTED'

  return (
    <div className="marksheet-printable bg-white text-slate-900 font-sans p-3.5 sm:p-8 border border-slate-300 rounded-xl shadow-lg max-w-4xl mx-auto my-2 sm:my-4 print:p-6 print:border-none print:shadow-none print:m-0 print:w-full">
      {/* Official Header */}
      <div className="border-b-2 border-indigo-900 pb-4 sm:pb-5 mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-md overflow-hidden flex-shrink-0">
            {school.logo && school.logo.startsWith('http') ? (
              <img src={school.logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span>🏫</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-extrabold text-indigo-950 uppercase tracking-tight">
              {school.name}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {school.address} • Phone: {school.phone}
            </p>
            <p className="text-xs text-slate-500">
              Email: {school.email} • Affiliation No: <span className="font-semibold text-slate-700">{school.affiliationNumber}</span>
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg uppercase tracking-wider">
            Academic Session: {school.academicYear}
          </span>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            REF: MS/{student.studentId}/{exam.name?.replace(/\s+/g, '')}
          </p>
        </div>
      </div>

      {/* Document Title Banner */}
      <div className="text-center my-4 py-2 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white rounded-lg shadow-sm">
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider">
          Official Statement of Marks — {exam.name}
        </h2>
      </div>

      {/* Student Particulars Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Student Name</span>
          <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Student ID / Roll No</span>
          <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">{student.studentId || '—'} {student.rollNumber ? `(#${student.rollNumber})` : ''}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Class & Section</span>
          <span className="font-semibold text-slate-800 text-sm">{student.className || `${student.class} - ${student.section}`}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Date of Birth</span>
          <span className="font-semibold text-slate-800 text-sm">{formatDate(student.dob)}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Father's Name</span>
          <span className="font-medium text-slate-800">{student.fatherName || '—'}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Mother's Name</span>
          <span className="font-medium text-slate-800">{student.motherName || '—'}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Gender</span>
          <span className="font-medium text-slate-800">{student.gender}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium uppercase tracking-wider block text-[10px]">Admission Date</span>
          <span className="font-medium text-slate-800">{formatDate(student.admissionDate)}</span>
        </div>
      </div>

      {/* Marks Table */}
      <div className="my-5 overflow-x-auto rounded-lg border border-slate-200 shadow-sm touch-scroll">
        <table className="min-w-[620px] w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-indigo-950 text-white font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3">Subject Code</th>
              <th className="py-2.5 px-3">Subject Name</th>
              <th className="py-2.5 px-3 text-center">Max Marks</th>
              <th className="py-2.5 px-3 text-center">Marks Obtained</th>
              <th className="py-2.5 px-3 text-center">Grade</th>
              <th className="py-2.5 px-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {subjects.map((sub, idx) => (
              <tr key={sub.subjectId || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{sub.subjectCode || '—'}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.subjectName}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{sub.maxMarks}</td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-900">{sub.obtainedMarks}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                    sub.grade === 'A+' || sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                    sub.grade === 'B+' || sub.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                    sub.grade === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sub.grade}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 text-[11px]">{sub.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50/80 font-bold border-t-2 border-indigo-200 text-slate-900">
              <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-xs text-indigo-950">
                Grand Total / Summary
              </td>
              <td className="py-3 px-3 text-center text-indigo-950">{summary.totalMaxMarks}</td>
              <td className="py-3 px-3 text-center text-base text-indigo-900 font-extrabold">{summary.totalObtainedMarks}</td>
              <td className="py-3 px-3 text-center text-indigo-950 font-extrabold">{summary.grade}</td>
              <td className="py-3 px-3 text-xs text-indigo-900 font-semibold">{summary.remarks}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Result Status & Performance Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 p-4 rounded-xl border border-slate-200 bg-slate-50 items-center">
        <div className="text-center sm:text-left">
          <p className="text-xs text-slate-500 font-medium uppercase">Percentage</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-indigo-950">{summary.percentage}%</span>
            <span className="text-xs text-slate-500">Overall Score</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <p className="text-xs text-slate-500 font-medium uppercase">Overall Grade</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-indigo-950">{summary.grade}</span>
            <span className="text-xs text-slate-500">({summary.remarks})</span>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <p className="text-xs text-slate-500 font-medium uppercase mb-1">Final Result Status</p>
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-wider ${
            summary.resultStatus === 'PASS' ? 'bg-emerald-600 text-white shadow-sm' :
            summary.resultStatus === 'PROMOTED' ? 'bg-amber-500 text-white shadow-sm' :
            'bg-rose-600 text-white shadow-sm'
          }`}>
            <ShieldCheck size={16} />
            {summary.resultStatus}
          </span>
        </div>
      </div>

      {/* Grading Scale Legend */}
      <div className="border border-slate-200 rounded-lg p-2.5 text-[10px] text-slate-500 bg-white mb-6">
        <p className="font-semibold text-slate-700 mb-1">Grading Scale:</p>
        <p className="leading-relaxed">
          A+ (90-100% Outstanding) • A (80-89% Excellent) • B+ (70-79% Very Good) • B (60-69% Good) • C (50-59% Average) • D (40-49% Pass) • F (Below 40% Needs Improvement)
        </p>
      </div>

      {/* Official Signatures & Seal */}
      <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
          <p className="mt-2 font-bold text-slate-800 uppercase tracking-wide">Class Teacher</p>
          <p className="text-[10px] text-slate-400">Signature</p>
        </div>
        <div>
          <div className="h-12 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center text-[8px] text-indigo-400 font-bold uppercase rotate-12">
              Official Seal
            </div>
          </div>
          <p className="mt-2 font-bold text-slate-800 uppercase tracking-wide">Examination Controller</p>
          <p className="text-[10px] text-slate-400">Signature & Seal</p>
        </div>
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
          <p className="mt-2 font-bold text-slate-800 uppercase tracking-wide">{school.principalName || 'Principal'}</p>
          <p className="text-[10px] text-slate-400">Head of Institution</p>
        </div>
      </div>

      <div className="text-center mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
        This is a computer-generated official marksheet issued by {school.name} on {formatDate(summary.generatedAt || new Date())}.
      </div>
    </div>
  )
}
