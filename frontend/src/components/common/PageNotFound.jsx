import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from './Button'

function PageNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-100">
        <Compass size={44} className="text-indigo-600" />
      </div>
      <h1 className="mt-6 text-6xl font-bold tracking-tight text-slate-900">404</h1>
      <p className="mt-2 text-lg font-semibold text-slate-700">Page not found</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for might have been removed, renamed, or is temporarily
        unavailable.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="primary">Back to Dashboard</Button>
      </Link>
    </div>
  )
}

export default PageNotFound
