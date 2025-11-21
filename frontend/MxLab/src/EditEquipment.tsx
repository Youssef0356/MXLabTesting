import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RecursiveModelForm, type ModelFormState } from './RecursiveModelForm'
import { API_BASE_URL } from './config'

interface AREquipmentResponse {
    id: number
    name: string
    tag: string
    model_id: number | null
    qr_image_url: string | null
}

export function EditEquipment() {
    const { tag } = useParams<{ tag: string }>()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [newTag, setNewTag] = useState('')

    const [rootModel, setRootModel] = useState<ModelFormState>({
        id: '',
        modelFileUrl: '',
        description: [],
        video: '',
        videoFile: null,
        datasheetUrl: '',
        datasheetFile: null,
        buttons: [],
        parts: []
    })

    const [qrFile, setQrFile] = useState<File | null>(null)
    const [qrPreview, setQrPreview] = useState<string | null>(null)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        if (tag) {
            fetchEquipment(tag)
        }
    }, [tag])

    const fetchEquipment = async (equipmentTag: string) => {
        try {
            setLoading(true)
            // Fetch AR equipment with full model data
            const response = await fetch(`${API_BASE_URL}/ar/equipments/${equipmentTag}`)
            if (!response.ok) throw new Error('Equipment not found')

            const data = await response.json()

            // Populate state with existing data
            setNewTag(data.tag)
            setQrPreview(data.qr_image_url)

            if (data.model) {
                setRootModel({
                    id: data.model.id || '',
                    modelFileUrl: data.model.modelFileUrl || '',
                    description: data.model.description || [],
                    video: data.model.video || '',
                    videoFile: null,
                    datasheetUrl: data.model.datasheetUrl || '',
                    datasheetFile: null,
                    buttons: data.model.buttons || [],
                    parts: data.model.parts || []
                })
            }
        } catch (err: any) {
            console.error(err)
            setError(err?.message || 'Failed to load equipment')
        } finally {
            setLoading(false)
        }
    }

    const handleQrFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null)
        const file = event.target.files?.[0] ?? null
        setQrFile(file)

        if (file) {
            const reader = new FileReader()
            reader.onload = e => {
                setQrPreview((e.target?.result as string) ?? null)
            }
            reader.readAsDataURL(file)
        } else {
            setQrPreview(null)
        }
    }

    const uploadQrImageIfNeeded = async (currentTag: string) => {
        if (!qrFile) return

        const formData = new FormData()
        formData.append('file', qrFile)

        const response = await fetch(`${API_BASE_URL}/ar/equipments/${encodeURIComponent(currentTag)}/qr-image`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            throw new Error('Failed to upload QR code')
        }
    }

    const buildModelPayload = (modelState: ModelFormState): any => {
        return {
            id: modelState.id,
            modelFileUrl: modelState.modelFileUrl,
            description: modelState.description,
            video: modelState.video,
            datasheetUrl: modelState.datasheetUrl,
            buttons: modelState.buttons.map(b => ({
                id: b.id,
                imageFileName: b.imageFileName
            })),
            parts: modelState.parts.map(p => buildModelPayload(p))
        }
    }

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!rootModel.id.trim() || !newTag.trim()) {
            setError("Model name and Tag are required")
            return
        }

        try {
            setSaving(true)
            setError(null)
            setSuccessMessage(null)

            // 1. Update the Model Hierarchy
            const modelPayload = buildModelPayload(rootModel)

            const updateModelResponse = await fetch(`${API_BASE_URL}/models/${encodeURIComponent(rootModel.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modelPayload)
            })

            if (!updateModelResponse.ok) {
                throw new Error("Failed to update model hierarchy")
            }

            // 2. Update AR Equipment
            const updateARPayload = {
                name: rootModel.id,
                tag: newTag.toUpperCase()
            }

            const updateARResponse = await fetch(`${API_BASE_URL}/ar/equipments/${tag}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateARPayload)
            })

            if (!updateARResponse.ok) {
                throw new Error("Failed to update AR equipment")
            }

            // 3. Upload new QR code if changed
            await uploadQrImageIfNeeded(newTag)

            setSuccessMessage("Equipment updated successfully!")
            setTimeout(() => navigate('/equipments'), 1500)
        } catch (err: any) {
            console.error(err)
            setError(err?.message ?? 'Unknown error during save')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <p className="text-slate-600">Loading equipment...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10 px-4">
            <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl px-6 py-8 md:px-10 md:py-10">
                <header className="mb-8 border-b border-slate-200 pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                            Edit <span className="text-blue-600">AR</span> Equipment
                        </h1>
                        <p className="mt-2 text-sm md:text-base text-slate-600">
                            Update the configuration, models, buttons, and all related data.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/equipments')}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        ← Back to List
                    </button>
                </header>

                <form onSubmit={handleSave} className="space-y-10">
                    {/* Main Information */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">Main Information</h2>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Tag / Reference (used in QR code)
                            </label>
                            <input
                                type="text"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                placeholder="Ex: POMP-001"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-[0.12em] uppercase"
                            />
                        </div>
                    </section>

                    {/* 3D Model Structure */}
                    <section className="space-y-4 border-t border-slate-200 pt-4">
                        <h2 className="text-lg font-semibold text-slate-900">3D Model Structure</h2>
                        <p className="text-sm text-slate-500">
                            Configure the main model, its documents, buttons, and parts/components.
                        </p>

                        <RecursiveModelForm
                            depth={0}
                            model={rootModel}
                            onChange={setRootModel}
                        />
                    </section>

                    {/* QR Code */}
                    <section className="space-y-4 border-t border-slate-200 pt-4">
                        <h2 className="text-lg font-semibold text-slate-900">QR Code</h2>
                        <p className="text-xs md:text-sm text-slate-500">
                            Upload a new QR code image or keep the existing one.
                        </p>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleQrFileChange}
                                className="w-full md:max-w-xs rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium hover:border-slate-400"
                            />

                            {qrPreview && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                        <img
                                            src={qrPreview}
                                            alt="QR Code Preview"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">Current/New QR code</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/equipments')}
                            className="inline-flex items-center justify-center rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {error && (
                    <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {successMessage && (
                    <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {successMessage}
                    </p>
                )}
            </div>
        </div>
    )
}
