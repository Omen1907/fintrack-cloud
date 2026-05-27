import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import FilterBar from '../components/FilterBar'

const apiUrl = import.meta.env.VITE_API_URL

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [filters, setFilters] = useState({ category: '', type: '' })
  const [showForm, setShowForm] = useState(false)
  const [editTransaction, setEditTransaction] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token')
        // FIX #8: redirect to /signin instead of just logging an error
        if (!token) {
          navigate('/signin')
          return
        }
        const response = await axios.get(`${apiUrl}/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setTransactions(response.data)
      } catch (error) {
        console.error('Error fetching transactions:', error.message)
        // Also redirect on 401 Unauthorized
        if (error.response?.status === 401) {
          navigate('/signin')
        }
      }
    }

    fetchTransactions()
  }, [navigate])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesCategory = filters.category ? transaction.category === filters.category : true
    const matchesType = filters.type ? transaction.type === filters.type : true
    return matchesCategory && matchesType
  })

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <FilterBar filters={filters} setFilters={setFilters} />

        <TransactionList
          transactions={filteredTransactions}
          setTransactions={setTransactions}
          setEditTransaction={setEditTransaction}
          setShowForm={setShowForm}
        />

        <div className="flex justify-center">
          <button
            onClick={() => {
              setEditTransaction(null)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-400"
          >
            Add Transaction
          </button>
        </div>

        {showForm && (
          <div className="mt-8 animate-fadeIn">
            <TransactionForm
              transactions={transactions}
              setTransactions={setTransactions}
              editTransaction={editTransaction}
              setShowForm={setShowForm}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions
