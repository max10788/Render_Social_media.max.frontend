import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

const Layout = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
