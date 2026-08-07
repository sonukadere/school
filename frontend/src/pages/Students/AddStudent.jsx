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
    await api.addStudent(values)
    setSubmitting(false)
    showToast('Student added successfully', 'success')
    navigate('/students')
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
