/**
 * Header Component
 * Navigation header with user info and logout
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import './Header.css';

export function Header() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                        <path
                            d="M8 10h16M8 16h12M8 22h14"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <circle cx="24" cy="22" r="4" fill="#FFD700" />
                        <defs>
                            <linearGradient
                                id="logo-gradient"
                                x1="0"
                                y1="0"
                                x2="32"
                                y2="32"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#6366f1" />
                                <stop offset="1" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="header-title">CollabDoc</span>
                </Link>

                <nav className="header-nav">
                    {isAuthenticated ? (
                        <div className="header-user">
                            <div className="user-info">
                                <span
                                    className="user-avatar"
                                    style={{ backgroundColor: user?.color }}
                                >
                                    {user?.displayName?.charAt(0).toUpperCase()}
                                </span>
                                <span className="user-name">{user?.displayName}</span>
                            </div>
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="header-auth">
                            <Link to="/login" className="btn btn-ghost btn-sm">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
