import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DollarSign, Briefcase, CreditCard } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SalaryStructureTab from '../Fees/SalaryStructureTab'
import PayrollTab from '../Fees/PayrollTab'
import { cn } from '../../utils/helpers'

export default function PayrollPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'structures' ? 'structures' : 'payroll')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && (tab === 'structures' || tab === 'payroll') && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teacher Salary & Payroll Management"
        description="Manage teacher salary structures, allowances, deductions, process monthly disbursements, and issue payslips"
        breadcrumb={[{ label: 'Teacher Salary & Payroll' }]}
      />

      {/* Segmented Control / Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange('payroll')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <DollarSign size={18} />
          <span>Monthly Payroll & Disbursements</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('structures')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
            activeTab === 'structures'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Briefcase size={18} />
          <span>Teacher Salary Structures</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'payroll' && <PayrollTab />}
      {activeTab === 'structures' && <SalaryStructureTab />}
    </div>
  )
}
