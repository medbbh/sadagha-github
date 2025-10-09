import { useState, useEffect } from 'react';
import Loading from '../../components/common/Loading';
import { Outlet } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import Footer from '../../components/layout/Footer';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50">
      {/* Navbar Component */}
      
      <NavBar />
      
      {/* Main Content with top padding to account for fixed navbar */}
      <main className="flex-grow pt-20"> {/* Add pt-20 for navbar height */}
        <div className="container mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}