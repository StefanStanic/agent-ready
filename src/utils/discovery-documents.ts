export type ValidationResult<T extends object> = {
  data: T | null;
  errors: string[];
};

export type OpenApiDocument = {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, unknown>;
};

export type OauthDiscoveryDocument = {
  issuer: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  jwks_uri?: string;
  scopes_supported?: string[];
};

export type OauthProtectedResourceDocument = {
  resource: string;
  authorization_servers?: string[];
  scopes_supported?: string[];
};

export type McpServerCardDocument = {
  name: string;
  url?: string;
  description?: string;
  version?: string;
};

export type A2aAgentCardDocument = {
  name: string;
  description?: string;
  url?: string;
  version?: string;
};

export function validateOpenApiDocument(input: unknown): ValidationResult<OpenApiDocument> {
  if (!isRecord(input)) {
    return invalid("Document is not a JSON object.");
  }

  const errors: string[] = [];
  const version = typeof input.openapi === "string" ? input.openapi : typeof input.swagger === "string" ? input.swagger : null;

  if (!version) {
    errors.push("Missing OpenAPI or Swagger version field.");
  }

  if (!isRecord(input.info)) {
    errors.push("Missing info object.");
  } else {
    if (typeof input.info.title !== "string" || input.info.title.length === 0) {
      errors.push("Missing info.title.");
    }

    if (typeof input.info.version !== "string" || input.info.version.length === 0) {
      errors.push("Missing info.version.");
    }
  }

  if (!isRecord(input.paths) || Object.keys(input.paths).length === 0) {
    errors.push("Missing paths object.");
  }

  return {
    data: errors.length === 0 ? (input as OpenApiDocument) : null,
    errors
  };
}

export function validateOauthDiscoveryDocument(
  input: unknown
): ValidationResult<OauthDiscoveryDocument> {
  if (!isRecord(input)) {
    return invalid("Document is not a JSON object.");
  }

  const errors: string[] = [];

  if (typeof input.issuer !== "string" || input.issuer.length === 0) {
    errors.push("Missing issuer.");
  }

  if (
    input.authorization_endpoint !== undefined &&
    typeof input.authorization_endpoint !== "string"
  ) {
    errors.push("authorization_endpoint must be a string.");
  }

  if (input.token_endpoint !== undefined && typeof input.token_endpoint !== "string") {
    errors.push("token_endpoint must be a string.");
  }

  if (input.scopes_supported !== undefined && !isStringArray(input.scopes_supported)) {
    errors.push("scopes_supported must be an array of strings.");
  }

  return {
    data: errors.length === 0 ? (input as OauthDiscoveryDocument) : null,
    errors
  };
}

export function validateOauthProtectedResourceDocument(
  input: unknown
): ValidationResult<OauthProtectedResourceDocument> {
  if (!isRecord(input)) {
    return invalid("Document is not a JSON object.");
  }

  const errors: string[] = [];

  if (typeof input.resource !== "string" || input.resource.length === 0) {
    errors.push("Missing resource.");
  }

  if (
    input.authorization_servers !== undefined &&
    !isStringArray(input.authorization_servers)
  ) {
    errors.push("authorization_servers must be an array of strings.");
  }

  if (input.scopes_supported !== undefined && !isStringArray(input.scopes_supported)) {
    errors.push("scopes_supported must be an array of strings.");
  }

  return {
    data: errors.length === 0 ? (input as OauthProtectedResourceDocument) : null,
    errors
  };
}

export function validateMcpServerCardDocument(
  input: unknown
): ValidationResult<McpServerCardDocument> {
  if (!isRecord(input)) {
    return invalid("Document is not a JSON object.");
  }

  const errors: string[] = [];

  if (typeof input.name !== "string" || input.name.length === 0) {
    errors.push("Missing name.");
  }

  if (input.url !== undefined && typeof input.url !== "string") {
    errors.push("url must be a string.");
  }

  if (input.version !== undefined && typeof input.version !== "string") {
    errors.push("version must be a string.");
  }

  return {
    data: errors.length === 0 ? (input as McpServerCardDocument) : null,
    errors
  };
}

export function validateA2aAgentCardDocument(
  input: unknown
): ValidationResult<A2aAgentCardDocument> {
  if (!isRecord(input)) {
    return invalid("Document is not a JSON object.");
  }

  const errors: string[] = [];

  if (typeof input.name !== "string" || input.name.length === 0) {
    errors.push("Missing name.");
  }

  if (input.description !== undefined && typeof input.description !== "string") {
    errors.push("description must be a string.");
  }

  if (input.url !== undefined && typeof input.url !== "string") {
    errors.push("url must be a string.");
  }

  return {
    data: errors.length === 0 ? (input as A2aAgentCardDocument) : null,
    errors
  };
}

function invalid(message: string): ValidationResult<never> {
  return {
    data: null,
    errors: [message]
  };
}

function isRecord(input: unknown): input is Record<string, any> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function isStringArray(input: unknown): input is string[] {
  return Array.isArray(input) && input.every((value) => typeof value === "string");
}
