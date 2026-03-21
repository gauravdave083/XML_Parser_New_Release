import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import FileUpload from './pages/FileUpload'

function App() {
  // requestTabs: shared tab structure across all test cases
  const [requestTabs, setRequestTabs] = useState([
    { name: 'Request 1', enabled: true },
  ])

  // testCases: each test case holds its own XML per request tab
  const [testCases, setTestCases] = useState([
    { id: 'TC-001', data: {} },
  ])

  const handleAutoFill = (filledTabs) => {
    // filledTabs: [{name, xml, enabled}]
    const newTabs = filledTabs.map((t) => ({ name: t.name, enabled: t.enabled }))
    setRequestTabs(newTabs)
    // Put XML into the active (first) test case
    const newData = {}
    filledTabs.forEach((t) => { newData[t.name] = t.xml })
    setTestCases((prev) => {
      const updated = [...prev]
      if (updated.length === 0) {
        updated.push({ id: 'TC-001', data: newData })
      } else {
        updated[0] = { ...updated[0], data: newData }
      }
      return updated
    })
  }

  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              requestTabs={requestTabs}
              setRequestTabs={setRequestTabs}
              testCases={testCases}
              setTestCases={setTestCases}
            />
          }
        />
        <Route
          path="/upload"
          element={<FileUpload onAutoFill={handleAutoFill} />}
        />
      </Routes>
    </>
  )
}

export default App
