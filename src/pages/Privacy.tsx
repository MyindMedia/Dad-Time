export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-800">
          <p>
            This Privacy Policy describes how Dad Time ("we", "us", "our") collects, uses, and protects information
            when you use our application and website located at happydadtime.com (the "Service").
          </p>

          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Account Information: email address, profile details you provide when registering.
            </li>
            <li>
              Visit Logs: session start/end times, notes, and optional child association.
            </li>
            <li>
              Location Data: GPS coordinates and trip routes when you enable trip tracking. Location is only
              collected during active sessions or when you explicitly start tracking.
            </li>
            <li>
              Expenses & Receipts: uploaded images/PDFs, categories, amounts, reimbursement status.
            </li>
            <li>
              Evidence & Screenshots: photos, documents, and conversation screenshots you upload, including AI
              summaries and tone analysis results.
            </li>
            <li>
              Device & Usage: basic device information, timestamps, and interaction logs used to improve Service
              performance and reliability.
            </li>
          </ul>

          <h2 className="text-xl font-semibold">How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide core app features: time tracking, mileage, expenses, evidence archiving, reports.</li>
            <li>Generate analytics and summaries for your personal records.</li>
            <li>Perform optional AI analyses on screenshots you submit.</li>
            <li>Improve reliability, security, and user experience.</li>
          </ul>

          <h2 className="text-xl font-semibold">Legal Use and Responsibility</h2>
          <p>
            The Service provides tools to document activities and communications. You are solely responsible for
            ensuring any use, storage, sharing, or submission of evidence complies with applicable laws and court
            requirements in your jurisdiction.
          </p>

          <h2 className="text-xl font-semibold">Data Storage and Processing</h2>
          <p>
            We use Supabase to provide authentication, database, and storage services. AI analyses may be processed
            by third-party providers. Uploaded files are stored in cloud storage buckets and may be publicly accessible
            via signed or public URLs based on configuration. Do not upload content you consider highly confidential.
          </p>

          <h2 className="text-xl font-semibold">Retention and Deletion</h2>
          <p>
            You control your records within the app. You may delete entries and uploads at any time. Backups and
            logs may persist for a limited period as part of standard operations.
          </p>

          <h2 className="text-xl font-semibold">Children’s Privacy</h2>
          <p>
            The Service is intended for use by parents/guardians. We do not knowingly collect personal information
            directly from children. Records you create that reference children are stored as part of your account.
          </p>

          <h2 className="text-xl font-semibold">Security</h2>
          <p>
            We take reasonable measures to protect your information. No online service can guarantee absolute security.
            Use strong passwords and protect your device.
          </p>

          <h2 className="text-xl font-semibold">Your Choices</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access, update, or delete your data via in-app features.</li>
            <li>Control location tracking by starting/stopping trips and session timing.</li>
            <li>Choose whether to use AI analysis; do not upload content you prefer not to process.</li>
          </ul>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            For privacy inquiries, contact support at support@happydadtime.com.
          </p>
        </div>
      </div>
    </div>
  )
}
