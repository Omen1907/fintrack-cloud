import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_API_URL

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (formData.password === '' || formData.confirmPassword === '') {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const response = await axios.post(`${apiUrl}/register`, formData)
      const { token } = response.data

      localStorage.setItem('token', token)
      navigate('/transactions')
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-black via-gray-900 to-black flex items-center justify-center overflow-hidden px-4">
      <div className="w-full max-w-md bg-gray-800 border border-blue-500 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex items-center justify-center mb-6">
          <img
            className="w-10 h-10 mr-2"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
            alt="logo"
          />
          <span className="text-3xl font-bold text-blue-500">FinTrack</span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center">Create a New Account</h1>

        {error && (
          <div className="bg-red-500 text-white text-center py-2 px-4 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block mb-1 text-gray-300 font-medium">
              Your Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-gray-300 font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-gray-300 font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Register
          </button>

          <p className="text-sm text-gray-400 text-center">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-500 hover:underline hover:text-blue-400 transition">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
