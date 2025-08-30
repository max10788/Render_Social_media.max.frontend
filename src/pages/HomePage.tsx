
import { useEffect, useState } from 'react'
import { getData } from '../services/api'
import { useCounterStore } from '../store/counterStore'

const HomePage = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { count, increment, decrement } = useCounterStore()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await getData('/api/example')
        setData(result)
      } catch (err) {
        setError('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Welcome to Social Media App</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Counter Example</h2>
        <div className="flex items-center space-x-4">
          <button onClick={decrement} className="btn btn-primary">-</button>
          <span className="text-lg">{count}</span>
          <button onClick={increment} className="btn btn-primary">+</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">API Data</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </div>
  )
}

export default HomePage
