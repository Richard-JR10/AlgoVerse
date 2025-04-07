import React, {useEffect, useRef, useState} from 'react'
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../Auth/AuthContext.jsx";

const NavBar = ({ menuItems }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [loaded, setLoaded] = useState(false);

    const photoURL = user?.photoURL || 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';

    const location = useLocation();

    const handleProfileClick = () => {
        setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown on click
    };

    const handleSignOutClick = async (e) => {
        e.preventDefault();
        await logout();
    }

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

        // Cleanup listener on unmount or when dropdown closes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);


    return (
        <div className="navbar bg-base-100 sticky top-0 z-50 px-6 border-b-1 h-fit">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-accent">
                        <li><Link to="/visualizer">Visualizer</Link></li>
                        <li><a>Comparator</a></li>
                        <li><a>Challenges</a></li>
                    </ul>
                </div>
                {user ? (
                    <Link to="/visualizer" className="btn btn-ghost text-xl text-accent">AlgoVerse</Link>
                ):(
                    <Link to="/" className="btn btn-ghost text-xl text-accent">AlgoVerse</Link>
                )}

            </div>
            {user && (
                <div className="navbar-center hidden lg:flex text-accent">
                    <ul className="menu menu-horizontal px-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link to={item.path} className={`${location.pathname === item.path && location.pathname.startsWith('/visualizer/') ? 'bg-primary' : ''}`}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="navbar-end">
                {user ? (
                    <div className="relative" draggable="false" ref={dropdownRef}>
                        <button className="avatar cursor-pointer" onClick={handleProfileClick}>
                            <div className="w-10 rounded-full">
                                {!loaded && <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" alt="Loading" />}
                                <img
                                    src={photoURL}
                                    alt="User avatar"
                                    onLoad={() => setLoaded(true)}
                                    draggable="false"
                                />
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
                                        <div className="avatar">
                                            <div className="w-15 rounded-full">
                                                <img src={photoURL} alt="User avatar"/>
                                            </div>
                                        </div>
                                        <div className="w-full pl-3">
                                            <div className="font-semibold text-xl whitespace-nowrap">{user.displayName}</div>
                                            <div className="text-sm w-fit">{user.email}</div>
                                        </div>
                                    </div>

                                    <div className="divider mb-1 w-full"></div>
                                    <div className="flex flex-col w-full px-1">
                                        <button className="btn btn-ghost justify-start text-sm font-normal gap-6 border-none"
                                            onClick={() => navigate('/visualizer')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="3 0 18 24">
                                                <path fill="currentColor" d="M6 19h3.692v-5.077q0-.343.233-.575q.232-.233.575-.233h3q.343 0 .576.233q.232.232.232.575V19H18v-8.692q0-.154-.067-.28t-.183-.22L12.366 5.75q-.154-.134-.366-.134t-.365.134L6.25 9.808q-.115.096-.183.22t-.067.28zm-1 0v-8.692q0-.384.172-.727t.474-.565l5.385-4.078q.423-.323.966-.323t.972.323l5.385 4.077q.303.222.474.566q.172.343.172.727V19q0 .402-.299.701T18 20h-3.884q-.344 0-.576-.232q-.232-.233-.232-.576v-5.076h-2.616v5.076q0 .344-.232.576T9.885 20H6q-.402 0-.701-.299T5 19m7-6.711" />
                                            </svg>
                                            Home
                                        </button>
                                        <button className="btn btn-ghost justify-start text-sm font-normal gap-6 border-none">
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
                                                onClick={() => navigate('/admin')}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 23C6.443 21.765 2 16.522 2 11V5l10-4l10 4v6c0 5.524-4.443 10.765-10 12M4 6v5a10.58 10.58 0 0 0 8 10a10.58 10.58 0 0 0 8-10V6l-8-3Z"/><circle cx="12" cy="8.5" r="2.5" fill="currentColor"/><path fill="currentColor" d="M7 15a5.78 5.78 0 0 0 5 3a5.78 5.78 0 0 0 5-3c-.025-1.896-3.342-3-5-3c-1.667 0-4.975 1.104-5 3"/></svg>
                                                Admin
                                            </button>
                                        )}
                                        <button className="btn btn-ghost justify-start text-sm font-normal gap-6 border-none"
                                            onClick={handleSignOutClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M4 12a1 1 0 0 0 1 1h7.59l-2.3 2.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l4-4a1 1 0 0 0 .21-.33a1 1 0 0 0 0-.76a1 1 0 0 0-.21-.33l-4-4a1 1 0 1 0-1.42 1.42l2.3 2.29H5a1 1 0 0 0-1 1M17 2H7a3 3 0 0 0-3 3v3a1 1 0 0 0 2 0V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3a1 1 0 0 0-2 0v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                    ) : (
                        <a className="btn text-accent" onClick={() => navigate('/login')}>
                            Login
                        </a>
                    )}
            </div>
        </div>
    )
}
export default NavBar
