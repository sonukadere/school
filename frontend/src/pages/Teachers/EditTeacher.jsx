import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import TeacherForm from '../../components/teachers/TeacherForm'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function EditTeacher() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getTeacher(id).then((data) => {
      if (mounted) {
        setTeacher(data)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        showToast('Teacher not found', 'error')
        navigate('/teachers')
      }
    })
    return () => {
      mounted = false
    }
  }, [id, navigate, showToast])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    await api.updateTeacher(id, values)
    setSubmitting(false)
    showToast('Teacher updated successfully', 'success')
    navigate(`/teachers/${id}`)
  }

  if (loading) return <Loader fullScreen label="Loading teacher..." />

  return (
    <div>
      <PageHeader
        title={`Edit ${teacher.name}`}
        description="Update the teacher's record"
        breadcrumb={[
          { label: 'Teachers', href: '/teachers' },
          { label: teacher.name, href: `/teachers/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link to={`/teachers/${id}`}>
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back
            </Button>
          </Link>
        }
      />
      <TeacherForm initialValues={teacher} onSubmit={handleSubmit} submitting={submitting} submitLabel="Update Teacher" />
    </div>
  )
}

export default EditTeacher
