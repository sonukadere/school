import { useRef, useState, useEffect, useMemo } from 'react'
import {
  Camera,
  Upload,
  User,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  School,
  Landmark,
  MapPin,
  ClipboardCheck,
  Bus,
  CheckCircle2,
  Users,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  ListFilter,
  Trash2,
  Printer,
  ShieldCheck,
  FileCheck,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import AdmissionFormModal from './AdmissionFormModal'
import {
  SECTION_OPTIONS,
  GENDER_OPTIONS,
} from '../../utils/constants'
import { api } from '../../services/api'

const MEDIUM_OPTIONS = [
  { value: 'HINDI', label: 'Hindi (हिन्दी)' },
  { value: 'ENGLISH', label: 'English (अंग्रेजी)' },
]

const ADMISSION_STATUS_OPTIONS = [
  { value: 'GRANTED', label: 'Admission Granted (प्रवेश स्वीकृत)' },
  { value: 'NOT_GRANTED', label: 'Admission Not Granted (प्रवेश अस्वीकृत)' },
]

const DOC_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted (जमा किया)' },
  { value: 'NOT_SUBMITTED', label: 'Not Submitted (जमा नहीं किया)' },
]

const CASTE_DOC_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted (जमा किया)' },
  { value: 'NOT_SUBMITTED', label: 'Not Submitted (जमा नहीं किया)' },
  { value: 'NA', label: 'Not Applicable (लागू नहीं)' },
]

const CATEGORY_OPTIONS = [
  { value: 'GEN', label: 'GEN (सामान्य)' },
  { value: 'OBC', label: 'OBC (अ.पि.व.)' },
  { value: 'SC', label: 'SC (अ.जा.)' },
  { value: 'ST', label: 'ST (अ.ज.जा.)' },
]

const RELIGION_OPTIONS = [
  { value: 'Hindu', label: 'Hindu (हिन्दू)' },
  { value: 'Muslim', label: 'Muslim (मुस्लिम)' },
  { value: 'Jain', label: 'Jain (जैन)' },
  { value: 'Sikh', label: 'Sikh (सिख)' },
  { value: 'Christian', label: 'Christian (ईसाई)' },
  { value: 'Other', label: 'Other (अन्य)' },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numberToWords(num) {
  if (num === 0) return 'Zero'
  if (num < 20) return ONES[num]
  if (num < 100) return `${TENS[Math.floor(num / 10)]} ${ONES[num % 10]}`.trim()
  if (num < 1000) return `${ONES[Math.floor(num / 100)]} Hundred ${numberToWords(num % 100)}`.trim()
  if (num < 1000000) return `${numberToWords(Math.floor(num / 1000))} Thousand ${numberToWords(num % 1000)}`.trim()
  return String(num)
}

function convertDateToWords(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return ''
  const year = parseInt(parts[0], 10)
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)

  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) return ''

  const dayWord = numberToWords(day)
  const monthWord = MONTH_NAMES[monthIdx]
  const yearWord = numberToWords(year)

  return `${dayWord} ${monthWord} ${yearWord}`
}

function calculateAgeOnJuly1(dobStr, admissionDateStr) {
  if (!dobStr) return ''
  const birthDate = new Date(dobStr)
  if (isNaN(birthDate.getTime())) return ''

  let targetYear = new Date().getFullYear()
  if (admissionDateStr) {
    const adm = new Date(admissionDateStr)
    if (!isNaN(adm.getTime())) {
      targetYear = adm.getFullYear()
    }
  }

  const targetDate = new Date(targetYear, 6, 1)

  let years = targetDate.getFullYear() - birthDate.getFullYear()
  let months = targetDate.getMonth() - birthDate.getMonth()
  let days = targetDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months -= 1
    const prevMonthDays = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate()
    days += prevMonthDays
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) return '0 Years'
  return `${years} Years, ${months} Months, ${days} Days`
}

const EMPTY_VALUES = {
  photo: '',
  fullName: '',
  nameInHindi: '',
  studentId: '',
  formNo: '',
  scholarNo: '',
  medium: 'HINDI',
  gender: 'Male',
  dob: '',
  dobInWords: '',
  ageAsOnJuly1: '',
  rollNumber: '',
  admissionDate: new Date().toISOString().slice(0, 10),

  fatherName: '',
  fatherNameHindi: '',
  motherName: '',
  motherNameHindi: '',
  occupation: '',
  annualIncome: '',

  houseNo: '',
  apartmentSectorStreet: '',
  colony: '',
  district: 'Indore',
  state: 'Madhya Pradesh',
  phone: '',
  email: '',
  address: '',

  className: '',
  section: 'A',

  motherTongue: 'Hindi',
  religion: 'Hindu',
  caste: '',
  category: 'GEN',

  previousSchool: '',
  previousSchoolDiseCode: '',

  sssmId: '',
  familyId: '',
  bankAccountNo: '',
  ifscCode: '',
  enclosures: '1. Samagra ID, 2. Birth Certificate',

  busNumber: '',
  admissionGranted: 'GRANTED',
  testDate: '',
  testTime: '',
  testConductedBy: '',
  testRemarks: '',
  interviewRemarks: '',
  docBirthCertificate: 'SUBMITTED',
  docTransferCertificate: 'SUBMITTED',
  docCasteCertificate: 'NA',
  docMarksheet: 'SUBMITTED',
  docPendingLastDate: '',
  feeDepositDate: '',
  officeInstructions: '',

  createLoginAccount: true,
  username: '',
  password: 'student123',
}

const TABS = [
  { id: 'academic', label: '1. Student & Academic', hindi: 'विद्यार्थी व शैक्षणिक', icon: School, short: 'Academic' },
  { id: 'parents', label: '2. Parents & Address', hindi: 'पालक व पता', icon: Users, short: 'Parents' },
  { id: 'gov', label: '3. Demographics & IDs', hindi: 'सामाजिक व समग्र', icon: Landmark, short: 'Govt IDs' },
  { id: 'office', label: '4. Office Use & Portal', hindi: 'कार्यालय व पोर्टल', icon: ClipboardCheck, short: 'Office' },
]

function PhotoUploader({ value, onChange }) {
  const fileInputRef = useRef(null)

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-indigo-50/20">
      <div className="relative shrink-0">
        {value ? (
          <img
            src={value}
            alt="Student"
            className="h-24 w-24 rounded-2xl border-2 border-indigo-400 object-cover shadow-md"
          />
        ) : (
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-white text-indigo-300 shadow-inner">
            <User size={34} />
            <span className="text-[10px] font-bold text-slate-400 mt-1">फोटो / Photo</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute -right-1.5 -bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700 hover:scale-105"
          aria-label="Upload photo"
          title="Upload / Change Photo"
        >
          <Camera size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={Upload}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold bg-white shadow-2xs"
          >
            {value ? 'Change Photo' : 'Upload Student Photo'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={Trash2}
              onClick={() => onChange('')}
              className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Passport size photograph for official identity, student ID card & admission register records.
        </p>
      </div>
    </div>
  )
}

function StudentForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Complete Admission', classes: propClasses }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('academic')
  const [viewMode, setViewMode] = useState('tabs') // 'tabs' | 'all'
  const [showPassword, setShowPassword] = useState(false)
  const [classes, setClasses] = useState(propClasses || [])
  const [loadingClasses, setLoadingClasses] = useState(!propClasses)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  useEffect(() => {
    if (propClasses && propClasses.length > 0) {
      setClasses(propClasses)
      setLoadingClasses(false)
      return
    }

    let isMounted = true
    setLoadingClasses(true)
    api.getClasses()
      .then((data) => {
        if (isMounted) {
          setClasses(Array.isArray(data) ? data : [])
          setLoadingClasses(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load classes in StudentForm:', err)
        if (isMounted) {
          setClasses([])
          setLoadingClasses(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [propClasses])

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setValues((prev) => ({
        ...prev,
        ...initialValues,
      }))
    }
  }, [initialValues])

  const classOptions = useMemo(() => {
    const dbClassNames = classes.map((c) => c.name).filter(Boolean)
    const existingName = initialValues?.className
    const allNames = Array.from(new Set([...dbClassNames, ...(existingName ? [existingName] : [])]))

    allNames.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10)
      const numB = parseInt(b.replace(/\D/g, ''), 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })

    return allNames.map((name) => ({ value: name, label: name }))
  }, [classes, initialValues?.className])

  const sectionOptions = useMemo(() => {
    if (!values.className) return SECTION_OPTIONS
    const matching = classes.filter((c) => c.name === values.className && c.section)
    const uniqueSecs = Array.from(new Set(matching.map((c) => c.section).filter(Boolean)))
    if (uniqueSecs.length > 0) {
      return uniqueSecs.map((sec) => ({ value: sec, label: `Section ${sec}` }))
    }
    return SECTION_OPTIONS
  }, [classes, values.className])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setValues((prev) => ({ ...prev, [name]: digitsOnly }))
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
      return
    }

    if (name === 'sssmId' || name === 'familyId') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, name === 'sssmId' ? 9 : 8)
      setValues((prev) => ({ ...prev, [name]: digitsOnly }))
      return
    }

    if (name === 'className') {
      const matching = classes.filter((c) => c.name === value && c.section)
      const uniqueSecs = Array.from(new Set(matching.map((c) => c.section).filter(Boolean)))
      const nextSection =
        uniqueSecs.length > 0 && !uniqueSecs.includes(values.section)
          ? uniqueSecs[0]
          : values.section || (uniqueSecs[0] || 'A')
      setValues((prev) => ({ ...prev, className: value, section: nextSection }))
      if (errors.className) setErrors((prev) => ({ ...prev, className: '' }))
      return
    }

    if (name === 'dob') {
      const words = convertDateToWords(value)
      const ageOnJuly = calculateAgeOnJuly1(value, values.admissionDate)
      setValues((prev) => ({
        ...prev,
        dob: value,
        dobInWords: prev.dobInWords && prev.dobInWords !== convertDateToWords(prev.dob) ? prev.dobInWords : words,
        ageAsOnJuly1: ageOnJuly,
      }))
      if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }))
      return
    }

    if (name === 'admissionDate') {
      const ageOnJuly = calculateAgeOnJuly1(values.dob, value)
      setValues((prev) => ({
        ...prev,
        admissionDate: value,
        ageAsOnJuly1: ageOnJuly || prev.ageAsOnJuly1,
      }))
      return
    }

    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.fullName?.trim()) {
      nextErrors.fullName = 'Full name is required'
    }
    if (!values.gender) {
      nextErrors.gender = 'Gender is required'
    }
    if (!values.dob) {
      nextErrors.dob = 'Date of birth is required'
    }
    if (!values.className) {
      nextErrors.className = 'Class is required'
    }
    if (!values.section) {
      nextErrors.section = 'Section is required'
    }
    if (!values.phone) {
      nextErrors.phone = 'Phone number is required'
    } else if (values.phone.length !== 10) {
      nextErrors.phone = 'Phone number must be exactly 10 digits'
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (nextErrors.fullName || nextErrors.gender || nextErrors.dob || nextErrors.className || nextErrors.section) {
        setActiveTab('academic')
      } else if (nextErrors.phone || nextErrors.email) {
        setActiveTab('parents')
      }
      return
    }

    const combinedAddress = values.address || [
      values.houseNo ? `H.No ${values.houseNo}` : '',
      values.apartmentSectorStreet,
      values.colony,
      values.district,
      values.state,
    ].filter(Boolean).join(', ')

    onSubmit({
      ...values,
      address: combinedAddress || values.address || '',
    })
  }

  const validateStep = (tabId) => {
    const stepErrors = {}
    if (tabId === 'academic') {
      if (!values.fullName?.trim()) stepErrors.fullName = 'Student full name is required'
      if (!values.gender) stepErrors.gender = 'Gender is required'
      if (!values.dob) stepErrors.dob = 'Date of birth is required'
      if (!values.className) stepErrors.className = 'Class is required'
      if (!values.section) stepErrors.section = 'Section is required'
    } else if (tabId === 'parents') {
      if (!values.phone) {
        stepErrors.phone = 'Mobile number is required'
      } else if (values.phone.length !== 10) {
        stepErrors.phone = 'Mobile number must be exactly 10 digits'
      }
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        stepErrors.email = 'Enter a valid email address'
      }
    }
    return stepErrors
  }

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab)

  const handleNextTab = () => {
    const stepErrors = validateStep(activeTab)
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }))
      return
    }
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id)
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id)
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  // Calculate filled documents count
  const verifiedDocsCount = [
    values.docBirthCertificate === 'SUBMITTED',
    values.docTransferCertificate === 'SUBMITTED',
    values.docCasteCertificate === 'SUBMITTED' || values.docCasteCertificate === 'NA',
    values.docMarksheet === 'SUBMITTED',
  ].filter(Boolean).length

  // Completion percentage
  const totalCoreFields = [
    values.fullName,
    values.gender,
    values.dob,
    values.className,
    values.section,
    values.phone,
    values.fatherName,
    values.motherName,
    values.sssmId,
  ]
  const filledCoreCount = totalCoreFields.filter((v) => Boolean(v && String(v).trim())).length
  const progressPercent = Math.min(100, Math.round((filledCoreCount / totalCoreFields.length) * 100))

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full">
        {/* Main Grid: Form on Left (8 cols) + Sticky Live Preview on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: MAIN ADMISSION FORM CONTAINER (8 COLS)                      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top School Branding & Mode Controls */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 shrink-0">
                    <School size={22} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wider uppercase">
                      Official Admission Form • प्रवेश फार्म
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                      Daily Day Academy, Indore
                    </h2>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold self-start sm:self-auto shrink-0 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('tabs')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === 'tabs'
                        ? 'bg-white text-indigo-600 shadow-xs font-bold ring-1 ring-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={14} /> Step-by-Step
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === 'all'
                        ? 'bg-white text-indigo-600 shadow-xs font-bold ring-1 ring-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ListFilter size={14} /> All Sections
                  </button>
                </div>
              </div>

              {/* Stepper Navigation (when in Step-by-Step Mode) */}
              {viewMode === 'tabs' && (
                <div className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TABS.map((tab, idx) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      const isCompleted = idx < currentTabIndex
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex flex-col p-2.5 rounded-xl border text-left transition-all relative ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                              : isCompleted
                              ? 'border-slate-200 bg-slate-50/80 hover:bg-slate-100/70 text-slate-700'
                              : 'border-slate-100 bg-slate-50/40 hover:bg-slate-100/50 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </span>
                            <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                          </div>
                          <p className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                            {tab.short}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{tab.hindi}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 mb-1 font-medium">
                    <span>Form Progress: {progressPercent}% Completed</span>
                    <span>Step {currentTabIndex + 1} of 4</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(15, progressPercent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm space-y-8">
              
              {/* ================================================================= */}
              {/* SECTION 1: STUDENT & ACADEMIC ALLOCATION                         */}
              {/* ================================================================= */}
              {(viewMode === 'all' || activeTab === 'academic') && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
                        1
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                          Student & Academic Allocation (विद्यार्थी व शैक्षणिक विवरण)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Class allocation, scholar number, medium and personal name
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Photo Uploader */}
                  <PhotoUploader
                    value={values.photo}
                    onChange={(photo) => setValues((prev) => ({ ...prev, photo }))}
                  />

                  {/* Student Name: English & Hindi */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Name of Student (English - BLOCK LETTERS)"
                      name="fullName"
                      value={values.fullName}
                      onChange={handleChange}
                      error={errors.fullName}
                      required
                      placeholder="e.g. AARAV SHARMA"
                      helper="Official name as recorded in previous documents"
                    />
                    <Input
                      label="विद्यार्थी का नाम (हिन्दी में)"
                      name="nameInHindi"
                      value={values.nameInHindi}
                      onChange={handleChange}
                      placeholder="उदा. आरव शर्मा"
                      helper="प्रवेश पंजी एवं छात्र पंजी अनुसार"
                    />
                  </div>

                  {/* Form No, Scholar No, Medium, Admission Date (Balanced 4-col) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      label="Form No. (प्रवेश फार्म क्र.)"
                      name="formNo"
                      value={values.formNo}
                      onChange={handleChange}
                      placeholder="e.g. 1024"
                    />
                    <Input
                      label="Scholar No. (स्कॉलर नं.)"
                      name="scholarNo"
                      value={values.scholarNo}
                      onChange={handleChange}
                      placeholder="e.g. SCH-402"
                      helper="Assigned school scholar number"
                    />
                    <Select
                      label="Medium (माध्यम)"
                      name="medium"
                      value={values.medium}
                      onChange={handleChange}
                      options={MEDIUM_OPTIONS}
                      required
                    />
                    <Input
                      label="Admission Date (प्रवेश दिनांक)"
                      type="date"
                      name="admissionDate"
                      value={values.admissionDate}
                      onChange={handleChange}
                      error={errors.admissionDate}
                      required
                    />
                  </div>

                  {/* Class, Section, Roll No, Gender (Balanced 4-col) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Select
                      label="Class (कक्षा)"
                      id="className"
                      name="className"
                      value={values.className}
                      onChange={handleChange}
                      error={errors.className}
                      required
                      options={classOptions}
                      placeholder={loadingClasses ? 'Loading classes...' : classOptions.length === 0 ? 'No classes found' : 'Select class'}
                    />
                    <Select
                      label="Section (वर्ग / सेक्शन)"
                      id="section"
                      name="section"
                      value={values.section}
                      onChange={handleChange}
                      error={errors.section}
                      required
                      options={sectionOptions}
                      placeholder="Select section"
                      helper="Section A (1–50 students). Sections B, C auto-scale when count exceeds 50."
                    />
                    <Input
                      label="Roll Number (रोल नंबर)"
                      type="number"
                      name="rollNumber"
                      value={values.rollNumber}
                      onChange={handleChange}
                      error={errors.rollNumber}
                      required
                      placeholder="e.g. 1"
                    />
                    <Select
                      label="Gender (लिंग)"
                      name="gender"
                      value={values.gender}
                      onChange={handleChange}
                      error={errors.gender}
                      required
                      options={GENDER_OPTIONS}
                      placeholder="Select gender"
                    />
                  </div>

                  {/* DOB, In Words, Age on July 1 (Balanced 3-col) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                      label="Date of Birth (जन्म दिनांक)"
                      type="date"
                      name="dob"
                      value={values.dob}
                      onChange={handleChange}
                      error={errors.dob}
                      required
                    />
                    <Input
                      label="DOB in Words (जन्म दिनांक शब्दों में)"
                      name="dobInWords"
                      value={values.dobInWords}
                      onChange={handleChange}
                      placeholder="e.g. Fifteen August Two Thousand Fifteen"
                      helper="Auto-filled in words"
                    />
                    <Input
                      label="Age as on 1st July (1 जुलाई को आयु)"
                      name="ageAsOnJuly1"
                      value={values.ageAsOnJuly1}
                      onChange={handleChange}
                      placeholder="e.g. 8 Years, 4 Months, 12 Days"
                      helper="Auto-calculated"
                    />
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SECTION 2: PARENTS & PERMANENT ADDRESS                           */}
              {/* ================================================================= */}
              {(viewMode === 'all' || activeTab === 'parents') && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                        2
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                          Parents & Permanent Address (पालक विवरण व स्थाई पता)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Parent names in Hindi/English, occupation, income & residential address
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Father's Info */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Father's Name (English)"
                      name="fatherName"
                      value={values.fatherName}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Sharma"
                    />
                    <Input
                      label="पिता का नाम (हिन्दी में)"
                      name="fatherNameHindi"
                      value={values.fatherNameHindi}
                      onChange={handleChange}
                      placeholder="उदा. राजेश शर्मा"
                    />
                  </div>

                  {/* Mother's Info */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Mother's Name (English)"
                      name="motherName"
                      value={values.motherName}
                      onChange={handleChange}
                      placeholder="e.g. Sunita Sharma"
                    />
                    <Input
                      label="माता का नाम (हिन्दी में)"
                      name="motherNameHindi"
                      value={values.motherNameHindi}
                      onChange={handleChange}
                      placeholder="उदा. सुनीता शर्मा"
                    />
                  </div>

                  {/* Occupation & Income */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Father's / Family Occupation (व्यवसाय)"
                      name="occupation"
                      value={values.occupation}
                      onChange={handleChange}
                      placeholder="e.g. Business / Service / Agriculture"
                    />
                    <Input
                      label="Annual / Monthly Income (आय ₹)"
                      name="annualIncome"
                      value={values.annualIncome}
                      onChange={handleChange}
                      placeholder="e.g. 2,50,000"
                    />
                  </div>

                  {/* Address Rows */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                      label="House No. (H.No. / मकान नं.)"
                      name="houseNo"
                      value={values.houseNo}
                      onChange={handleChange}
                      placeholder="e.g. 1093"
                    />
                    <Input
                      label="Apartment / Sector / Street"
                      name="apartmentSectorStreet"
                      value={values.apartmentSectorStreet}
                      onChange={handleChange}
                      placeholder="e.g. Rajeev Awas Vihar, Sch. 114"
                    />
                    <Input
                      label="Colony / Area (कॉलोनी)"
                      name="colony"
                      value={values.colony}
                      onChange={handleChange}
                      placeholder="e.g. Vijay Nagar"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      label="District (जिला)"
                      name="district"
                      value={values.district}
                      onChange={handleChange}
                      placeholder="e.g. Indore"
                    />
                    <Input
                      label="State (राज्य)"
                      name="state"
                      value={values.state}
                      onChange={handleChange}
                      placeholder="e.g. Madhya Pradesh"
                    />
                    <Input
                      label="Mobile Number (फोन / मोबाइल)"
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={values.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                      placeholder="9826000001"
                      helper="10 digits without +91"
                    />
                    <Input
                      label="Email Address (ईमेल)"
                      type="email"
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      error={errors.email}
                      placeholder="student@example.com"
                    />
                  </div>

                  <div>
                    <Input
                      label="Full Residential Address (पूर्ण पता)"
                      name="address"
                      value={values.address}
                      onChange={handleChange}
                      placeholder="Complete postal address for official correspondence and bus route mapping"
                    />
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SECTION 3: DEMOGRAPHICS, PREVIOUS SCHOOL & GOVT IDS              */}
              {/* ================================================================= */}
              {(viewMode === 'all' || activeTab === 'gov') && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-white text-xs font-bold shadow-xs">
                        3
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                          Demographics, Previous School & Government IDs (सामाजिक व समग्र)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Samagra SSSM ID, Family ID, Bank account, Religion, Caste & previous school
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Demographics: Mother tongue, religion, caste, category */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      label="Mother Tongue (मातृभाषा)"
                      name="motherTongue"
                      value={values.motherTongue}
                      onChange={handleChange}
                      placeholder="e.g. Hindi"
                    />
                    <Select
                      label="Religion (धर्म)"
                      name="religion"
                      value={values.religion}
                      onChange={handleChange}
                      options={RELIGION_OPTIONS}
                    />
                    <Input
                      label="Caste (जाति)"
                      name="caste"
                      value={values.caste}
                      onChange={handleChange}
                      placeholder="e.g. General, Sharma, etc."
                    />
                    <Select
                      label="Category (वर्ग / संवर्ग)"
                      name="category"
                      value={values.category}
                      onChange={handleChange}
                      options={CATEGORY_OPTIONS}
                    />
                  </div>

                  {/* Previous School & DISE Code */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Name of school previously attended (पूर्व विद्यालय)"
                      name="previousSchool"
                      value={values.previousSchool}
                      onChange={handleChange}
                      placeholder="e.g. St. Paul School, Indore"
                    />
                    <Input
                      label="पिछले विद्यालय का डायस कोड (DISE Code)"
                      name="previousSchoolDiseCode"
                      value={values.previousSchoolDiseCode}
                      onChange={handleChange}
                      placeholder="e.g. 23260103731"
                    />
                  </div>

                  {/* SSSM ID, Family ID, Bank A/C, IFSC */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      label="SSSM I.D. (समग्र आईडी - 9 अंक)"
                      name="sssmId"
                      value={values.sssmId}
                      onChange={handleChange}
                      placeholder="e.g. 192837465"
                      maxLength={9}
                      helper="Student 9-digit Samagra ID"
                    />
                    <Input
                      label="Family ID (परिवार आईडी - 8 अंक)"
                      name="familyId"
                      value={values.familyId}
                      onChange={handleChange}
                      placeholder="e.g. 84736251"
                      maxLength={8}
                      helper="Family 8-digit Samagra ID"
                    />
                    <Input
                      label="A/C NO. (बैंक खाता क्रमांक)"
                      name="bankAccountNo"
                      value={values.bankAccountNo}
                      onChange={handleChange}
                      placeholder="e.g. 302910485721"
                    />
                    <Input
                      label="IFSC Code (आई.एफ.एस.सी. कोड)"
                      name="ifscCode"
                      value={values.ifscCode}
                      onChange={handleChange}
                      placeholder="e.g. SBIN0001234"
                    />
                  </div>

                  <div>
                    <Input
                      label="संलग्न दस्तावेज (Enclosures: e.g. 1. Samagra ID, 2. Birth Certificate, 3. TC)"
                      name="enclosures"
                      value={values.enclosures}
                      onChange={handleChange}
                      placeholder="e.g. 1. Samagra ID  2. Birth Certificate  3. TC  4. Marksheet"
                    />
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SECTION 4: OFFICE USE, VERIFICATION & PORTAL                     */}
              {/* ================================================================= */}
              {(viewMode === 'all' || activeTab === 'office') && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs">
                        4
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                          Office Use & Portal Account (कार्यालयीन उपयोग व पोर्टल)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Document verification checklist, entrance test, fee schedule & portal login
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status, Bus, Due Date */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Select
                      label="Admission Status (प्रवेश स्थिति)"
                      name="admissionGranted"
                      value={values.admissionGranted}
                      onChange={handleChange}
                      options={ADMISSION_STATUS_OPTIONS}
                    />
                    <Input
                      label="Bus Number (बस क्रमांक - If applicable)"
                      name="busNumber"
                      value={values.busNumber}
                      onChange={handleChange}
                      placeholder="e.g. Bus 4 / Route 12"
                    />
                    <Input
                      label="Fee Deposit Due Date (शुल्क जमा तिथि)"
                      type="date"
                      name="feeDepositDate"
                      value={values.feeDepositDate}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Entrance Test Records */}
                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={16} className="text-slate-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Entrance Test & Interview Records (प्रवेश परीक्षा व साक्षात्कार)
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Input
                        label="Test Date"
                        type="date"
                        name="testDate"
                        value={values.testDate}
                        onChange={handleChange}
                      />
                      <Input
                        label="Test Time"
                        type="time"
                        name="testTime"
                        value={values.testTime}
                        onChange={handleChange}
                      />
                      <Input
                        label="Conducted By (परीक्षक)"
                        name="testConductedBy"
                        value={values.testConductedBy}
                        onChange={handleChange}
                        placeholder="Examiner name"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label="Remarks - Test (Subject Wise)"
                        name="testRemarks"
                        value={values.testRemarks}
                        onChange={handleChange}
                        placeholder="e.g. Math: Good, English: Excellent"
                      />
                      <Input
                        label="Interview - Parent / Guardian"
                        name="interviewRemarks"
                        value={values.interviewRemarks}
                        onChange={handleChange}
                        placeholder="e.g. Parents verified records"
                      />
                    </div>
                  </div>

                  {/* Document Checklist */}
                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Document Verification Checklist (दस्तावेज सत्यापन)
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {verifiedDocsCount} / 4 Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Select
                        label="Birth Certificate"
                        name="docBirthCertificate"
                        value={values.docBirthCertificate}
                        onChange={handleChange}
                        options={DOC_STATUS_OPTIONS}
                      />
                      <Select
                        label="Transfer Certificate (TC)"
                        name="docTransferCertificate"
                        value={values.docTransferCertificate}
                        onChange={handleChange}
                        options={DOC_STATUS_OPTIONS}
                      />
                      <Select
                        label="Caste Certificate"
                        name="docCasteCertificate"
                        value={values.docCasteCertificate}
                        onChange={handleChange}
                        options={CASTE_DOC_OPTIONS}
                      />
                      <Select
                        label="Copy of Marksheet"
                        name="docMarksheet"
                        value={values.docMarksheet}
                        onChange={handleChange}
                        options={DOC_STATUS_OPTIONS}
                      />
                    </div>

                    <div>
                      <Input
                        label="Last Date for Pending Documents (दस्तावेज जमा करने की अंतिम तिथि)"
                        type="date"
                        name="docPendingLastDate"
                        value={values.docPendingLastDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Office Instructions */}
                  <div>
                    <Input
                      label="Office Instruction / Remarks (कार्यालयीन निर्देश यदि कोई हो)"
                      name="officeInstructions"
                      value={values.officeInstructions}
                      onChange={handleChange}
                      placeholder="Administrative instructions, special notes, concessions"
                    />
                  </div>

                  {/* Student Portal Account Configuration */}
                  <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/20 p-5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-indigo-100">
                      <div>
                        <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                          <KeyRound size={16} className="text-indigo-600" /> Student Portal Login Credentials
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Create an instant student portal login for marks, timetable, attendance and fee payments.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs hover:bg-indigo-50/50 transition">
                        <input
                          type="checkbox"
                          name="createLoginAccount"
                          checked={values.createLoginAccount}
                          onChange={(e) => setValues((prev) => ({ ...prev, createLoginAccount: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Create Login Account
                      </label>
                    </div>

                    {values.createLoginAccount && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                        <Input
                          label="Username / Login ID"
                          name="username"
                          value={values.username}
                          onChange={handleChange}
                          placeholder="Leave blank for auto Student ID"
                          helper="Defaults to assigned Student ID"
                        />
                        <div className="relative">
                          <Input
                            label="Temporary Password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                            placeholder="student123"
                            className="pr-10"
                            helper="Student will change on first login"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-[38px] right-3 text-slate-400 hover:text-slate-600"
                            aria-label="Toggle password"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="flex items-end pb-5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={Sparkles}
                            onClick={() => {
                              const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
                              let generated = ''
                              for (let i = 0; i < 9; i++) {
                                generated += chars.charAt(Math.floor(Math.random() * chars.length))
                              }
                              setValues((prev) => ({ ...prev, password: generated }))
                            }}
                            className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 bg-white"
                          >
                            Generate Password
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  {viewMode === 'tabs' && currentTabIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={ChevronLeft}
                      onClick={handlePrevTab}
                      className="w-full sm:w-auto"
                    >
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {viewMode === 'tabs' && currentTabIndex < TABS.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      rightIcon={ChevronRight}
                      onClick={handleNextTab}
                      className="w-full sm:w-auto px-7 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100"
                    >
                      Next Step ({TABS[currentTabIndex + 1].short})
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      loading={submitting}
                      className="w-full sm:w-auto px-7 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 text-sm font-bold text-white"
                    >
                      {submitLabel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: STICKY LIVE ADMISSION SHEET & ID PREVIEW CARD (4 COLS)      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            
            {/* Live Student Identity & Admission Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm overflow-hidden relative">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500" />
              
              <div className="flex items-center justify-between pt-1 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <School size={15} className="text-indigo-600" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                    Live Admission Sheet
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 size={11} /> {values.admissionGranted === 'GRANTED' ? 'Granted' : 'Pending'}
                </span>
              </div>

              {/* Student Header Snapshot */}
              <div className="mt-4 flex items-center gap-3.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                {values.photo ? (
                  <img
                    src={values.photo}
                    alt="Student"
                    className="h-16 w-16 rounded-xl border-2 border-indigo-300 object-cover shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg shrink-0">
                    {values.fullName ? values.fullName.trim().charAt(0).toUpperCase() : <User size={24} />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {values.fullName || 'Student Name'}
                  </p>
                  {values.nameInHindi && (
                    <p className="text-xs text-slate-500 font-sans truncate">
                      {values.nameInHindi}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      {values.className ? `Class ${values.className}` : 'No Class'} {values.section ? `- ${values.section}` : ''}
                    </span>
                    <span className="inline-block rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      {values.medium === 'HINDI' ? 'हिन्दी' : 'ENG'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Details Table */}
              <div className="mt-4 space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Scholar No:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {values.scholarNo || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Form No:</span>
                  <span className="font-bold text-slate-800">
                    {values.formNo || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Roll Number:</span>
                  <span className="font-bold text-slate-800">
                    {values.rollNumber || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Date of Birth:</span>
                  <span className="font-medium text-slate-800">
                    {values.dob ? values.dob.split('-').reverse().join('/') : '—'}
                  </span>
                </div>
                {values.ageAsOnJuly1 && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Age on July 1:</span>
                    <span className="font-medium text-slate-800 text-[11px] text-right">
                      {values.ageAsOnJuly1}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Father:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                    {values.fatherName || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Mobile:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {values.phone || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">SSSM ID:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {values.sssmId || '—'}
                  </span>
                </div>
              </div>

              {/* Document Checklist Progress */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" /> Documents Status
                  </span>
                  <span className="text-emerald-600">{verifiedDocsCount} of 4</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <div
                    title="Birth Certificate"
                    className={`h-1.5 rounded-full ${values.docBirthCertificate === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  />
                  <div
                    title="Transfer Certificate"
                    className={`h-1.5 rounded-full ${values.docTransferCertificate === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  />
                  <div
                    title="Caste Certificate"
                    className={`h-1.5 rounded-full ${values.docCasteCertificate === 'SUBMITTED' || values.docCasteCertificate === 'NA' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  />
                  <div
                    title="Marksheet"
                    className={`h-1.5 rounded-full ${values.docMarksheet === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  />
                </div>
              </div>

              {/* Quick Print Preview Action */}
              <div className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={Printer}
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-full text-xs font-bold text-emerald-700 bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/70"
                >
                  Preview Official Print Form (प्रवेश फार्म)
                </Button>
              </div>
            </div>

            {/* Quick Helper Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <HelpCircle size={15} className="text-indigo-600 shrink-0" />
                <span>Form Submission Tips</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] leading-relaxed">
                <li>Form No. corresponds with the paper admission registry number.</li>
                <li>SSSM ID (9 digits) is required for state government portal syncing.</li>
                <li>Age as on 1st July is auto-calculated per MP education board rules.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>

      {/* Official Admission Form Print Preview Modal */}
      {previewModalOpen && (
        <AdmissionFormModal
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          student={values}
        />
      )}
    </div>
  )
}

export default StudentForm
