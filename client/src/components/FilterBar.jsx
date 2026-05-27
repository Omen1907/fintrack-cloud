import React from 'react'

// FIX #9: Categories now match TransactionForm exactly so filters actually work
const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Salary', 'Rent']

const FilterBar = ({ filters, setFilters }) => {
  return (
    <div className="flex gap-4 mb-6">
      <select
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        className="p-2 border border-peachy rounded bg-black text-beige focus:outline-none focus:ring-2 focus:ring-peachy"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        className="p-2 border border-peachy rounded bg-black text-beige focus:outline-none focus:ring-2 focus:ring-peachy"
      >
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
    </div>
  )
}

export default FilterBar
