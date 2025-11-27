const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'two_factor_secret',
  'two_factor_enabled',
  'voice_sample_encrypted',
  'voice_biometric_enabled',
  'biometric_enabled',
  'api_token',
  'refresh_token',
  'belvo_link_token',
  'session_token',
]);

const MASK_FIELDS: Record<string, (value: string) => string> = {
  cpf: (v) => (v ? `***.***.***-${v.slice(-2)}` : '[não informado]'),
  account_number: (v) => (v ? `****${v.slice(-4)}` : '[não informado]'),
  phone: (v) => (v ? `(**) *****-${v.slice(-4)}` : '[não informado]'),
};

export function filterSensitiveData<T extends object>(data: T): Partial<T> {
  if (!data) return {};

  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Remove sensitive fields completely
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      continue;
    }

    // Mask specific fields
    if (key.toLowerCase() in MASK_FIELDS && typeof value === 'string') {
      filtered[key] = MASK_FIELDS[key.toLowerCase()](value);
      continue;
    }

    // Process recursively objects and arrays
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        filtered[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? filterSensitiveData(item as Record<string, unknown>)
            : item
        );
      } else {
        filtered[key] = filterSensitiveData(value as Record<string, unknown>);
      }
      continue;
    }

    filtered[key] = value;
  }

  return filtered as Partial<T>;
}
