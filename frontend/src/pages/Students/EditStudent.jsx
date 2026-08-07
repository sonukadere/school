import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StudentForm from '../../components/students/StudentForm'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function EditStudent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getStudent(id).then((data) => {
      if (mounted) {
        setStudent(data)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        showToast('Student not found', 'error')
        navigate('/students')
      }
    })
    return () => {
      mounted = false
    }
  }, [id, navigate, showToast])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    await api.updateStudent(id, values)
    setSubmitting(false)
    showToast('Student updated successfully', 'success')
    navigate(`/students/${id}`)
  }

  if (loading) return <Loader fullScreen label="Loading student..." />

  return (
    <div>
      <PageHeader
        title={`Edit ${student.fullName}`}
        description="Update the student record"
        breadcrumb={[
          { label: 'Students', href: '/students' },
          { label: student.fullName, href: `/students/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link to={`/students/${id}`}>
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back
            </Button>
          </Link>
        }
      />
      <StudentForm initialValues={student} onSubmit={handleSubmit} submitting={submitting} submitLabel="Update Student" />
    </div>
  )
}

export default EditStudent
