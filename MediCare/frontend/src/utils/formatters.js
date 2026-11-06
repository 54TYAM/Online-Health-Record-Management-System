/**
 * Normalize and format doctor titles cleanly, avoiding duplicate prefixes like "Dr. Dr."
 * @param {string} name
 * @returns {string}
 */
export const formatDoctorName = (name) => {
  if (!name || typeof name !== 'string') return 'Physician';
  const clean = name.replace(/^(dr\.?\s*)+/i, '').trim();
  return clean ? `Dr. ${clean}` : 'Physician';
};
