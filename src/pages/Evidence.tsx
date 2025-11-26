export default function Evidence() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Evidence Archive</h1>
        <p className="text-gray-600 mb-8">Store and organize photos, documents, and other evidence</p>
        
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-gray-400">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Drop files here or click to upload</p>
              </div>
            </div>
            <p className="text-blue-600 font-medium">Evidence archive functionality coming soon...</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Photo Storage</h3>
            <p className="text-sm text-gray-600">Upload and organize photos</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Document Storage</h3>
            <p className="text-sm text-gray-600">Store PDFs and documents</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
            <p className="text-sm text-gray-600">Tone analysis for communications</p>
          </div>
        </div>
      </div>
    </div>
  )
}