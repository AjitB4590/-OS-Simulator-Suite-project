/**
 * ErrorMessage notification banner component.
 * Displays inline validation warnings and runtime errors cleanly
 * without disrupting user workflow with modal alerts.
 */

/**
 * @param {{ errors: string[] | string }} props
 */
export function ErrorMessage({ errors }) {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return null;
  }

  const errorList = Array.isArray(errors) ? errors : [errors];

  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
        <span aria-hidden="true">⚠️</span>
        <span>Please resolve the following configuration issues:</span>
      </div>
      <ul>
        {errorList.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </div>
  );
}
