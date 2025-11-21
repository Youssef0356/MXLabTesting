import { type ChangeEvent } from 'react'

import { API_BASE_URL } from './config'

export interface DescriptionItem {
  key: string
  value: string
}

export interface ARButtonState {
  id: string
  imageFileName: string
  imageFile: File | null
}

export interface ModelFormState {
  id: string
  modelFileUrl: string  // URL to the uploaded .glb file
  description: DescriptionItem[]
  video: string
  videoFile: File | null
  datasheetUrl: string
  datasheetFile: File | null
  buttons: ARButtonState[]
  parts: ModelFormState[]
}

interface RecursiveModelFormProps {
  depth: number
  model: ModelFormState
  onChange: (updated: ModelFormState) => void
  onRemove?: () => void
}

export function RecursiveModelForm({ depth, model, onChange, onRemove }: RecursiveModelFormProps) {
  const handleFieldChange = (field: keyof ModelFormState, value: any) => {
    onChange({ ...model, [field]: value })
  }

  const handleFileUpload = async (file: File, type: 'model' | 'asset'): Promise<{ url: string, filename: string }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const endpoint = type === 'model' ? '/upload/model' : '/upload/asset'

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      const url: string = data.url ?? data.model_file_url ?? ''
      const filename: string = data.filename ?? file.name
      return { url, filename }
    } catch (e) {
      console.error(e)
      alert('Upload failed')
      return { url: '', filename: '' }
    }
  }

  const handleAssetUpload = async (e: ChangeEvent<HTMLInputElement>, field: 'datasheet' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return
    const { url, filename } = await handleFileUpload(file, 'asset')
    // Set both the file object and the filename (not URL)
    // Database expects just the filename in 'video' field, and URL in 'datasheetUrl' field
    if (field === 'video') {
      onChange({ ...model, videoFile: file, video: url })
    } else {
      onChange({ ...model, datasheetFile: file, datasheetUrl: url })
    }
  }

  // Description handlers
  const addDescriptionItem = () => {
    onChange({
      ...model,
      description: [...model.description, { key: '', value: '' }],
    })
  }

  const updateDescriptionItem = (index: number, field: 'key' | 'value', val: string) => {
    const newDescription = [...model.description]
    newDescription[index] = { ...newDescription[index], [field]: val }
    onChange({ ...model, description: newDescription })
  }

  const removeDescriptionItem = (index: number) => {
    onChange({
      ...model,
      description: model.description.filter((_, i) => i !== index),
    })
  }

  // Button handlers
  const addButton = () => {
    onChange({
      ...model,
      buttons: [...model.buttons, { id: '', imageFileName: '', imageFile: null }],
    })
  }

  const updateButton = (index: number, btn: ARButtonState) => {
    const newButtons = [...model.buttons]
    newButtons[index] = btn
    onChange({ ...model, buttons: newButtons })
  }

  const removeButton = (index: number) => {
    onChange({
      ...model,
      buttons: model.buttons.filter((_, i) => i !== index),
    })
  }

  // Parts handlers
  const addPart = () => {
    onChange({
      ...model,
      parts: [
        ...model.parts,
        {
          id: '',
          modelFileUrl: '',  // Parts don't have 3D files
          description: [],
          video: '',
          videoFile: null,
          datasheetUrl: '',
          datasheetFile: null,
          buttons: [],
          parts: [],  // Always empty for parts (no nesting)
        },
      ],
    })
  }

  const updatePart = (index: number, part: ModelFormState) => {
    const newParts = [...model.parts]
    newParts[index] = part
    onChange({ ...model, parts: newParts })
  }

  const removePart = (index: number) => {
    onChange({
      ...model,
      parts: model.parts.filter((_, i) => i !== index),
    })
  }

  return (
    <div className={`border-l-4 border-blue-200 pl-4 py-4 my-4 ${depth > 0 ? 'ml-4 bg-slate-50 rounded-r-lg pr-4' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          {depth === 0 ? 'Main Model' : `Part (Level ${depth})`}
        </h3>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-red-500 text-sm hover:underline">
            Remove Part
          </button>
        )}
      </div>

      {/* Model ID/Name */}
      {/* Model ID/Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700">
          {depth === 0 ? 'Model Name' : 'Part Name'}
        </label>
        <input
          type="text"
          value={model.id}
          onChange={(e) => handleFieldChange('id', e.target.value.replace(/\s+/g, '_'))}
          placeholder={depth === 0 ? "Ex: Vanne_De_Regulation" : "Ex: Positionneur_electropneumatique"}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
        />
      </div>

      {/* 3D Model Upload - Only for main model (depth 0) */}
      {depth === 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700">3D Model File (.glb) *Required</label>
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return

              // Upload to /upload/model with model name
              try {
                const formData = new FormData()
                formData.append('file', file)
                const modelName = model.id || 'Unnamed Model'

                const response = await fetch(`${API_BASE_URL}/upload/model?name=${encodeURIComponent(modelName)}`, {
                  method: 'POST',
                  body: formData,
                })

                if (!response.ok) throw new Error('Model upload failed')
                const data = await response.json()
                onChange({ ...model, modelFileUrl: data.model_file_url })
                alert(`✅ 3D Model uploaded successfully!`)
              } catch (e) {
                console.error(e)
                alert('❌ Model upload failed. Make sure you entered a model name first!')
              }
            }}
            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {(model.modelFileUrl) && (
            <div className="mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded border border-green-200">
              ✅ Current Model: <span className="font-mono">{model.modelFileUrl.split('/').pop()}</span>
            </div>
          )}
          {!model.id && (
            <p className="mt-1 text-xs text-amber-600">⚠️ Enter a model name first before uploading the 3D file</p>
          )}
        </div>
      )}

      {/* Description Table */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-bold text-slate-700">Description</h4>
          <button
            type="button"
            onClick={addDescriptionItem}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
          >
            + Add Property
          </button>
        </div>
        <div className="space-y-2">
          {model.description.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center border-b border-slate-100 pb-2">
              <input
                placeholder="Key (e.g., marque)"
                value={item.key}
                onChange={(e) => updateDescriptionItem(idx, 'key', e.target.value)}
                className="flex-1 text-xs border rounded p-2"
              />
              <input
                placeholder="Value (e.g., SAMSON)"
                value={item.value}
                onChange={(e) => updateDescriptionItem(idx, 'value', e.target.value)}
                className="flex-1 text-xs border rounded p-2"
              />
              <button
                type="button"
                onClick={() => removeDescriptionItem(idx)}
                className="text-red-400 hover:text-red-600 text-xl px-2"
              >
                &times;
              </button>
            </div>
          ))}
          {model.description.length === 0 && (
            <p className="text-xs text-slate-400 italic">No description properties added.</p>
          )}
        </div>
      </div>

      {/* Video and Datasheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleAssetUpload(e, 'video')}
            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
          {(model.videoFile || model.video) && (
            <div className="mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
              ✅ {model.videoFile ? 'New File Selected' : `Current: ${model.video}`}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Datasheet (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleAssetUpload(e, 'datasheet')}
            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
          {(model.datasheetFile || model.datasheetUrl) && (
            <div className="mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
              ✅ {model.datasheetFile ? 'New File Selected' : `Current: ${model.datasheetUrl.split('/').pop()}`}
            </div>
          )}
        </div>
      </div>

      {/* Buttons Section */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-bold text-slate-700">AR Buttons</h4>
          <button
            type="button"
            onClick={addButton}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            + Add Button
          </button>
        </div>
        <div className="space-y-3">
          {model.buttons.map((btn, idx) => (
            <div key={idx} className="flex gap-2 items-start border-b border-slate-100 pb-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  placeholder="Button ID"
                  value={btn.id}
                  onChange={(e) => updateButton(idx, { ...btn, id: e.target.value })}
                  className="text-xs border rounded p-1"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      const { filename } = await handleFileUpload(f, 'asset')
                      updateButton(idx, { ...btn, imageFile: f, imageFileName: filename })
                    }
                  }}
                  className="text-xs"
                />
                {btn.imageFileName && (
                  <span className="col-span-2 text-xs text-green-600">
                    Image: {btn.imageFileName}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => removeButton(idx)} className="text-red-400 hover:text-red-600">
                &times;
              </button>
            </div>
          ))}
          {model.buttons.length === 0 && <p className="text-xs text-slate-400 italic">No buttons added.</p>}
        </div>
      </div>

      {/* Parts Section - Only show for depth 0 (prevent nesting) */}
      {depth === 0 && (
        <div className="pl-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-slate-700">Parts (Sub-components)</h4>
            <button
              type="button"
              onClick={addPart}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
            >
              + Add Part
            </button>
          </div>
          <div>
            {model.parts.map((part, idx) => (
              <RecursiveModelForm
                key={idx}
                depth={depth + 1}
                model={part}
                onChange={(updated) => updatePart(idx, updated)}
                onRemove={() => removePart(idx)}
              />
            ))}
            {model.parts.length === 0 && (
              <p className="text-xs text-slate-400 italic mt-2">No parts added. Parts are metadata only (no 3D files).</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
