import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  CalendarCheck2,
  Users2,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Shield,
  UserCheck,
  BookOpenCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAppConfig } from '../../context/AppConfigContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'

const translations = {
  en: {
    tagline: 'School Management System',
    heroLine1: 'Empowering',
    heroLine2: 'Education for a',
    heroLine3: 'Brighter Tomorrow',
    heroDesc:
      'A complete school management system to simplify administration, enhance learning, and build a better future.',
    f1Title: 'Manage Students',
    f1Sub: 'Admissions & academics',
    f2Title: 'Simplify Admin',
    f2Sub: 'All tools in one place',
    f3Title: 'Track Attendance',
    f3Sub: 'Real-time updates',
    f4Title: 'Secure & Reliable',
    f4Sub: 'Safe encrypted data',
    quote: 'Education is the key to unlocking a brighter future.',
    schoolBanner1: 'Better Students',
    schoolBanner2: 'Brighter Futures',
    welcomeBack: 'Welcome Back',
    loginSubtitle: 'Login to your school account',
    emailLabel: 'Email / Username',
    emailPlaceholder: 'Enter your email or username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    or: 'OR',
    demoHint: 'Select a demo account to autofill:',
    roleSuperAdmin: 'Super Admin',
    roleAdmin: 'Admin',
    roleTeacher: 'Teacher',
    roleStudent: 'Student',
    needHelp: 'Need help?',
    contactAdmin: 'Contact School Admin',
    footerMotto: 'Learn • Grow • Achieve',
    allRightsReserved: 'All rights reserved.',
    emailRequired: 'Email or Username is required',
    passwordRequired: 'Password is required',
    loggedIn: 'Logged in successfully',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    language: 'Language',
    english: 'English',
    hindi: 'हिंदी',
  },
  hi: {
    tagline: 'स्कूल प्रबंधन प्रणाली',
    heroLine1: 'शिक्षा को',
    heroLine2: 'सशक्त बनाना,',
    heroLine3: 'उज्जवल भविष्य की ओर',
    heroDesc:
      'प्रशासन को सरल बनाने, अधिगम को बेहतर बनाने और बेहतर भविष्य बनाने के लिए एक संपूर्ण स्कूल प्रबंधन प्रणाली।',
    f1Title: 'छात्र प्रबंधन',
    f1Sub: 'प्रवेश और शैक्षणिक',
    f2Title: 'आसान प्रशासन',
    f2Sub: 'सभी उपकरण एक जगह',
    f3Title: 'उपस्थिति ट्रैकिंग',
    f3Sub: 'रीयल-टाइम अपडेट',
    f4Title: 'सुरक्षित और भरोसेमंद',
    f4Sub: 'सुरक्षित एन्क्रिप्टेड डेटा',
    quote: 'शिक्षा उज्जवल भविष्य के द्वार खोलने की कुंजी है।',
    schoolBanner1: 'बेहतर छात्र',
    schoolBanner2: 'उज्जवल भविष्य',
    welcomeBack: 'वापसी पर स्वागत है',
    loginSubtitle: 'अपने स्कूल खाते में लॉगिन करें',
    emailLabel: 'ईमेल / उपयोगकर्ता नाम',
    emailPlaceholder: 'अपना ईमेल या उपयोगकर्ता नाम दर्ज करें',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    rememberMe: 'मुझे याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    signIn: 'साइन इन करें',
    signingIn: 'साइन इन हो रहा है...',
    or: 'या',
    demoHint: 'ऑटोफिल के लिए डेमो खाता चुनें:',
    roleSuperAdmin: 'सुपर एडमिन',
    roleAdmin: 'एडमिन',
    roleTeacher: 'शिक्षक',
    roleStudent: 'छात्र',
    needHelp: 'सहायता चाहिए?',
    contactAdmin: 'स्कूल एडमिन से संपर्क करें',
    footerMotto: 'सीखें • बढ़ें • सफल हों',
    allRightsReserved: 'सर्वाधिकार सुरक्षित।',
    emailRequired: 'ईमेल या उपयोगकर्ता नाम आवश्यक है',
    passwordRequired: 'पासवर्ड आवश्यक है',
    loggedIn: 'सफलतापूर्वक लॉगिन हुआ',
    themeDark: 'डार्क मोड',
    themeLight: 'लाइट मोड',
    showPassword: 'पासवर्ड दिखाएं',
    hidePassword: 'पासवर्ड छुपाएं',
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी',
  },
}

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const { isDark, toggleTheme, language, setLanguage } = useAppConfig()
  const { settings } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const t = (key) => translations[language][key] ?? translations.en[key] ?? key

  const schoolName = settings?.schoolName || 'EduSchool'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] = useState(null)
  const [langOpen, setLangOpen] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const nextErrors = {}
    if (!email.trim()) nextErrors.email = t('emailRequired')
    if (!password) nextErrors.password = t('passwordRequired')
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)

    if (result.ok) {
      showToast(t('loggedIn'), 'success')
      navigate('/dashboard')
    } else {
      showToast(result.error, 'error')
      setErrors({ form: result.error })
    }
  }

  const handleSelectDemo = (role, demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setSelectedDemoRole(role)
    setErrors({})
  }

  const selectorBg =
    'bg-white/90 border-slate-200/80 text-slate-700 hover:bg-white dark:bg-slate-800/90 dark:border-slate-700/80 dark:text-slate-200 dark:hover:bg-slate-800'
  const optionBg =
    'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full bg-[#f4f8fd] bg-gradient-to-br from-[#eff5fc] via-[#f4f8fd] to-[#eaf2fb] text-slate-800 dark:bg-[#0b1220] dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#0b1220] dark:text-slate-200 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative ambient background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/30 dark:bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-200/25 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[36rem] h-72 bg-sky-100/50 dark:bg-sky-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-1 sm:pb-2 flex items-center justify-between shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {schoolName}
            </h1>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('tagline')}</p>
          </div>
        </div>

        {/* Top Right Controls: Theme Toggle & Language Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className={`h-8 w-8 rounded-full ${selectorBg} shadow-xs flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-500 hover:text-amber-600'
            }`}
            title={isDark ? t('themeLight') : t('themeDark')}
            aria-label={isDark ? t('themeLight') : t('themeDark')}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${selectorBg} shadow-xs text-xs font-semibold cursor-pointer transition-all`}
              aria-label={t('language')}
            >
              <Globe size={13} className="text-slate-500 dark:text-slate-400" />
              <span>{language === 'hi' ? t('hindi') : t('english')}</span>
              <ChevronDown size={12} className={`text-slate-400 ml-0.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className={`absolute right-0 top-full mt-1.5 w-32 rounded-xl border shadow-lg py-1 z-20 animate-scale-in ${optionBg} border-slate-200/80 dark:border-slate-700/80 text-xs`}>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en')
                      setLangOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 font-semibold cursor-pointer transition ${
                      language === 'en' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-500/10' : ''
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('hi')
                      setLangOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 font-semibold cursor-pointer transition ${
                      language === 'hi' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-500/10' : ''
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (Split Grid) */}
      <main className="relative z-10 flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* Left Column: Hero Narrative, Feature Tiles & Campus Graphic */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4 lg:space-y-5">
            <div className="space-y-1.5 sm:space-y-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {t('heroLine1')} <br />
                {t('heroLine2')} <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {t('heroLine3')}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal line-clamp-2">
                {t('heroDesc')}
              </p>
            </div>

            {/* 2x2 Feature Highlights */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-w-lg">
              {/* Feature 1 */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-2xs hover:bg-white/90 transition dark:bg-slate-800/70 dark:border-slate-700/80 dark:hover:bg-slate-800">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Users2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{t('f1Title')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t('f1Sub')}</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-2xs hover:bg-white/90 transition dark:bg-slate-800/70 dark:border-slate-700/80 dark:hover:bg-slate-800">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <BarChart3 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{t('f2Title')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t('f2Sub')}</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-2xs hover:bg-white/90 transition dark:bg-slate-800/70 dark:border-slate-700/80 dark:hover:bg-slate-800">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center font-bold">
                  <CalendarCheck2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{t('f3Title')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t('f3Sub')}</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-2xs hover:bg-white/90 transition dark:bg-slate-800/70 dark:border-slate-700/80 dark:hover:bg-slate-800">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{t('f4Title')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t('f4Sub')}</p>
                </div>
              </div>
            </div>

            {/* School Campus Illustration Graphic */}
            <div className="relative pt-1 max-w-lg hidden sm:block">
              <svg
                viewBox="0 0 600 240"
                className="w-full max-h-24 lg:max-h-28 object-contain drop-shadow-sm select-none pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e1eefa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#d2e4f7" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f3f7fa" />
                  </linearGradient>
                  <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="lawnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Soft ground hills */}
                <ellipse cx="300" cy="225" rx="340" ry="45" fill="url(#lawnGrad)" />

                {/* Background trees */}
                <circle cx="100" cy="185" r="30" fill="#10b981" opacity="0.85" />
                <circle cx="130" cy="175" r="26" fill="#059669" opacity="0.9" />
                <circle cx="475" cy="180" r="32" fill="#10b981" opacity="0.85" />
                <circle cx="505" cy="188" r="24" fill="#047857" opacity="0.9" />

                {/* Left wing */}
                <rect x="150" y="165" width="105" height="50" rx="3" fill="url(#wallGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
                <polygon points="145,165 202,145 260,165" fill="#f87171" opacity="0.9" />
                <rect x="165" y="175" width="16" height="22" rx="2" fill="#93c5fd" />
                <rect x="195" y="175" width="16" height="22" rx="2" fill="#93c5fd" />
                <rect x="225" y="175" width="16" height="22" rx="2" fill="#93c5fd" />

                {/* Right wing */}
                <rect x="345" y="165" width="105" height="50" rx="3" fill="url(#wallGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
                <polygon points="340,165 397,145 455,165" fill="#f87171" opacity="0.9" />
                <rect x="360" y="175" width="16" height="22" rx="2" fill="#93c5fd" />
                <rect x="390" y="175" width="16" height="22" rx="2" fill="#93c5fd" />
                <rect x="420" y="175" width="16" height="22" rx="2" fill="#93c5fd" />

                {/* Main Center Building */}
                <rect x="235" y="145" width="130" height="70" rx="4" fill="url(#wallGrad)" stroke="#94a3b8" strokeWidth="1.5" />
                <polygon points="230,145 300,118 370,145" fill="url(#roofGrad)" />

                {/* Central Clock Tower */}
                <rect x="278" y="95" width="44" height="42" rx="3" fill="url(#wallGrad)" stroke="#94a3b8" strokeWidth="1.5" />
                <polygon points="274,95 300,75 326,95" fill="url(#roofGrad)" />
                <circle cx="300" cy="116" r="14" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                <line x1="300" y1="116" x2="300" y2="107" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
                <line x1="300" y1="116" x2="307" y2="116" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />

                {/* Center School Banner */}
                <rect x="250" y="152" width="100" height="18" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="300" y="161" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1e40af">
                  {t('schoolBanner1')}
                </text>
                <text x="300" y="167.5" textAnchor="middle" fontSize="5.5" fontWeight="600" fill="#3b82f6">
                  {t('schoolBanner2')}
                </text>

                {/* Center Entrance Double Door */}
                <rect x="286" y="185" width="28" height="30" rx="3" fill="#2563eb" />
                <line x1="300" y1="185" x2="300" y2="215" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="295" cy="201" r="1.5" fill="#ffffff" />
                <circle cx="305" cy="201" r="1.5" fill="#ffffff" />

                {/* Symmetrical Entrance Pillars */}
                <rect x="255" y="174" width="7" height="41" rx="1.5" fill="#e2e8f0" />
                <rect x="338" y="174" width="7" height="41" rx="1.5" fill="#e2e8f0" />

                {/* Foreground pathway winding forward */}
                <path d="M 284 215 Q 260 228 200 240 L 400 240 Q 340 228 316 215 Z" fill="url(#pathGrad)" opacity="0.95" />

                {/* Foreground shrubs */}
                <circle cx="215" cy="218" r="14" fill="#10b981" />
                <circle cx="230" cy="220" r="10" fill="#34d399" />
                <circle cx="370" cy="220" r="10" fill="#34d399" />
                <circle cx="385" cy="218" r="14" fill="#10b981" />
              </svg>

              {/* Quote below campus illustration */}
              <p className="mt-1 text-[11px] italic font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>&ldquo;{t('quote')}&rdquo;</span>
              </p>
            </div>
          </div>

          {/* Right Column: Modern Floating Login Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg shadow-slate-200/60 border border-slate-100 relative dark:bg-slate-900 dark:shadow-none dark:border-slate-800">

              {/* Card Header */}
              <div className="text-center mb-3 sm:mb-4">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t('welcomeBack')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  {t('loginSubtitle')}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3" noValidate>
                {/* Email / Username Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('emailLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className={`w-full pl-9 pr-3.5 py-2 bg-white border dark:bg-slate-800 ${
                        errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-100'
                      } rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs focus:outline-hidden focus:ring-3 transition`}
                      autoComplete="username"
                    />
                  </div>
                  {errors.email && <p className="mt-0.5 text-[11px] text-rose-500">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('passwordLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className={`w-full pl-9 pr-10 py-2 bg-white border dark:bg-slate-800 ${
                        errors.password ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-100'
                      } rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs focus:outline-hidden focus:ring-3 transition`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-0.5 text-[11px] text-rose-500">{errors.password}</p>}
                </div>

                {/* Remember & Forgot password */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                    />
                    <span>{t('rememberMe')}</span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>

                {/* Error Banner if form level failure */}
                {errors.form && (
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
                    {errors.form}
                  </div>
                )}

                {/* Primary Submit Button (Sign In ->) */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {t('signingIn')}
                    </span>
                  ) : (
                    <>
                      <span>{t('signIn')}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-2.5 sm:my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <span className="relative px-2.5 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t('or')}
                </span>
              </div>

              {/* Quick Role Switcher / Demo Role Cards */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center mb-1.5">
                  {t('demoHint')}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {/* Super Admin */}
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('SUPER_ADMIN', 'superadmin@school.com', 'superadmin123')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer text-center group ${
                      selectedDemoRole === 'SUPER_ADMIN'
                        ? 'bg-blue-100/90 border-blue-400 shadow-xs'
                        : 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-100'
                    } ${isDark ? 'dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:border-blue-500/30' : ''}`}
                  >
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition">
                      <Shield size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{t('roleSuperAdmin')}</span>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('ADMIN', 'admin@school.com', 'admin123')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer text-center group ${
                      selectedDemoRole === 'ADMIN'
                        ? 'bg-emerald-100/90 border-emerald-400 shadow-xs'
                        : 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-100'
                    } ${isDark ? 'dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30' : ''}`}
                  >
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition">
                      <UserCheck size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{t('roleAdmin')}</span>
                  </button>

                  {/* Teacher */}
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('TEACHER', 'teacher@school.com', 'teacher123')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer text-center group ${
                      selectedDemoRole === 'TEACHER'
                        ? 'bg-amber-100/90 border-amber-400 shadow-xs'
                        : 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-100'
                    } ${isDark ? 'dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:border-amber-500/30' : ''}`}
                  >
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition">
                      <BookOpenCheck size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{t('roleTeacher')}</span>
                  </button>

                  {/* Student */}
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('STUDENT', 'student@school.com', 'student123')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer text-center group ${
                      selectedDemoRole === 'STUDENT'
                        ? 'bg-purple-100/90 border-purple-400 shadow-xs'
                        : 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-100'
                    } ${isDark ? 'dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:border-purple-500/30' : ''}`}
                  >
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-purple-600 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition">
                      <GraduationCap size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{t('roleStudent')}</span>
                  </button>
                </div>
              </div>

              {/* Card Footer Help Link */}
              <div className="mt-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
                {t('needHelp')}{' '}
                <a
                  href="mailto:admin@school.com"
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                >
                  {t('contactAdmin')}
                </a>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        <p>© {new Date().getFullYear()} {schoolName}. {t('allRightsReserved')}</p>
        <div className="flex items-center gap-3 font-medium">
          <span>{t('footerMotto')}</span>
        </div>
      </footer>
    </div>
  )
}