import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, CheckSquare, Square } from 'lucide-react'
import Button from '../common/Button'
import { formatDate } from '../../utils/helpers'

function LetterBoxes({ text = '', count = 25, className = '' }) {
  const letters = (text || '').toUpperCase().split('').slice(0, count)
  const boxes = Array.from({ length: count }, (_, i) => letters[i] || '')

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {boxes.map((char, index) => (
        <span
          key={index}
          className="inline-flex h-7 w-6 sm:h-8 sm:w-7 items-center justify-center border border-slate-700 font-mono text-xs sm:text-sm font-bold text-slate-900 bg-white"
        >
          {char}
        </span>
      ))}
    </div>
  )
}

function CheckboxBox({ checked = false, label = '' }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
      <span className="inline-flex h-4 w-4 items-center justify-center border-2 border-slate-900 text-slate-900 bg-white">
        {checked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </span>
  )
}

function AdmissionFormModal({ open, onClose, student }) {
  const printContentRef = useRef(null)
  const [activeTab, setActiveTab] = useState('both') // 'both' | 'front' | 'back'

  if (!open || !student) return null

  const handlePrint = () => {
    const printContents = printContentRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Day Academy - Admission Form - ${student.studentId || student.scholarNo || ''}</title>
        <style>
          @page {
            size: A4;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.35;
          }
          .page-container {
            border: 2px solid #0f172a;
            padding: 14px;
            max-width: 820px;
            margin: 0 auto 16px;
            background: #ffffff;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .header {
            text-align: center;
            position: relative;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .photo-box {
            position: absolute;
            right: 0;
            top: 10px;
            width: 80px;
            height: 98px;
            border: 2px dashed #475569;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            font-size: 10px;
            font-weight: bold;
            overflow: hidden;
          }
          .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .box-item {
            display: inline-flex;
            width: 18px;
            height: 20px;
            border: 1px solid #0f172a;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-size: 10px;
            font-weight: bold;
            background: #ffffff;
          }
          .dotted-line {
            border-bottom: 1px dashed #334155;
            padding: 0 4px;
          }
          .solid-line {
            border-bottom: 1px solid #0f172a;
            padding: 0 4px;
          }
        </style>
      </head>
      <body>
        ${printContents}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const studentFullName =
    student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim()
  const admissionClass = student.className || student.class?.name || ''
  const medium = student.medium || 'HINDI'
  const dobDate = student.dob ? new Date(student.dob) : null
  const dobDay = dobDate ? String(dobDate.getDate()).padStart(2, '0') : ''
  const dobMonth = dobDate ? String(dobDate.getMonth() + 1).padStart(2, '0') : ''
  const dobYear = dobDate ? String(dobDate.getFullYear()) : ''

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95dvh]">
        
        {/* Top bar with Tabs & Print */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Admission Form (प्रवेश फार्म) - Daily Day Academy
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'both' ? 'bg-white shadow-xs text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Full Form (Both Sides)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('front')}
              className={`px-2.5 py-1 rounded-md transition ${activeTab === 'front' ? 'bg-white shadow-xs text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Page 1 (Front)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('back')}
              className={`px-2.5 py-1 rounded-md transition ${activeTab === 'back' ? 'bg-white shadow-xs text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Page 2 (Office Use)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" leftIcon={Printer} onClick={handlePrint}>
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex flex-col items-center gap-6">
          <div ref={printContentRef} className="w-full max-w-[800px]">

            {/* ======================================================== */}
            {/* PAGE 1: FRONT SIDE - ADMISSION FORM (प्रवेश फार्म)        */}
            {/* ======================================================== */}
            {(activeTab === 'both' || activeTab === 'front') && (
              <div
                className="page-container bg-white border-2 border-slate-900 p-4 sm:p-6 shadow-md text-slate-900 text-xs sm:text-[13px] leading-snug page-break"
                style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}
              >
                {/* Top Registration Line */}
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 pb-1">
                  <span>Regd. - Dise-23260103731</span>
                  <span>Regd. by Govt.</span>
                </div>

                {/* School Header Banner */}
                <div className="relative text-center border-b-2 border-slate-900 pb-3 mb-3 pr-24">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950 m-0">
                    DAILY DAY ACADEMY
                  </h1>
                  <p className="text-[12px] sm:text-[13px] font-bold text-slate-800 m-0">
                    1093, RAJEEV AWAS VIHAR SCH. NO.114 INDORE
                  </p>
                  <div className="mt-2 inline-block border-2 border-slate-900 rounded-full px-5 py-1 bg-slate-100 font-extrabold text-sm sm:text-base">
                    ADMISSION FORM प्रवेश फार्म
                  </div>

                  {/* Photo Box */}
                  <div className="absolute right-0 top-0 w-20 h-24 sm:w-22 sm:h-28 border-2 border-dashed border-slate-700 bg-slate-50 flex flex-col items-center justify-center text-center overflow-hidden">
                    {student.photo ? (
                      <img src={student.photo} alt="Student" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-[11px] font-bold text-slate-500">
                        Photo<br />फोटो
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Meta Row: Form No, Date, Scholar No */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 font-semibold text-xs mb-2">
                  <div className="flex items-center gap-1.5">
                    <span>Form No.:</span>
                    <span className="font-bold border-b border-slate-900 px-2 min-w-[60px] inline-block font-mono">
                      {student.formNo || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Date:</span>
                    <span className="font-bold border-b border-slate-900 px-2 min-w-[80px] inline-block">
                      {formatDate(student.admissionDate || new Date())}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Scholar No.:</span>
                    <span className="font-mono font-bold border border-slate-800 px-2 py-0.5 bg-slate-50 text-indigo-700">
                      {student.scholarNo || student.studentId || '—'}
                    </span>
                  </div>
                </div>

                {/* Request Line */}
                <div className="bg-slate-50/80 border border-slate-300 rounded p-2 mb-3 text-xs leading-relaxed">
                  <p className="m-0 font-medium">
                    Kindly admit my son/Daughter to your institution in std.{' '}
                    <strong className="border-b border-slate-800 px-2 text-indigo-700 font-bold">{admissionClass || '______'}</strong> Medium{' '}
                    <strong className="border-b border-slate-800 px-2 font-bold uppercase">{medium || '______'}</strong>
                  </p>
                  <p className="m-0 font-medium text-slate-700">
                    कृप्या मेरे पुत्र/पुत्री को आपके विद्यालय में कक्षा{' '}
                    <strong className="border-b border-slate-800 px-2">{admissionClass || '______'}</strong> माध्यम{' '}
                    <strong className="border-b border-slate-800 px-2 uppercase">{medium || '______'}</strong> में प्रवेश प्रदान करें।
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 italic">
                    Required information for your records are given below: (आपके रिकार्ड के लिए आवश्यक जानकारी निम्नानुसार है)
                  </p>
                </div>

                {/* Field 1: Name of Student (English & Hindi) */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Name of Student (In Block Letters):</span>
                    <span className="text-slate-600">{studentFullName}</span>
                  </div>
                  <LetterBoxes text={studentFullName} count={28} />

                  <div className="flex justify-between text-[11px] font-bold pt-1">
                    <span>विद्यार्थी का नाम (हिन्दी में):</span>
                    <span className="text-slate-800 font-semibold">{student.nameInHindi || studentFullName}</span>
                  </div>
                  <div className="border border-slate-700 bg-white p-1.5 font-bold text-sm min-h-[28px]">
                    {student.nameInHindi || '—'}
                  </div>
                </div>

                {/* Field 2: Father's Name (English & Hindi) */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Father's Name:</span>
                    <span className="text-slate-600">{student.fatherName || ''}</span>
                  </div>
                  <LetterBoxes text={student.fatherName || ''} count={28} />

                  <div className="flex justify-between text-[11px] font-bold pt-1">
                    <span>पिता का नाम (हिन्दी में):</span>
                    <span className="text-slate-800 font-semibold">{student.fatherNameHindi || ''}</span>
                  </div>
                  <div className="border border-slate-700 bg-white p-1.5 font-bold text-sm min-h-[28px]">
                    {student.fatherNameHindi || '—'}
                  </div>
                </div>

                {/* Field 3: Mother's Name (English & Hindi) */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Mother's Name:</span>
                    <span className="text-slate-600">{student.motherName || ''}</span>
                  </div>
                  <LetterBoxes text={student.motherName || ''} count={28} />

                  <div className="flex justify-between text-[11px] font-bold pt-1">
                    <span>माता का नाम (हिन्दी में):</span>
                    <span className="text-slate-800 font-semibold">{student.motherNameHindi || ''}</span>
                  </div>
                  <div className="border border-slate-700 bg-white p-1.5 font-bold text-sm min-h-[28px]">
                    {student.motherNameHindi || '—'}
                  </div>
                </div>

                {/* Field 4: Occupation & Income */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-1 border-b border-slate-200 mb-2 font-semibold">
                  <div className="flex items-center gap-2">
                    <span>Occupation (व्यवसाय):</span>
                    <span className="border-b border-slate-800 px-2 font-bold min-w-[140px] inline-block">
                      {student.occupation || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Income (आय):</span>
                    <span className="border-b border-slate-800 px-2 font-bold min-w-[120px] inline-block">
                      {student.annualIncome ? `₹ ${student.annualIncome}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Field 5: Permanent Address (स्थाई पता) */}
                <div className="mb-2.5">
                  <span className="font-bold text-[11px] block text-slate-800">Permanent Address (स्थाई पता):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>H.No.:</span>
                      <span className="border-b border-slate-800 px-1 font-semibold flex-1">
                        {student.houseNo || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Apartment/Sector/Street:</span>
                      <span className="border-b border-slate-800 px-1 font-semibold flex-1">
                        {student.apartmentSectorStreet || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Colony:</span>
                      <span className="border-b border-slate-800 px-1 font-semibold flex-1">
                        {student.colony || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Mob. / Phone:</span>
                      <span className="border-b border-slate-800 px-1 font-semibold flex-1 font-mono">
                        {student.phone || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Dist.:</span>
                      <span className="border-b border-slate-800 px-1 font-semibold flex-1">
                        {student.district || 'Indore'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>State:</span>
                      <span className="border-b border-slate-800 px-1 font-semibold flex-1">
                        {student.state || 'Madhya Pradesh'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Field 6: Date of Birth & Words & Age */}
                <div className="border-t border-slate-200 pt-2 mb-2 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-[11px]">Date of Birth (जन्म दिनांक):</span>
                    <div className="flex items-center gap-1">
                      <span>DD</span>
                      <span className="inline-flex h-6 w-8 items-center justify-center border border-slate-800 font-mono font-bold bg-white">{dobDay || '__'}</span>
                      <span>MM</span>
                      <span className="inline-flex h-6 w-8 items-center justify-center border border-slate-800 font-mono font-bold bg-white">{dobMonth || '__'}</span>
                      <span>YY</span>
                      <span className="inline-flex h-6 w-14 items-center justify-center border border-slate-800 font-mono font-bold bg-white">{dobYear || '____'}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="font-bold text-[11px]">Gender:</span>
                      <span className="border border-slate-800 px-2 py-0.5 font-bold uppercase">{student.gender || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px]">Date of Birth (In words) / जन्म दिनांक शब्दों में:</span>
                    <span className="border-b border-slate-800 font-semibold px-2 flex-1">
                      {student.dobInWords || '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px]">Age as On 1st July (1 जुलाई आयु):</span>
                    <span className="border-b border-slate-800 font-semibold px-2 flex-1">
                      {student.ageAsOnJuly1 || '—'}
                    </span>
                  </div>
                </div>

                {/* Field 7: Social Category & Demographics */}
                <div className="border-t border-slate-200 pt-2 mb-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] block text-slate-500">Mother Tongue (मातृभाषा):</span>
                      <span className="font-bold border-b border-slate-800 block pb-0.5">{student.motherTongue || 'Hindi'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] block text-slate-500">Religion (धर्म):</span>
                      <span className="font-bold border-b border-slate-800 block pb-0.5">{student.religion || 'Hindu'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] block text-slate-500">Caste (जाति):</span>
                      <span className="font-bold border-b border-slate-800 block pb-0.5">{student.caste || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] block text-slate-500">Category (वर्ग):</span>
                      <span className="font-bold border-b border-slate-800 block pb-0.5 text-indigo-700">{student.category || 'GEN'}</span>
                    </div>
                  </div>
                </div>

                {/* Field 8: Previous School & DISE Code */}
                <div className="border-t border-slate-200 pt-2 mb-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px]">Name of school previously attended (if any):</span>
                    <span className="border-b border-slate-800 font-semibold px-2 flex-1">
                      {student.previousSchool || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-bold text-[11px]">पिछले विद्यालय का डायस कोड (DISE Code):</span>
                    <LetterBoxes text={student.previousSchoolDiseCode || ''} count={15} />
                  </div>
                </div>

                {/* Field 9: SSSM ID, Family ID, Bank A/C, IFSC */}
                <div className="border-t border-slate-200 pt-2 mb-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="font-bold text-[11px] block mb-1">SSSM I.D. (समग्र आई.डी. - 9 Digits):</span>
                      <LetterBoxes text={student.sssmId || ''} count={9} />
                    </div>
                    <div>
                      <span className="font-bold text-[11px] block mb-1">Family ID (परिवार आई.डी. - 8 Digits):</span>
                      <LetterBoxes text={student.familyId || ''} count={8} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="font-bold text-[11px] block mb-1">A/C NO. (बैंक खाता क्रमांक):</span>
                      <LetterBoxes text={student.bankAccountNo || ''} count={16} />
                    </div>
                    <div>
                      <span className="font-bold text-[11px] block mb-1">IFSC Code (आई.एफ.एस.सी. कोड):</span>
                      <LetterBoxes text={student.ifscCode || ''} count={11} />
                    </div>
                  </div>
                </div>

                {/* Declaration Section */}
                <div className="border-t-2 border-slate-900 pt-2 text-[10.5px] leading-relaxed text-slate-800">
                  <p className="m-0 font-medium">
                    I Certify that the information given above is true to the best of my knowledge and if the above is proved wrong/incorrect I will be solely responsible for the same.
                  </p>
                  <p className="m-0 font-medium mt-0.5">
                    मैं यह प्रमाणित करता हूँ कि मेरे द्वारा दी गई उपरोक्त जानकारी सही है, यदि उपरोक्त जानकारी गलत होती है तो उसकी सम्पूर्ण जवाबदारी मेरी होगी। और विद्यालय के सभी नियम मुझे मान्य है।
                  </p>

                  {/* Date, Place, Enclosures & Signature */}
                  <div className="flex justify-between items-center mt-3 pt-2 text-xs font-semibold">
                    <div className="space-y-1">
                      <div>दिनांक / Date: <span className="border-b border-slate-800 px-2 font-bold">{formatDate(student.admissionDate || new Date())}</span></div>
                      <div>स्थान / Place: <span className="border-b border-slate-800 px-2 font-bold">Indore</span></div>
                      <div>संलग्न: Encl. <span className="border-b border-slate-800 px-2 font-bold">{student.enclosures || '1. Samagra ID  2. Birth Certificate'}</span></div>
                    </div>

                    <div className="text-center pt-8 pr-4">
                      <div className="border-t border-dashed border-slate-900 w-48 text-center pt-1 font-bold text-xs">
                        Signature of Parents/Guardian<br />
                        <span className="text-[11px] text-slate-700">पिता / पालक के हस्ताक्षर</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PAGE 2: BACK SIDE - FOR OFFICE USE ONLY (कार्यालयीन उपयोग) */}
            {/* ======================================================== */}
            {(activeTab === 'both' || activeTab === 'back') && (
              <div
                className="page-container bg-white border-2 border-slate-900 p-5 sm:p-7 shadow-md text-slate-900 text-xs sm:text-[13px] leading-relaxed mt-6"
                style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}
              >
                {/* Header: FOR OFFICE USE ONLY */}
                <div className="text-center pb-3 mb-4 border-b-2 border-slate-900">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950 inline-block border-b-2 border-slate-900 pb-1">
                    FOR OFFICE USE ONLY
                  </h2>
                  <p className="text-[11px] font-bold text-slate-600 m-0 mt-1">
                    (कार्यालयीन उपयोग हेतु)
                  </p>
                </div>

                {/* Section: INTERVIEW / TEST */}
                <div className="space-y-2 mb-4">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="underline">INTERVIEW / TEST</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 font-semibold text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span>DATE :</span>
                      <span className="border-b border-slate-900 min-w-[120px] inline-block font-bold px-1">
                        {student.testDate ? formatDate(student.testDate) : '________________'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>TIME :</span>
                      <span className="border-b border-slate-900 min-w-[100px] inline-block font-bold px-1">
                        {student.testTime || '________________'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="font-semibold block">INTERVIEW & TEST DETAILS :</span>
                    <div className="border-b border-slate-900 min-h-[24px] pt-1 px-1 font-medium text-slate-800">
                      {student.testRemarks || student.interviewRemarks || ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                    <span className="font-semibold">INTERVIEW & TEST CONDUCTED BY :</span>
                    <span className="border-b border-slate-900 flex-1 min-w-[150px] inline-block font-bold px-1">
                      {student.testConductedBy || '________________________________'}
                    </span>
                    <span className="font-semibold">ON :</span>
                    <span className="border-b border-slate-900 min-w-[100px] inline-block font-bold px-1">
                      {student.testDate ? formatDate(student.testDate) : '____________'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="font-semibold block">REMARKS - TEST ( SUBJECT WISE ) :</span>
                    <div className="border-b border-slate-900 min-h-[24px] pt-1 px-1 font-medium text-slate-800">
                      {student.testRemarks || 'Satisfactory'}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="font-semibold block">INTERVIEW - PARENT / GUARDIAN :</span>
                    <div className="border-b border-slate-900 min-h-[24px] pt-1 px-1 font-medium text-slate-800">
                      {student.interviewRemarks || 'Cooperative and agreed to school rules'}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <div className="text-right">
                      <span className="border-b border-slate-900 inline-block min-w-[160px]"></span>
                      <span className="block text-[11px] font-bold text-slate-700 mt-1">SIGNATURE</span>
                    </div>
                  </div>
                </div>

                {/* Admission Status & Scholar No */}
                <div className="border-t-2 border-slate-900 pt-4 mb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 font-bold text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className={student.admissionGranted !== 'NOT_GRANTED' ? 'bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300' : 'text-slate-400'}>
                        [ ✓ ] ADMISSION GRANTED
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className={student.admissionGranted === 'NOT_GRANTED' ? 'bg-rose-100 text-rose-900 px-2 py-0.5 rounded border border-rose-300' : 'text-slate-400'}>
                        [ {student.admissionGranted === 'NOT_GRANTED' ? '✓' : ' '} ] NOT GRANTED
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span>SCHOLAR NO. :</span>
                      <span className="border border-slate-900 px-3 py-1 font-black bg-slate-50 text-indigo-700 text-sm">
                        {student.scholarNo || student.studentId || '________'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-semibold text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span>ADMITTED TO CLASS :</span>
                      <span className="border-b border-slate-900 flex-1 font-bold text-indigo-700 px-1">
                        {admissionClass || '______'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>SECTION :</span>
                      <span className="border-b border-slate-900 flex-1 font-bold text-indigo-700 px-1">
                        {student.section || 'A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>BUS NO. :</span>
                      <span className="border-b border-slate-900 flex-1 font-bold text-indigo-700 px-1">
                        {student.busNumber || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Verification Checklist */}
                <div className="border-t-2 border-slate-900 pt-4 mb-4 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                    Document Verification Checklist (दस्तावेज सत्यापन)
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-semibold text-slate-800">COPY OF THE BIRTH CERTIFICATE</span>
                      <div className="flex items-center gap-4">
                        <CheckboxBox checked={student.docBirthCertificate !== 'NOT_SUBMITTED'} label="SUBMITTED" />
                        <CheckboxBox checked={student.docBirthCertificate === 'NOT_SUBMITTED'} label="NOT SUBMITTED" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-semibold text-slate-800">TRANSFER CERTIFICATE (COUNTERSIGNED)</span>
                      <div className="flex items-center gap-4">
                        <CheckboxBox checked={student.docTransferCertificate !== 'NOT_SUBMITTED'} label="SUBMITTED" />
                        <CheckboxBox checked={student.docTransferCertificate === 'NOT_SUBMITTED'} label="NOT SUBMITTED" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-semibold text-slate-800">CASTE CERTIFICATE (If applicable)</span>
                      <div className="flex items-center gap-4">
                        <CheckboxBox checked={student.docCasteCertificate === 'SUBMITTED'} label="SUBMITTED" />
                        <CheckboxBox checked={student.docCasteCertificate === 'NOT_SUBMITTED'} label="NOT SUBMITTED" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-semibold text-slate-800">COPY OF THE MARKSHEET</span>
                      <div className="flex items-center gap-4">
                        <CheckboxBox checked={student.docMarksheet !== 'NOT_SUBMITTED'} label="SUBMITTED" />
                        <CheckboxBox checked={student.docMarksheet === 'NOT_SUBMITTED'} label="NOT SUBMITTED" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">IF THE ABOVE DOCUMENTS ARE NOT SUBMITTED, THE LAST DATE FOR SUBMISSION :</span>
                      <span className="border-b border-slate-900 min-w-[140px] inline-block font-bold text-rose-700 px-1">
                        {student.docPendingLastDate ? formatDate(student.docPendingLastDate) : '________________'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">ADMISSION FORMALITIES / FEE TO DEPOSIT ON :</span>
                      <span className="border-b border-slate-900 min-w-[140px] inline-block font-bold text-indigo-700 px-1">
                        {student.feeDepositDate ? formatDate(student.feeDepositDate) : '________________'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructions / Remarks */}
                <div className="border-t-2 border-slate-900 pt-3 mb-6 space-y-1 text-xs">
                  <span className="font-semibold block">INSTRUCTION (IF ANY) :</span>
                  <div className="border-b border-slate-900 min-h-[22px] px-1 font-medium">
                    {student.officeInstructions || ''}
                  </div>
                  <div className="border-b border-slate-900 min-h-[22px]"></div>
                  <div className="border-b border-slate-900 min-h-[22px]"></div>
                </div>

                {/* Official Signatures Line */}
                <div className="border-t-2 border-slate-900 pt-8 mt-6">
                  <div className="flex justify-between items-end text-xs font-bold">
                    <div className="text-center">
                      <div className="border-t border-dashed border-slate-900 min-w-[180px] pt-1">
                        SIGNATURE OF ADMISSION OFFICER
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        DATE: <span className="font-normal">{formatDate(student.admissionDate || new Date())}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="border-t border-dashed border-slate-900 min-w-[180px] pt-1">
                        SIGNATURE OF PRINCIPAL / DIRECTOR
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        DAILY DAY ACADEMY, INDORE
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AdmissionFormModal
