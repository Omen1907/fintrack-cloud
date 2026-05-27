import React from 'react'

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { id, category, description, amount, type, date } = transaction

  return (
    <div className="flex justify-between items-center border-b border-blue-600 py-4 text-white hover:bg-gray-800 transition rounded-md px-4">
      <div>
        <div className="font-semibold text-blue-400">{category}</div>
        <div className="text-sm text-blue-300">{description || '-'}</div>
        <div className="text-xs text-blue-200">{new Date(date).toLocaleDateString()}</div>
      </div>

      <div className="flex items-center gap-6">
        <span
          className={`font-semibold ${
            type === 'income' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {type === 'income' ? '+' : '-'}${amount}
        </span>
        <button
          onClick={() => onEdit(transaction)}
          className="text-blue-400 hover:text-blue-600 hover:underline transition"
          aria-label={`Edit transaction ${description || category}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(id)}
          className="text-red-500 hover:text-red-600 hover:underline transition"
          aria-label={`Delete transaction ${description || category}`}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default TransactionItem
