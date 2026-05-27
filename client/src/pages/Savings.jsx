import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_API_URL

const Savings = () => {
  const [savings, setSavings] = useState([])
  const [totalSavings, setTotalSavings] = useState(0)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [addAmounts, setAddAmounts] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const token = localStorage.getItem('token')
        // FIX #7: redirect instead of rendering broken empty page
        if (!token) {
          navigate('/signin')
          return
        }

        const response = await axios.get(`${apiUrl}/savings`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setSavings(response.data)
      } catch (error) {
        console.error('Error fetching savings:', error.message)
        if (error.response?.status === 401) {
          navigate('/signin')
        }
      }
    }

    fetchSavings()
  }, [navigate])

  useEffect(() => {
    const total = savings.reduce((sum, entry) => sum + entry.saved_amount, 0)
    setTotalSavings(total)
  }, [savings])

  const handleAddToSavings = async (goalId) => {
    try {
      const amountToAdd = parseFloat(addAmounts[goalId])
      if (isNaN(amountToAdd) || amountToAdd <= 0) {
        alert('Please enter a valid positive number.')
        return
      }

      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token found')

      const response = await axios.put(
        `${apiUrl}/savings/${goalId}`,
        { amount: amountToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSavings(savings.map((goal) => (goal.id === goalId ? response.data : goal)))
      setAddAmounts((prev) => ({ ...prev, [goalId]: '' }))
      alert('Savings updated successfully!')
    } catch (error) {
      console.error('Error updating savings goal:', error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-blue-500">Your Savings</h1>

        <h2 className="text-xl font-semibold text-blue-400">Total Saved: ${totalSavings}</h2>

        {savings.length === 0 ? (
          <p className="text-blue-300 italic text-center">No savings goals found.</p>
        ) : (
          <ul className="space-y-4">
            {savings.map((goal) => (
              <li
                key={goal.id}
                className="p-4 border border-blue-500 rounded-lg shadow hover:shadow-blue-500 transition"
              >
                <h3 className="text-2xl font-semibold text-blue-500">{goal.title}</h3>
                <p className="mb-2 text-gray-300">
                  Saved: ${goal.saved_amount} / ${goal.target_amount}
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Add amount"
                    value={addAmounts[goal.id] || ''}
                    onChange={(e) =>
                      setAddAmounts((prev) => ({ ...prev, [goal.id]: e.target.value }))
                    }
                    className="p-2 border border-blue-500 rounded w-32 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                  <button
                    onClick={() => handleAddToSavings(goal.id)}
                    className="bg-blue-500 text-black px-3 py-1 rounded hover:bg-blue-600 transition"
                  >
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              const token = localStorage.getItem('token')
              if (!token) throw new Error('No token found')

              const response = await axios.post(
                `${apiUrl}/savings`,
                {
                  title,
                  target_amount: parseFloat(targetAmount)
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              )

              setSavings((prev) => [...prev, response.data])
              setTitle('')
              setTargetAmount('')
            } catch (error) {
              console.error('Error adding savings goal:', error.message)
            }
          }}
          className="p-6 border border-blue-500 rounded-lg space-y-4 bg-gray-900"
        >
          <h3 className="text-2xl font-semibold text-blue-500">Add New Savings Goal</h3>

          <div>
            <label className="block mb-1 font-medium text-gray-300">Savings Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-blue-500 rounded bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-300">Target Amount</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full p-2 border border-blue-500 rounded bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-black px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Add Savings Goal
          </button>
        </form>
      </div>
    </div>
  )
}

export default Savings
