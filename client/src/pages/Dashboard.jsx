import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_API_URL

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, totalSavings: 0 })
  const [savings, setSavings] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token')
        // FIX #7: redirect instead of rendering broken empty dashboard
        if (!token) {
          navigate('/signin')
          return
        }

        const summaryResponse = await axios.get(`${apiUrl}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const savingsResponse = await axios.get(`${apiUrl}/savings`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setSummary(summaryResponse.data)
        setSavings(savingsResponse.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error.message)
        if (error.response?.status === 401) {
          navigate('/signin')
        }
      }
    }

    fetchDashboardData()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-black p-4 sm:p-6 text-left text-white overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-4xl font-extrabold text-blue-500 tracking-wide animate-fadeIn">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
          {[
            { label: 'Total Income', value: summary.totalIncome },
            { label: 'Total Expenses', value: summary.totalExpense },
            { label: 'Total Savings', value: summary.totalSavings },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="p-8 border border-blue-600 bg-gray-900 rounded-xl shadow-lg transform transition-transform hover:scale-105 hover:shadow-blue-500/70 animate-slideUp"
              style={{ animationDelay: '0.2s' }}
            >
              <h2 className="text-xl font-semibold text-blue-300 mb-2">{label}</h2>
              <p className="text-3xl font-bold text-blue-500">${value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-3xl font-semibold text-blue-400 mb-6 animate-fadeInUp">
            Savings Goals
          </h2>
          {savings.length === 0 ? (
            <p className="text-gray-400 italic">No savings goals yet.</p>
          ) : (
            <ul className="space-y-6">
              {savings.map((goal, i) => {
                const progress = Math.min(100, (goal.saved_amount / goal.target_amount) * 100)

                return (
                  <li
                    key={goal.id}
                    className="p-6 border border-blue-500 rounded-xl shadow-md bg-gray-800 transition-shadow hover:shadow-blue-600 transform hover:scale-[1.02] animate-fadeInUp"
                    style={{ animationDelay: `${0.1 * i}s` }}
                  >
                    <h3 className="text-xl font-semibold text-blue-400">{goal.title}</h3>
                    <p className="mb-3 text-gray-300">
                      Saved: <span className="font-medium">${goal.saved_amount.toLocaleString()}</span> /{' '}
                      <span className="font-medium">${goal.target_amount.toLocaleString()}</span>
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-5 overflow-hidden shadow-inner">
                      <div
                        className="bg-blue-500 h-5 rounded-full transition-all duration-700 ease-in-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.9s ease forwards;
        }
      `}</style>
    </div>
  )
}

export default Dashboard
