import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SubjectForm from '../../components/subjects/SubjectForm'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function AddSubject() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    await api.addSubject(values)
    setSubmitting(false)
    showToast('Subject added successfully', 'success')
    navigate('/subjects')
  }

  return (
    <div>
      <PageHeader
        title="Add Subject"
        description="Add a new subject and assign a teacher"
        breadcrumb={[
          { label: 'Subjects', href: '/subjects' },
          { label: 'Add Subject' },
        ]}
        actions={
          <Link to="/subjects">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Subjects</Button>
          </Link>
        }
      />
      <SubjectForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Add Subject" />
    </div>
  )
}

export default AddSubject
