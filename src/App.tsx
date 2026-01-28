import React from 'react';
import Dashboard from './renderer/components/Dashboard';

/**
 * Main Application Component
 * Serves as the root component for Focus-Lock productivity app
 */
function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Dashboard />
    </div>
  );
}

export default App;
