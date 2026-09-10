import React from 'react'
import { formatDate } from '../../utils/helpers'

export default function TransferCertificateDocument({ certificate }) {
  if (!certificate) return null

  const {
    tcNumber,
    issueDate,
    leavingDate,
    lastClass,
    academicYear,
    reason,
    conduct,
    resultStatus,
    remarks,
    status,
    student,
    school,
  } = certificate

  const fullName =
    student?.fullName ||
    (student ? `${student.firstName} ${student.lastName || ''}`.trim() : certificate.studentName || 'Student')
  const className =
    student?.className ||
    (student?.class ? `${student.class.name} - Section ${student.class.section}` : lastClass || 'Class 10')
  const studentId = student?.studentId || student?.id || 'STU-001'

  return (
    <div className="tc-printable w-full max-w-3xl mx-auto bg-white text-slate-900 font-serif p-3.5 sm:p-8 rounded-xl shadow-md border border-slate-300 print:p-6 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
      {/* Decorative Outer Border */}
      <div className="border border-slate-400 p-3 sm:p-6 rounded-lg relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <span className="text-5xl sm:text-7xl font-black uppercase rotate-[-30deg] tracking-widest text-slate-900 text-center">
            {school?.name || 'TRANSFER CERTIFICATE'}
          </span>
        </div>

        {/* School Header */}
        <div className="text-center border-b-2 border-slate-800 pb-3 mb-3 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-1.5 text-center sm:text-left">
            <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-slate-900 flex items-center justify-center text-white text-lg sm:text-2xl font-bold shrink-0">
              🏫
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-slate-900 font-serif leading-tight">
                {school?.name || 'Daily Day Academy'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 font-sans mt-0.5">
                {school?.address || '123 Education Street, New Delhi - 110001'}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans">
                Phone: {school?.phone || '+91 98765 43210'} • Email: {school?.email || 'info@dailydayacademy.edu'} • Affiliation No: {school?.affiliationNumber || 'CBSE-89432'}
              </p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mt-2.5 pt-2 border-t border-slate-200">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-widest text-slate-900 underline decoration-slate-400 underline-offset-4">
              Transfer Certificate
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5 italic">
              (School Leaving Certificate issued in accordance with Education Board Rules)
            </p>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-sans border-y border-slate-300 py-2 my-3 px-2 bg-slate-50/80 gap-2 relative z-10">
          <div>
            <span className="font-semibold text-slate-600">TC Number: </span>
            <span className="font-bold text-slate-900 font-mono">{tcNumber}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Admission / Student ID: </span>
            <span className="font-bold text-slate-900 font-mono">{studentId}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Date of Issue: </span>
            <span className="font-bold text-slate-900">{formatDate(issueDate || new Date())}</span>
          </div>
        </div>

        {/* Formal Numbered Clauses */}
        <div className="space-y-2 text-xs sm:text-[13px] font-sans my-3 leading-relaxed relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">1. Name of Student:</span>
            <span className="w-full sm:w-1/2 font-bold text-slate-900 uppercase">{fullName}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">2. Father's / Guardian's Name:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">{student?.fatherName || '—'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">3. Mother's Name:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">{student?.motherName || '—'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">4. Nationality & Gender:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">Indian / {student?.gender || 'FEMALE'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">5. Date of First Admission in School with Class:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">{formatDate(student?.admissionDate || new Date('2026-04-01'))} (Class 10)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">6. Date of Birth (according to Admission Register):</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">{formatDate(student?.dob || new Date('2010-04-15'))}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">7. Class in which the student last studied:</span>
            <span className="w-full sm:w-1/2 font-bold text-slate-900">{className}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">8. School / Board Annual Examination Result:</span>
            <span className="w-full sm:w-1/2 font-bold text-emerald-700 uppercase">{resultStatus || 'PASSED'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">9. Subjects Studied:</span>
            <span className="w-full sm:w-1/2 font-medium text-slate-800">1. English 2. Mathematics 3. Science 4. Social Science 5. Computer</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">10. Month up to which school dues have been paid:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">All Dues Cleared up to Current Session</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">11. Date of student's last attendance at school:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">{formatDate(leavingDate || new Date())}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">12. Reason for leaving the school:</span>
            <span className="w-full sm:w-1/2 font-semibold text-slate-800">{reason || 'Parent Relocation / Higher Studies'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">13. General Conduct:</span>
            <span className="w-full sm:w-1/2 font-bold text-emerald-700">{conduct || 'Good / Exemplary'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dotted border-slate-300 pb-1 gap-0.5 sm:gap-2">
            <span className="w-full sm:w-1/2 text-slate-600 font-medium">14. Any Other Remarks:</span>
            <span className="w-full sm:w-1/2 font-medium text-slate-800">{remarks || 'Promoted to higher class with good conduct.'}</span>
          </div>
        </div>

        {/* Official Signatures & Seal */}
        <div className="pt-6 mt-4 border-t-2 border-slate-800 grid grid-cols-3 gap-4 text-center text-xs font-sans relative z-10">
          <div>
            <div className="h-8 border-b border-dashed border-slate-400 mx-2 sm:mx-4"></div>
            <p className="mt-1.5 font-bold text-slate-800 uppercase tracking-wide text-[11px] sm:text-xs">Class Teacher</p>
            <p className="text-[10px] text-slate-400">Prepared By</p>
          </div>
          <div>
            <div className="h-8 flex items-center justify-center">
              <div className="h-11 w-11 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center text-[7px] text-slate-600 font-bold uppercase rotate-6">
                Official Seal
              </div>
            </div>
            <p className="mt-1.5 font-bold text-slate-800 uppercase tracking-wide text-[11px] sm:text-xs">Checked By</p>
            <p className="text-[10px] text-slate-400">Office In-Charge</p>
          </div>
          <div>
            <div className="h-8 border-b border-dashed border-slate-400 mx-2 sm:mx-4"></div>
            <p className="mt-1.5 font-bold text-slate-800 uppercase tracking-wide text-[11px] sm:text-xs">{school?.principalName || 'Principal'}</p>
            <p className="text-[10px] text-slate-400">Head of Institution</p>
          </div>
        </div>
      </div>
    </div>
  )
}
