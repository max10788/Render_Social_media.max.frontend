const AboutPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">About</h1>
      <p className="text-lg text-gray-700">
        This is a modern React application built with TypeScript, Tailwind CSS,
        and Zustand for state management. It communicates with a Python backend
        API and demonstrates best practices for production-ready applications.
      </p>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>React with TypeScript</li>
          <li>Vite for build tooling</li>
          <li>Tailwind CSS for styling</li>
          <li>React Router for navigation</li>
          <li>Zustand for state management</li>
          <li>Axios for API communication</li>
        </ul>
      </div>
    </div>
  )
}

export default AboutPage
