import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import ClassForm from '../../components/classes/ClassForm'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function EditClass() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getClass(id).then((data) => {
      if (mounted) {
        setItem(data)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        showToast('Class not found', 'error')
        navigate('/classes')
      }
    })
    return () => {
      mounted = false
    }
  }, [id, navigate, showToast])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      await api.updateClass(id, values)
      showToast('Class updated successfully', 'success')
      navigate('/classes')
    } catch (err) {
      showToast(err.message || 'Failed to update class', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader fullScreen label="Loading class..." />

  return (
    <div>
      <PageHeader
        title={`Edit ${item.name} - ${item.section}`}
        description="Update the class details"
        breadcrumb={[
          { label: 'Classes', href: '/classes' },
          { label: `${item.name} - ${item.section}`, href: '/classes' },
          { label: 'Edit' },
        ]}
        actions={
          <Link to="/classes">
            <Button variant="outline" leftIcon={ArrowLeft}>Back</Button>
          </Link>
        }
      />
      <ClassForm initialValues={item} onSubmit={handleSubmit} submitting={submitting} submitLabel="Update Class" />
    </div>
  )
}

export default EditClass
