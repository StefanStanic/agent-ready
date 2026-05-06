export type ParsedLinkHeader = {
  url: string;
  rels: string[];
  attributes: Record<string, string>;
};

export function parseLinkHeader(headerValue: string): ParsedLinkHeader[] {
  const entries = splitHeader(headerValue);
  const parsed: ParsedLinkHeader[] = [];

  for (const entry of entries) {
    const segments = entry.split(";").map((segment) => segment.trim()).filter(Boolean);
    const target = segments.shift();

    if (!target?.startsWith("<") || !target.endsWith(">")) {
      continue;
    }

    const attributes: Record<string, string> = {};

    for (const segment of segments) {
      const equalsIndex = segment.indexOf("=");

      if (equalsIndex === -1) {
        attributes[segment] = "";
        continue;
      }

      const key = segment.slice(0, equalsIndex).trim().toLowerCase();
      const rawValue = segment.slice(equalsIndex + 1).trim();
      attributes[key] = stripQuotes(rawValue);
    }

    const rels = (attributes.rel ?? "")
      .split(/\s+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    parsed.push({
      url: target.slice(1, -1),
      rels,
      attributes
    });
  }

  return parsed;
}

function splitHeader(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const character of input) {
    if (character === '"') {
      inQuotes = !inQuotes;
      current += character;
      continue;
    }

    if (character === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function stripQuotes(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
}
