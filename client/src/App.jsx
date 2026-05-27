import React from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Signin from './pages/Signin'
import Register from './pages/Register'
import Layout from './components/Layout'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Savings from './pages/Savings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="savings" element={<Savings />} />
      </Route>

      <Route path="signin" element={<Signin />} />
      <Route path="register" element={<Register />} />
    </Routes>
  )
}

export default App
