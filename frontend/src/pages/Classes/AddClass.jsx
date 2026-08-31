import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import ClassForm from '../../components/classes/ClassForm'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function AddClass() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      await api.addClass(values)
      showToast('Class added successfully', 'success')
      navigate('/classes')
    } catch (err) {
      showToast(err.message || 'Failed to add class', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Class"
        description="Create a new class with its section and teacher"
        breadcrumb={[
          { label: 'Classes', href: '/classes' },
          { label: 'Add Class' },
        ]}
        actions={
          <Link to="/classes">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Classes</Button>
          </Link>
        }
      />
      <ClassForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Add Class" />
    </div>
  )
}

export default AddClass
