export type WebBotAuthDirectory = {
  keys?: Array<Record<string, unknown>>;
};

export type WebBotAuthValidation = {
  data: WebBotAuthDirectory | null;
  errors: string[];
  keyCount: number;
};

export function validateWebBotAuthDirectory(input: unknown): WebBotAuthValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      data: null,
      errors: ["Directory is not a JSON object."],
      keyCount: 0
    };
  }

  const value = input as Record<string, unknown>;
  const keys = value.keys;
  const errors: string[] = [];

  if (!Array.isArray(keys) || keys.length === 0) {
    errors.push("Missing keys array.");
  } else {
    for (const entry of keys) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push("Each key entry must be an object.");
        continue;
      }

      const key = entry as Record<string, unknown>;

      if (typeof key.kid !== "string" || key.kid.length === 0) {
        errors.push("Each key entry should include kid.");
      }

      if (typeof key.kty !== "string" || key.kty.length === 0) {
        errors.push("Each key entry should include kty.");
      }
    }
  }

  return {
    data: errors.length === 0 ? (value as WebBotAuthDirectory) : null,
    errors,
    keyCount: Array.isArray(keys) ? keys.length : 0
  };
}
