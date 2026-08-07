import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { CLASS_OPTIONS } from '../../utils/constants'

function SubjectForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Save Subject', onBack }) {
  const [values, setValues] = useState({
    name: '',
    code: '',
    className: '',
    assignedTeacher: '',
    ...initialValues,
  })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    ;['name', 'code', 'className', 'assignedTeacher'].forEach((field) => {
      if (!values[field]) nextErrors[field] = 'This field is required'
    })
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Subject Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Subject Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required placeholder="e.g. Mathematics" />
          <Input label="Subject Code" name="code" value={values.code} onChange={handleChange} error={errors.code} required placeholder="e.g. MAT-101" />
          <Select label="Class" name="className" value={values.className} onChange={handleChange} error={errors.className} required options={CLASS_OPTIONS} placeholder="Select class" />
          <Input label="Assigned Teacher" name="assignedTeacher" value={values.assignedTeacher} onChange={handleChange} error={errors.assignedTeacher} required placeholder="Enter teacher name" />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack || (() => window.history.back())}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default SubjectForm
