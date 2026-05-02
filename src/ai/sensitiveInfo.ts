export interface SensitiveInfoResult {
  sanitizedText: string;
  detected: boolean;
  warning: string;
  matches: string[];
}

const SECRET_PATTERNS: Array<{ label: string; regex: RegExp; replace: (match: string) => string }> = [
  {
    label: "private key",
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    replace: () => "[REDACTED PRIVATE KEY]"
  },
  {
    label: "bearer token",
    regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
    replace: () => "Bearer [REDACTED]"
  },
  {
    label: "password",
    regex: /\b(password|passwd|pwd)\s*[:=]\s*["']?[^"',\s;]+["']?/gi,
    replace: (match) => `${match.split(/[:=]/)[0].trim()}: [REDACTED]`
  },
  {
    label: "api key",
    regex: /\b(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9._\-+/=]{8,}["']?/gi,
    replace: (match) => `${match.split(/[:=]/)[0].trim()}: [REDACTED]`
  },
  {
    label: "long token-like value",
    regex: /\b(sk-[A-Za-z0-9]{12,}|xox[baprs]-[A-Za-z0-9-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g,
    replace: () => "[REDACTED TOKEN]"
  }
];

export function redactSensitiveInfo(text: string): SensitiveInfoResult {
  let sanitizedText = text;
  const matches = new Set<string>();

  for (const pattern of SECRET_PATTERNS) {
    sanitizedText = sanitizedText.replace(pattern.regex, (match) => {
      matches.add(pattern.label);
      return pattern.replace(match);
    });
  }

  const detected = matches.size > 0;

  return {
    sanitizedText,
    detected,
    matches: Array.from(matches),
    warning: detected
      ? `Sensitive information was detected and redacted: ${Array.from(matches).join(", ")}.`
      : ""
  };
}
