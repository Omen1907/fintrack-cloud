import React, { useState, useEffect } from 'react'
import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL

// FIX #3: Helper to normalize a date value to 'YYYY-MM-DD' for <input type="date">
const toDateInputValue = (dateVal) => {
  if (!dateVal) return ''
  // If it's already YYYY-MM-DD (10 chars), return as-is
  if (typeof dateVal === 'string' && dateVal.length === 10) return dateVal
  // Otherwise parse ISO string and extract date portion
  return new Date(dateVal).toISOString().split('T')[0]
}

const TransactionForm = ({ transactions, setTransactions, editTransaction, setShowForm }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: '',
    date: '',
    description: ''
  })

  const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Salary', 'Rent'] // FIX #9: added Rent to match FilterBar

  useEffect(() => {
    if (editTransaction) {
      setFormData({
        amount: editTransaction.amount,
        category: editTransaction.category,
        type: editTransaction.type,
        date: toDateInputValue(editTransaction.date), // FIX #3: normalize date for input
        description: editTransaction.description
      })
    }
  }, [editTransaction])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token found')

      // FIX #2: always parse amount as float before sending, applies to both add and edit
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.description
      }

      let response

      if (editTransaction) {
        response = await axios.put(`${apiUrl}/transactions/${editTransaction.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const updatedTransactions = transactions.map(t =>
          t.id === editTransaction.id ? response.data : t
        )
        setTransactions(updatedTransactions)
      } else {
        response = await axios.post(`${apiUrl}/transactions`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setTransactions([...transactions, response.data])
      }

      setFormData({
        amount: '',
        category: '',
        type: '',
        date: '',
        description: ''
      })

      setShowForm(false)
    } catch (error) {
      if (error.response) {
        console.error('Error saving transaction:', error.response.data.error)
      } else {
        console.error('Error saving transaction:', error.message)
      }
    }
  }

  return (
    <div className="bg-gray-900 border border-blue-600 p-6 rounded-lg space-y-6 text-white w-full max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto shadow-lg animate-fadeIn px-4 sm:px-8">
      <h2 className="text-2xl font-bold text-blue-500 mb-4 text-center">
        {editTransaction ? 'Edit' : 'Add'} Transaction
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 text-blue-300 font-semibold">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="w-full p-3 border border-blue-600 rounded-lg bg-gray-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1 text-blue-300 font-semibold">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full p-3 border border-blue-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="" disabled>
              Select Category
            </option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-semibold text-blue-300 mb-2">Type</legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-blue-300 cursor-pointer hover:text-blue-500 transition">
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === 'income'}
                onChange={handleChange}
                className="accent-blue-500"
              />
              Income
            </label>
            <label className="flex items-center gap-2 text-blue-300 cursor-pointer hover:text-blue-500 transition">
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
                className="accent-blue-500"
              />
              Expense
            </label>
          </div>
        </fieldset>

        <div>
          <label className="block mb-1 text-blue-300 font-semibold">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-3 border border-blue-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div>
          <label className="block mb-1 text-blue-300 font-semibold">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border border-blue-600 rounded-lg bg-gray-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Optional"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-black font-semibold py-2 px-6 rounded-lg transition"
          >
            {editTransaction ? 'Update' : 'Add'}
          </button>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-red-500 hover:underline hover:text-red-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
    </div>
  )
}

export default TransactionForm
