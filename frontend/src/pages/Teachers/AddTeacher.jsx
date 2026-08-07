import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import TeacherForm from '../../components/teachers/TeacherForm'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function AddTeacher() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    await api.addTeacher(values)
    setSubmitting(false)
    showToast('Teacher added successfully', 'success')
    navigate('/teachers')
  }

  return (
    <div>
      <PageHeader
        title="Add Teacher"
        description="Hire a new teacher and create their profile"
        breadcrumb={[
          { label: 'Teachers', href: '/teachers' },
          { label: 'Add Teacher' },
        ]}
        actions={
          <Link to="/teachers">
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back to Teachers
            </Button>
          </Link>
        }
      />
      <TeacherForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Add Teacher" />
    </div>
  )
}

export default AddTeacher
