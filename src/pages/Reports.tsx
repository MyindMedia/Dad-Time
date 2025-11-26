export default function Reports() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
        <p className="text-gray-600 mb-8">View custody analytics and generate court-ready reports</p>
        
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-gray-400">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Analytics charts will appear here</p>
              </div>
            </div>
            <p className="text-blue-600 font-medium">Reports and analytics functionality coming soon...</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Time Share Calculations</h3>
            <p className="text-sm text-gray-600">Calculate custody time percentages</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">PDF Generation</h3>
            <p className="text-sm text-gray-600">Generate court-ready reports</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Interactive Charts</h3>
            <p className="text-sm text-gray-600">Visualize custody time and expenses</p>
          </div>
        </div>
      </div>
    </div>
  )
}