export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-800">
          <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
          <p>
            By accessing or using Dad Time (the "Service"), you agree to these Terms of Service. If you do not agree,
            do not use the Service.
          </p>

          <h2 className="text-xl font-semibold">Eligibility and Accounts</h2>
          <p>
            You must provide accurate registration information and maintain the security of your account. You are
            responsible for all activity under your account.
          </p>

          <h2 className="text-xl font-semibold">Permitted Use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the Service to track custody time, trips, expenses, and evidence for personal records.</li>
            <li>Do not upload unlawful content or violate the rights of others.</li>
            <li>Comply with all applicable laws and court orders when generating or sharing records.</li>
          </ul>

          <h2 className="text-xl font-semibold">Location and Evidence</h2>
          <p>
            Location tracking operates only when you start sessions or trips. Evidence and screenshots are user-provided
            content. You are solely responsible for any use of such content.
          </p>

          <h2 className="text-xl font-semibold">AI Analysis</h2>
          <p>
            Optional AI features provide summaries and tone analysis of content you submit. Results are informational
            and not legal advice. Accuracy is not guaranteed.
          </p>

          <h2 className="text-xl font-semibold">Ownership</h2>
          <p>
            You retain rights to content you upload. By using the Service, you grant us a limited license to store and
            process your content solely to operate the Service.
          </p>

          <h2 className="text-xl font-semibold">Termination</h2>
          <p>
            We may suspend or terminate access for violations of these Terms or to protect users and the Service.
          </p>

          <h2 className="text-xl font-semibold">Disclaimers</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. We do not guarantee accuracy,
            availability, or fitness for a particular purpose.
          </p>

          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, we are not liable for indirect, incidental, consequential,
            exemplary, or punitive damages arising from your use of the Service.
          </p>

          <h2 className="text-xl font-semibold">Changes</h2>
          <p>
            We may update these Terms and will post the revised version with the effective date. Continued use
            constitutes acceptance.
          </p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            For questions, contact support@happydadtime.com.
          </p>
        </div>
      </div>
    </div>
  )
}
