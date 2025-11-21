import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from './config'

interface AREquipment {
    name: string
    tag: string
    qr_image_url: string | null
    created_at: string
}

export function EquipmentList() {
    const [equipments, setEquipments] = useState<AREquipment[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchEquipments()
    }, [])

    const fetchEquipments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ar/equipments/`)
            const data = await response.json()
            setEquipments(data)
        } catch (error) {
            console.error('Failed to fetch equipments:', error)
            alert('Failed to load equipments')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <p className="text-center text-slate-600">Loading equipments...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">All AR Equipments</h2>
                <button
                    onClick={() => navigate('/create')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                    ➕ New Equipment
                </button>
            </div>

            {equipments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <p className="text-slate-600 mb-4">No equipments created yet</p>
                    <button
                        onClick={() => navigate('/create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Create Your First Equipment
                    </button>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Tag
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Model Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    QR Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {equipments.map((eq) => (
                                <tr key={eq.tag} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono text-sm font-medium text-slate-900">{eq.tag}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {eq.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {eq.qr_image_url ? (
                                            <span className="text-green-600 font-semibold">✓ Uploaded</span>
                                        ) : (
                                            <span className="text-slate-400">✗ Missing</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(eq.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/edit/${eq.tag}`)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            ✏️ Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
