import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
    const location = useLocation()

    const linkClass = (path: string) =>
        location.pathname === path
            ? 'bg-blue-700 px-3 py-2 rounded-md text-sm font-medium'
            : 'hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium'

    return (
        <nav className="bg-slate-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-xl font-bold">MXLab <span className="text-blue-400">Admin</span></h1>
                        <div className="flex space-x-4">
                            <Link to="/create" className={linkClass('/create')}>
                                ➕ Create Equipment
                            </Link>
                            <Link to="/equipments" className={linkClass('/equipments')}>
                                📋 All Equipments
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
