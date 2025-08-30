import { Link } from 'react-router-dom'

const Navigation = () => {
  return (
    <nav className="bg-white shadow">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            Social Media App
          </Link>
          <div className="space-x-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/about" className="hover:text-primary">About</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
