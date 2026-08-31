import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StudentForm from '../../components/students/StudentForm'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function AddStudent() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const created = await api.addStudent(values)
      setSubmitting(false)
      const studentNo = created?.studentId ? ` (${created.studentId})` : ''
      showToast(`Student added successfully! Student No: ${created?.studentId || 'Generated'}`, 'success')
      navigate('/students')
    } catch (err) {
      setSubmitting(false)
      showToast(err.message || 'Failed to add student', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Student"
        description="Register a new student in the school"
        breadcrumb={[
          { label: 'Students', href: '/students' },
          { label: 'Add Student' },
        ]}
        actions={
          <Link to="/students">
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back to Students
            </Button>
          </Link>
        }
      />
      <StudentForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Add Student" />
    </div>
  )
}

export default AddStudent
