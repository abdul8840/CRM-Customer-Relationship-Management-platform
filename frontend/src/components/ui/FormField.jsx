export const FormField = ({ label, error, children, required }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium">{label}{required && <span className="text-red-500"> *</span>}</label>}
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);