import React from 'react'
import { formatDate } from '../../utils/helpers'
import { ShieldCheck, Award } from 'lucide-react'

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

  const fullName = student?.fullName || (student ? `${student.firstName} ${student.lastName || ''}`.trim() : certificate.studentName || 'Student')
  const className = student?.className || (student?.class ? `${student.class.name} - Section ${student.class.section}` : lastClass || 'Class 10')

  return (
    <div className="tc-printable bg-white text-slate-900 font-serif p-8 border-2 border-double border-slate-400 rounded-xl shadow-lg max-w-4xl mx-auto my-4 print:p-6 print:border-none print:shadow-none print:m-0 print:w-full">
      {/* Decorative Outer Border */}
      <div className="border border-slate-300 p-6 rounded-lg relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-8xl font-black uppercase rotate-45 text-slate-900 tracking-widest">
            {school?.name || 'TRANSFER CERTIFICATE'}
          </span>
        </div>

        {/* School Header */}
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold">
              🏫
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 font-serif">
                {school?.name || 'Daily Day Academy'}
              </h1>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                {school?.address || '123 Education Street, New Delhi - 110001'}
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                Phone: {school?.phone} • Email: {school?.email} • Affiliation No: {school?.affiliationNumber || 'CBSE-89432'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center my-3">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-slate-900 underline decoration-slate-400 decoration-1 underline-offset-4">
            Transfer Certificate
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1 italic">
            (School Leaving Certificate issued in accordance with Education Board Rules)
          </p>
        </div>

        {/* Meta Bar */}
        <div className="flex items-center justify-between text-xs font-sans border-y border-slate-300 py-2.5 my-4 px-2 bg-slate-50/70">
          <div>
            <span className="font-semibold text-slate-600">TC Number: </span>
            <span className="font-bold text-slate-900 font-mono text-sm">{tcNumber}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Admission / Student ID: </span>
            <span className="font-bold text-slate-900">{student?.studentId}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Date of Issue: </span>
            <span className="font-bold text-slate-900">{formatDate(issueDate || new Date())}</span>
          </div>
        </div>

        {/* Formal Numbered Clauses */}
        <div className="space-y-3 text-xs sm:text-sm font-sans my-5 leading-relaxed">
          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">1. Name of Student:</span>
            <span className="w-1/2 font-bold text-slate-900 uppercase">{fullName}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">2. Father's / Guardian's Name:</span>
            <span className="w-1/2 font-semibold text-slate-800">{student?.fatherName || '—'}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">3. Mother's Name:</span>
            <span className="w-1/2 font-semibold text-slate-800">{student?.motherName || '—'}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">4. Nationality & Gender:</span>
            <span className="w-1/2 font-semibold text-slate-800">Indian / {student?.gender || 'MALE'}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">5. Date of First Admission in School with Class:</span>
            <span className="w-1/2 font-semibold text-slate-800">{formatDate(student?.admissionDate)} (Class 10)</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">6. Date of Birth (according to Admission Register):</span>
            <span className="w-1/2 font-semibold text-slate-800">{formatDate(student?.dob)}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">7. Class in which the student last studied:</span>
            <span className="w-1/2 font-bold text-slate-900">{className}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">8. School / Board Annual Examination Result:</span>
            <span className="w-1/2 font-bold text-emerald-700 uppercase">{resultStatus || 'PASSED'}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">9. Subjects Studied:</span>
            <span className="w-1/2 font-medium text-slate-800">1. English 2. Mathematics 3. Science 4. Social Science 5. Computer</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">10. Month up to which school dues have been paid:</span>
            <span className="w-1/2 font-semibold text-slate-800">All Dues Cleared up to Current Session</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">11. Date of student's last attendance at school:</span>
            <span className="w-1/2 font-semibold text-slate-800">{formatDate(leavingDate || new Date())}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">12. Reason for leaving the school:</span>
            <span className="w-1/2 font-semibold text-slate-800">{reason || 'Parent Relocation / Higher Studies'}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">13. General Conduct:</span>
            <span className="w-1/2 font-bold text-emerald-700">{conduct || 'Good / Exemplary'}</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1.5">
            <span className="w-1/2 text-slate-600 font-medium">14. Any Other Remarks:</span>
            <span className="w-1/2 font-medium text-slate-800">{remarks || 'Promoted to higher class with good conduct.'}</span>
          </div>
        </div>

        {/* Official Signatures & Seal */}
        <div className="pt-10 mt-8 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-center text-xs font-sans">
          <div>
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="mt-2 font-bold text-slate-800 uppercase tracking-wide">Class Teacher</p>
            <p className="text-[10px] text-slate-400">Prepared By</p>
          </div>
          <div>
            <div className="h-12 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[8px] text-slate-500 font-bold uppercase rotate-6">
                Official Seal
              </div>
            </div>
            <p className="mt-2 font-bold text-slate-800 uppercase tracking-wide">Checked By</p>
            <p className="text-[10px] text-slate-400">Office In-Charge</p>
          </div>
          <div>
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="mt-2 font-bold text-slate-800 uppercase tracking-wide">{school?.principalName || 'Principal'}</p>
            <p className="text-[10px] text-slate-400">Head of Institution</p>
          </div>
        </div>
      </div>
    </div>
  )
}
