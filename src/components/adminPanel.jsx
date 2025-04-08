import 'react'
import {Link, Outlet} from "react-router-dom";
import NavBar from "./navBar.jsx";

const AdminPanel = () => {


    return (
        <div className="min-h-screen bg-base-200 flex flex-row">
            <div className="flex h-screen">
                {/* Sidebar */}
                <div className="flex flex-col w-60 bg-base-300 text-base-content">
                    <h2 className="flex text-4xl px-7 pt-10 w-full items-center justify-center">ADMIN</h2>
                    <ul className="menu flex-1 p-4 w-full">
                        <li><Link to="/admin/users">Users</Link></li>
                        <li><Link to="/admin/challenges">Manage Challenges</Link></li>
                        <li><Link to="/admin/library">Manage Library</Link></li>
                        <li><Link to="/admin/examples">Manage Examples</Link></li>
                    </ul>
                </div>

            </div>
            <div className="flex flex-col w-full text-base-content">
                <NavBar menuItems={[]}/>
                {/* Main Content */}
                <div className="flex-1 p-4">
                    <Outlet /> {/* Renders UserManagement below Navbar */}
                </div>
            </div>
        </div>
    )
}
export default AdminPanel
