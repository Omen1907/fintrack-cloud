import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-beige flex items-center justify-center px-4 font-sans">
      <div className="text-center max-w-2xl space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-peachy leading-tight">
          Welcome to <span className="text-primary-400">FinTrack</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 font-body">
          Track your expenses, grow your savings, and master your finances — all in one modern dashboard.
        </p>

        <Link
          to="/transactions"
          className="inline-block mt-4 px-6 py-3 rounded-2xl bg-peachy text-black font-semibold hover:bg-primary-500 hover:text-white transition-colors duration-300"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Home;
