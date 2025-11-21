import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import CreateEquipment from './CreateEquipment'
import { EquipmentList } from './EquipmentList'
import { EditEquipment } from './EditEquipment'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/create" element={<CreateEquipment />} />
          <Route path="/equipments" element={<EquipmentList />} />
          <Route path="/edit/:tag" element={<EditEquipment />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
