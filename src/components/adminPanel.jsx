import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext.jsx";
import ProfileImage from "./utils/ProfileImage.jsx";
import ThemeToggle from "./utils/themeToggle.jsx";

const AdminPanel = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleProfileClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleSignOutClick = async (e) => {
        e.preventDefault();
        await logout();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Get current page title based on route
    const getCurrentPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/admin/users')) return 'User Management';
        if (path.includes('/admin/challenges')) return 'Challenge Management';
        if (path.includes('/admin/library')) return 'Library Management';
        if (path.includes('/admin/example')) return 'Example Management';
        if (path.includes('/admin/dashboard')) return 'Dashboard';
        return 'Admin Dashboard';
    };

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 bg-opacity-50 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            <div className="flex flex-row min-h-screen">
                {/* Sidebar */}
                <div className={`
                    ${isSidebarOpen ? 'fixed translate-x-0' : 'fixed -translate-x-full lg:translate-x-0 lg:left-0'}
                    transition-transform duration-300 ease-in-out
                    z-50 lg:z-0
                    flex flex-col w-60 h-screen bg-base-300 text-base-content top-0
                `}>
                    {/* Close button for mobile */}
                    <div className="flex justify-between items-center p-4 lg:hidden">
                        <h2 className="text-2xl font-bold text-primary">ADMIN</h2>
                        <button
                            className="btn btn-ghost btn-circle"
                            onClick={closeSidebar}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:flex">
                        <h2 className="text-4xl px-7 pt-10 w-full flex items-center justify-center font-bold text-primary">
                            ADMIN
                        </h2>
                    </div>

                    {/* Navigation menu */}
                    <ul className="menu flex-1 p-4 w-full">
                        <li>
                            <Link
                                to="/admin/dashboard"
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    location.pathname.includes('/admin/dashboard')
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/users"
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    location.pathname.includes('/admin/users')
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                <span>Users</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/challenges"
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    location.pathname.includes('/admin/challenges')
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span>Manage Challenges</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/library"
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    location.pathname.includes('/admin/library')
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Manage Library</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/example"
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    location.pathname.includes('/admin/example')
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Manage Examples</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Main content area */}
                <div className="flex flex-col flex-1 min-h-screen lg:ml-60">
                    {/* Admin Navbar */}
                    <div className="navbar bg-base-100 sticky top-0 z-40 px-4 md:px-6 border-b border-base-200 shadow-sm">
                        {/* Left side - Mobile hamburger + Title */}
                        <div className="navbar-start">
                            <button
                                className="btn btn-ghost btn-circle lg:hidden mr-2"
                                onClick={toggleSidebar}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="badge badge-primary badge-sm font-medium">ADMIN</div>
                                <h1 className="text-xl font-semibold text-base-content">{getCurrentPageTitle()}</h1>
                            </div>
                        </div>

                        {/* Right side - Back to App + Profile */}
                        <div className="navbar-end">
                            <ThemeToggle/>
                            <button
                                className="btn btn-ghost btn-sm mr-2"
                                onClick={() => navigate('/visualizer')}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Back to App</span>
                            </button>

                            {user && (
                                <div className="relative" draggable="false" ref={dropdownRef}>
                                    <button className="avatar cursor-pointer" onClick={handleProfileClick}>
                                        <div className="w-10 rounded-full">
                                            <ProfileImage src={user.photoURL} size="10" type="circle"/>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3 w-3 fill-accent absolute bottom-1 right-1 transform translate-x-1 translate-y-1"
                                                viewBox="0 0 512 512"
                                            >
                                                <path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM135 241c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l87 87 87-87c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9L273 345c-9.4 9.4-24.6 9.4-33.9 0L135 241z" />
                                            </svg>
                                        </div>
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="card absolute right-0 mt-4.5 w-fit min-w-76.5 bg-base-100 rounded-lg shadow-xl z-10">
                                            <div className="card-body w-full h-fit gap-0 p-4">
                                                <div className="flex flex-row items-center pr-4 w-fit">
                                                    <ProfileImage src={user.photoURL} size="16" type="circle"/>
                                                    <div className="w-full pl-3">
                                                        <div className="font-semibold text-xl whitespace-nowrap">{user.displayName}</div>
                                                        <div className="text-sm w-fit">{user.email}</div>
                                                    </div>
                                                </div>

                                                <div className="divider mb-1 w-full"></div>
                                                <div className="flex flex-col w-full px-1">
                                                    <button className="btn btn-ghost justify-start text-sm font-normal gap-6 border-none"
                                                            onClick={() => {
                                                                navigate('/visualizer');
                                                                setIsDropdownOpen(false);
                                                            }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="3 0 18 24">
                                                            <path fill="currentColor" d="M6 19h3.692v-5.077q0-.343.233-.575q.232-.233.575-.233h3q.343 0 .576.233q.232.232.232.575V19H18v-8.692q0-.154-.067-.28t-.183-.22L12.366 5.75q-.154-.134-.366-.134t-.365.134L6.25 9.808q-.115.096-.183.22t-.067.28zm-1 0v-8.692q0-.384.172-.727t.474-.565l5.385-4.078q.423-.323.966-.323t.972.323l5.385 4.077q.303.222.474.566q.172.343.172.727V19q0 .402-.299.701T18 20h-3.884q-.344 0-.576-.232q-.232-.233-.232-.576v-5.076h-2.616v5.076q0 .344-.232.576T9.885 20H6q-.402 0-.701-.299T5 19m7-6.711" />
                                                        </svg>
                                                        Home
                                                    </button>
                                                    <button className="btn btn-ghost justify-start text-sm font-normal gap-6 border-none"
                                                            onClick={() => {
                                                                navigate('/profile');
                                                                setIsDropdownOpen(false);
                                                            }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 24 24">
                                                            <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                                                                <path d="M16 9a4 4 0 1 1-8 0a4 4 0 0 1 8 0m-2 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0" />
                                                                <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11s11-4.925 11-11S18.075 1 12 1M3 12c0 2.09.713 4.014 1.908 5.542A8.99 8.99 0 0 1 12.065 14a8.98 8.98 0 0 1 7.092 3.458A9 9 0 1 0 3 12m9 9a8.96 8.96 0 0 1-5.672-2.012A6.99 6.99 0 0 1 12.065 16a6.99 6.99 0 0 1 5.689 2.92A8.96 8.96 0 0 1 12 21" />
                                                            </g>
                                                        </svg>
                                                        Profile
                                                    </button>
                                                    {user.admin && (
                                                        <button className="btn btn-ghost justify-start text-sm font-normal gap-6 border-none"
                                                                onClick={() => {
                                                                    navigate('/admin/users');
                                                                    setIsDropdownOpen(false);
                                                                }}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 23C6.443 21.765 2 16.522 2 11V5l10-4l10 4v6c0 5.524-4.443 10.765-10 12M4 6v5a10.58 10.58 0 0 0 8 10a10.58 10.58 0 0 0 8-10V6l-8-3Z"/><circle cx="12" cy="8.5" r="2.5" fill="currentColor"/><path fill="currentColor" d="M7 15a5.78 5.78 0 0 0 5 3a5.78 5.78 0 0 0 5-3c-.025-1.896-3.342-3-5-3c-1.667 0-4.975 1.104-5 3"/></svg>
                                                            Admin
                                                        </button>
                                                    )}
                                                    <div className="divider mb-4 w-full"></div>
                                                    <button className="btn btn-ghost btn-error justify-start text-sm font-normal gap-6 border-none"
                                                            onClick={handleSignOutClick}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 24 24">
                                                            <path fill="currentColor" d="M4 12a1 1 0 0 0 1 1h7.59l-2.3 2.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l4-4a1 1 0 0 0 .21-.33a1 1 0 0 0 0-.76a1 1 0 0 0-.21-.33l-4-4a1 1 0 1 0-1.42 1.42l2.3 2.29H5a1 1 0 0 0-1 1M17 2H7a3 3 0 0 0-3 3v3a1 1 0 0 0 2 0V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3a1 1 0 0 0-2 0v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3" />
                                                        </svg>
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 sm:p-6 lg:p-8">
                        <div className="w-full max-w-full overflow-hidden">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;