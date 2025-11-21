import { useState, type FormEvent } from 'react'
import { RecursiveModelForm, type ModelFormState } from './RecursiveModelForm'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

interface AREquipmentResponse {
  id: number
  name: string
  tag: string
  model_id: number | null
  qr_image_url: string | null
}

function App() {
  const [tag, setTag] = useState('')

  // Root model state
  const [rootModel, setRootModel] = useState<ModelFormState>({
    id: '',
    modelFileUrl: '',  // Add this field
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
  const [lastCreated, setLastCreated] = useState<AREquipmentResponse | null>(null)

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

  const uploadQrImageIfNeeded = async (currentTag: string): Promise<AREquipmentResponse | null> => {
    if (!qrFile) return null

    const formData = new FormData()
    formData.append('file', qrFile)

    const response = await fetch(`${API_BASE_URL}/ar/equipments/${encodeURIComponent(currentTag)}/qr-image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Échec de l\'upload du QR code')
    }

    const data = (await response.json()) as AREquipmentResponse
    return data
  }

  // Helper to recursively build the payload for model creation
  const buildModelPayload = (modelState: ModelFormState): any => {
    return {
      id: modelState.id,
      modelFileUrl: modelState.modelFileUrl,  // ✅ Include the uploaded model file URL
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

    if (!rootModel.id.trim() || !tag.trim()) {
      setError("Nom du modèle et Tag sont obligatoires")
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      // 1. Create the Model Hierarchy
      const modelPayload = buildModelPayload(rootModel)

      // We need to send this to a create endpoint. 
      // The current /upload/ endpoint expects a file and creates a simple model.
      // We need a new endpoint or we use the existing create_model logic via a JSON endpoint?
      // Wait, `upload.py` has `upload_model` which takes a file.
      // But we want to create a complex structure.
      // We should probably add a `POST /models/` endpoint that takes the JSON payload.
      // I'll assume I can add that or use `POST /upload/` if I modify it? No, `upload` is multipart.
      // I need to add `POST /models/` to `backend/app/api/models.py` (if it exists) or similar.
      // Let's assume I will add `POST /models/create` that accepts JSON.

      // Wait, I haven't created that endpoint yet. I should do that.
      // But for now, let's assume it exists: `POST /models/`

      const createModelResponse = await fetch(`${API_BASE_URL}/models/`, { // Need to ensure this endpoint exists and accepts JSON
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelPayload)
      })

      if (!createModelResponse.ok) {
        throw new Error("Failed to create model hierarchy")
      }

      await createModelResponse.json() // Just to ensure it completes

      // 2. Create the AR Equipment linked to the model
      const createPayload = {
        name: rootModel.id,
        tag: tag.toUpperCase()
      }

      const createResponse = await fetch(`${API_BASE_URL}/ar/equipments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload),
      })

      if (!createResponse.ok) {
        const text = await createResponse.text()
        console.error('Create AR equipment failed:', text)
        throw new Error("Échec de la création de l'équipement AR (tag déjà utilisé ?) ")
      }

      let created = (await createResponse.json()) as AREquipmentResponse

      const withQr = await uploadQrImageIfNeeded(createPayload.tag)
      if (withQr) {
        created = withQr
      }

      setLastCreated(created)
      setSuccessMessage("Configuration AR enregistrée avec succès")
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Erreur inconnue lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl px-6 py-8 md:px-10 md:py-10">
        <header className="mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Configuration <span className="text-blue-600">AR</span> de l&apos;équipement
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl">
            Définissez le nom, la référence, et la structure complète du modèle 3D (enfants, boutons, documents).
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-10">
          {/* Informations principales */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Informations principales</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Tag / Référence (utilisé dans le QR code)
              </label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value.toUpperCase())}
                placeholder="Ex: POMP-001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-[0.12em] uppercase"
              />
              <p className="text-xs text-slate-500">
                Le nom de l&apos;équipement sera le même que le nom du modèle 3D ci-dessous.
              </p>
            </div>
          </section>

          {/* Modèle 3D Récursif */}
          <section className="space-y-4 border-t border-slate-200 pt-4">
            <h2 className="text-lg font-semibold text-slate-900">Structure du Modèle 3D</h2>
            <p className="text-sm text-slate-500">
              Configurez le modèle principal, ses documents associés, ses boutons, et ses pièces/composants (parts).
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
              Sélectionnez une image de QR code générée avec la même référence que le tag ci-dessus.
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
                      alt="Prévisualisation QR Code"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-slate-500">Aperçu du QR code sélectionné</span>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la configuration AR'}
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

        {lastCreated && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs md:text-sm text-slate-700">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Dernier équipement AR</h3>
            <p>
              <span className="font-medium">Nom:</span> {lastCreated.name}
            </p>
            <p>
              <span className="font-medium">Tag:</span> {lastCreated.tag}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
