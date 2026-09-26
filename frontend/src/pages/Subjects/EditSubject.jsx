import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SubjectForm from '../../components/subjects/SubjectForm'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function EditSubject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    api
      .getSubject(id)
      .then((data) => {
        if (mounted) {
          setItem(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          showToast(err.message || 'Subject not found', 'error')
          navigate('/subjects')
        }
      })
    return () => {
      mounted = false
    }
  }, [id, navigate, showToast])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      await api.updateSubject(id, values)
      showToast('Subject updated successfully', 'success')
      navigate('/subjects')
    } catch (err) {
      showToast(err.message || 'Failed to update subject', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader fullScreen label="Loading subject..." />

  return (
    <div>
      <PageHeader
        title={`Edit ${item.name}`}
        description="Update the subject details and teacher assignment"
        breadcrumb={[
          { label: 'Subjects', href: '/subjects' },
          { label: item.name },
          { label: 'Edit' },
        ]}
        actions={
          <Link to="/subjects">
            <Button variant="outline" leftIcon={ArrowLeft}>Back</Button>
          </Link>
        }
      />
      <SubjectForm
        initialValues={item}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Update Subject"
      />
    </div>
  )
}

export default EditSubject