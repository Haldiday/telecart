const MSG91_BASE_URL = "https://control.msg91.com/api/v5";
const MSG91_TIMEOUT_MS = 12000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OTPMethod = "mobile" | "email" | "both";
type OTPAction = "send" | "verify";

interface OTPRequestBody {
  action?: OTPAction;
  method?: OTPMethod;
  phoneNumber?: string;
  email?: string;
  mobileOtp?: string;
  emailOtp?: string;
}

interface PublicError {
  code: string;
  message: string;
}

class AppError extends Error {
  status: number;
  code: string;
  publicMessage: string;
  details?: unknown;

  constructor(status: number, code: string, publicMessage: string, details?: unknown) {
    super(publicMessage);
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
    this.details = details;
  }
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isValidMethod = (value: unknown): value is OTPMethod =>
  value === "mobile" || value === "email" || value === "both";

const isValidAction = (value: unknown): value is OTPAction =>
  value === "send" || value === "verify";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidOtp = (value: string) => /^\d{6}$/.test(value);

const maskPhone = (value: string) => {
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

const maskEmail = (value: string) => {
  const [local, domain] = value.split("@");
  if (!local || !domain) return "***";
  const maskedLocal = local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
};

const normalizePhone = (input: string) => {
  const raw = input ?? "";
  const digitsOnly = raw.replace(/[^\d]/g, "");
  let normalized = digitsOnly;
  let flow = "kept";

  if (normalized.startsWith("00")) {
    normalized = normalized.replace(/^00+/, "");
    flow = "removed_international_prefix";
  }

  if (normalized.length === 11 && normalized.startsWith("0")) {
    normalized = normalized.slice(1);
    flow = "removed_leading_zero";
  }

  if (normalized.length === 10) {
    normalized = `91${normalized}`;
    flow = "added_country_code_91";
  }

  let duplicateCountryCodeTrimmed = false;
  while (normalized.startsWith("9191") && normalized.length > 12) {
    normalized = normalized.slice(2);
    duplicateCountryCodeTrimmed = true;
    flow = "trimmed_duplicate_country_code";
  }

  const isValid = /^\d{10,15}$/.test(normalized);

  return {
    normalized,
    isValid,
    flow,
    duplicateCountryCodeTrimmed,
    rawLength: raw.length,
    digitLength: digitsOnly.length,
  };
};

const log = (
  level: "info" | "warn" | "error",
  requestId: string,
  event: string,
  meta: Record<string, unknown> = {},
) => {
  const payload = {
    requestId,
    event,
    ...meta,
  };

  if (level === "error") {
    console.error("[msg91-otp]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[msg91-otp]", payload);
    return;
  }

  console.log("[msg91-otp]", payload);
};

const toPublicError = (error: unknown): PublicError => {
  if (error instanceof AppError) {
    return { code: error.code, message: error.publicMessage };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  };
};

const toErrorResponse = (requestId: string, error: unknown) => {
  if (error instanceof AppError) {
    return json(error.status, {
      success: false,
      requestId,
      error: { code: error.code, message: error.publicMessage },
    });
  }

  return json(500, {
    success: false,
    requestId,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
  });
};

const safeReadJson = async (req: Request) => {
  try {
    return (await req.json()) as OTPRequestBody;
  } catch {
    throw new AppError(400, "INVALID_JSON", "Invalid request format.");
  }
};

const mapUpstreamError = (action: OTPAction, upstreamMessage: string): AppError => {
  const message = upstreamMessage.toLowerCase();

  if (message.includes("limit") || message.includes("rate") || message.includes("too many")) {
    return new AppError(429, "OTP_RATE_LIMITED", "Too many requests. Please try again in a few minutes.");
  }

  if (message.includes("auth") || message.includes("unauthor")) {
    return new AppError(502, "MSG91_AUTH_FAILED", "OTP service is temporarily unavailable. Please try again later.");
  }

  if (message.includes("template")) {
    return new AppError(502, "MSG91_TEMPLATE_ERROR", "OTP service is temporarily unavailable. Please try again later.");
  }

  if (action === "verify" && (message.includes("invalid") || message.includes("expired"))) {
    return new AppError(400, "OTP_INVALID_OR_EXPIRED", "Invalid or expired OTP. Please try again.");
  }

  if (message.includes("mobile") || message.includes("number")) {
    return new AppError(400, "INVALID_PHONE", "Please enter a valid phone number.");
  }

  if (message.includes("email")) {
    return new AppError(400, "INVALID_EMAIL", "Please enter a valid email address.");
  }

  return new AppError(
    502,
    action === "send" ? "OTP_SEND_FAILED" : "OTP_VERIFY_FAILED",
    action === "send"
      ? "Unable to send OTP right now. Please try again."
      : "Unable to verify OTP right now. Please try again.",
  );
};

const msg91Request = async (
  requestId: string,
  action: OTPAction,
  channel: "mobile" | "email",
  path: string,
  params: Record<string, string>,
) => {
  const url = `${MSG91_BASE_URL}${path}?${new URLSearchParams(params).toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MSG91_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      payload = { raw: text };
    }

    log("info", requestId, "msg91_response", {
      action,
      channel,
      status: response.status,
      type: payload?.type ?? null,
    });

    if (!response.ok || payload?.type === "error") {
      const rawMessage =
        (typeof payload?.message === "string" && payload.message) ||
        (typeof payload?.error === "string" && payload.error) ||
        `MSG91 request failed with status ${response.status}`;

      throw mapUpstreamError(action, rawMessage);
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError(504, "MSG91_TIMEOUT", "OTP service timed out. Please try again.");
    }

    throw new AppError(502, "MSG91_NETWORK_ERROR", "OTP service is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }
};

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, {
      success: false,
      requestId,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed.",
      },
    });
  }

  try {
    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    const mobileTemplateId = Deno.env.get("MSG91_MOBILE_TEMPLATE_ID");
    const emailTemplateId = Deno.env.get("MSG91_EMAIL_TEMPLATE_ID");

    if (!authKey) {
      throw new AppError(500, "MSG91_NOT_CONFIGURED", "OTP service is not configured.");
    }

    const body = await safeReadJson(req);
    const action = body.action;
    const method = body.method;

    if (!isValidAction(action)) {
      throw new AppError(400, "INVALID_ACTION", "Invalid OTP action.");
    }

    if (!isValidMethod(method)) {
      throw new AppError(400, "INVALID_METHOD", "Invalid OTP method.");
    }

    const requiresMobile = method === "mobile" || method === "both";
    const requiresEmail = method === "email" || method === "both";

    log("info", requestId, "request_received", {
      action,
      method,
      hasPhone: Boolean(body.phoneNumber),
      hasEmail: Boolean(body.email),
      hasMobileOtp: Boolean(body.mobileOtp),
      hasEmailOtp: Boolean(body.emailOtp),
    });

    let normalizedPhone = "";
    if (requiresMobile) {
      const phoneResult = normalizePhone(body.phoneNumber ?? "");

      log("info", requestId, "phone_sanitized", {
        action,
        flow: phoneResult.flow,
        duplicateCountryCodeTrimmed: phoneResult.duplicateCountryCodeTrimmed,
        rawLength: phoneResult.rawLength,
        digitLength: phoneResult.digitLength,
        normalizedMasked: maskPhone(phoneResult.normalized),
      });

      if (!phoneResult.isValid) {
        throw new AppError(400, "INVALID_PHONE", "Please enter a valid phone number.");
      }

      normalizedPhone = phoneResult.normalized;

      if (!mobileTemplateId) {
        throw new AppError(500, "MOBILE_TEMPLATE_MISSING", "Mobile OTP template is not configured.");
      }
    }

    let normalizedEmail = "";
    if (requiresEmail) {
      normalizedEmail = (body.email ?? "").trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        throw new AppError(400, "INVALID_EMAIL", "Please enter a valid email address.");
      }

      log("info", requestId, "email_sanitized", {
        action,
        emailMasked: maskEmail(normalizedEmail),
      });

      if (!emailTemplateId) {
        throw new AppError(500, "EMAIL_TEMPLATE_MISSING", "Email OTP template is not configured.");
      }
    }

    if (action === "send") {
      const requests: Promise<Record<string, unknown>>[] = [];

      if (requiresMobile) {
        requests.push(
          msg91Request(requestId, "send", "mobile", "/otp", {
            template_id: mobileTemplateId!,
            mobile: normalizedPhone,
            authkey: authKey,
          }),
        );
      }

      if (requiresEmail) {
        requests.push(
          msg91Request(requestId, "send", "email", "/otp", {
            template_id: emailTemplateId!,
            email: normalizedEmail,
            authkey: authKey,
          }),
        );
      }

      await Promise.all(requests);

      log("info", requestId, "otp_send_success", {
        method,
        mobileSent: requiresMobile,
        emailSent: requiresEmail,
      });

      return json(200, {
        success: true,
        requestId,
        message: "OTP sent successfully.",
      });
    }

    const mobileOtp = (body.mobileOtp ?? "").trim();
    const emailOtp = (body.emailOtp ?? "").trim();

    if (requiresMobile && !isValidOtp(mobileOtp)) {
      throw new AppError(400, "INVALID_MOBILE_OTP", "Please enter a valid 6-digit mobile OTP.");
    }

    if (requiresEmail && !isValidOtp(emailOtp)) {
      throw new AppError(400, "INVALID_EMAIL_OTP", "Please enter a valid 6-digit email OTP.");
    }

    const requests: Promise<Record<string, unknown>>[] = [];

    if (requiresMobile) {
      requests.push(
        msg91Request(requestId, "verify", "mobile", "/otp/verify", {
          otp: mobileOtp,
          mobile: normalizedPhone,
          authkey: authKey,
        }),
      );
    }

    if (requiresEmail) {
      requests.push(
        msg91Request(requestId, "verify", "email", "/otp/verify", {
          otp: emailOtp,
          email: normalizedEmail,
          authkey: authKey,
        }),
      );
    }

    await Promise.all(requests);

    log("info", requestId, "otp_verify_success", {
      method,
      mobileVerified: requiresMobile,
      emailVerified: requiresEmail,
    });

    return json(200, {
      success: true,
      requestId,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    const publicError = toPublicError(error);
    log("error", requestId, "otp_flow_error", {
      code: publicError.code,
      message: publicError.message,
      details: error instanceof AppError ? error.details : undefined,
    });

    return toErrorResponse(requestId, error);
  }
});
