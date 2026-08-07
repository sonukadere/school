import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../utils/constants'

function ClassForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Save Class', onBack }) {
  const [values, setValues] = useState({
    name: '',
    section: '',
    classTeacher: '',
    roomNumber: '',
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
    ;['name', 'section', 'classTeacher', 'roomNumber'].forEach((field) => {
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
          Class Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Class Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required options={CLASS_OPTIONS} placeholder="Select class" />
          <Select label="Section" name="section" value={values.section} onChange={handleChange} error={errors.section} required options={SECTION_OPTIONS} placeholder="Select section" />
          <Input label="Class Teacher" name="classTeacher" value={values.classTeacher} onChange={handleChange} error={errors.classTeacher} required placeholder="Enter class teacher name" />
          <Input label="Room Number" name="roomNumber" value={values.roomNumber} onChange={handleChange} error={errors.roomNumber} required placeholder="e.g. 201" />
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

export default ClassForm
