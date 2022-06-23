import { base64UrlEncode, base64UrlDecode } from "./base64Url";
import { hmac } from "./hmac";

export class SessionInvalidSignatureError extends Error {
  constructor(msg?: string) {
    super(msg);
    this.name = "SessionInvalidSignatureError";
  }
}

export class SessionExpiredError extends Error {
  constructor(msg?: string) {
    super(msg);
    this.name = "SessionExpiredError";
  }
}

export interface Cookie {
  name: string;
  path: string;
  sameSite: "Strict" | "Lax" | "None";
}

export async function cookieSession(
  { name, path, sameSite }: Cookie,
  key: ArrayBufferLike
) {
  const [encode, decode] = await sessionCookieEncoder(key);

  async function save(response: Response, value: string, expires: Date) {
    const data = await encode(value, expires);
    response.headers.append(
      "Set-Cookie",
      `${name}=${data}; Path=${path}; Secure; HttpOnly; SameSite=${sameSite}`
    );
    return response;
  }
  async function load(request: Request, now: Date) {
    const cookie = request.headers.get("Cookie") || "";
    const session = (
      cookie.split("; ").find((x) => x.startsWith(name)) || ""
    ).split("=")[1];
    if (!session) {
      return null;
    }
    return await decode(session, now);
  }

  return [save, load] as const;
}

async function sessionCookieEncoder(secret: ArrayBufferLike) {
  const [digest, verify] = await hmac(secret);

  async function signAndEncode(value: any, expires: Date) {
    const exp = String(expires.getTime());
    const val = encodeURIComponent(JSON.stringify(value));
    const msg = `${exp}.${val}`;
    const sign = await digest(new TextEncoder().encode(msg));
    return `${base64UrlEncode(sign)}.${msg}`;
  }

  async function verifyAndDecode(cookieValue: string, now: Date) {
    const [sign, msg] = splitN(cookieValue, ".", 2);

    if (!(await verify(base64UrlDecode(sign), new TextEncoder().encode(msg)))) {
      throw new SessionInvalidSignatureError();
    }

    const [exp, value] = splitN(msg, ".", 2);

    if (new Date(Number(exp)) <= now) {
      throw new SessionExpiredError();
    }

    return JSON.parse(decodeURIComponent(value));
  }

  return [signAndEncode, verifyAndDecode] as const;
}

function splitN(s: string, sep: string, c: number) {
  const acm = [];
  let i = 0;
  let j;
  while (--c) {
    j = s.indexOf(sep, i);
    if (j === -1) {
      break;
    }
    acm.push(s.substring(i, j));
    i = j + sep.length;
  }
  acm.push(s.substring(i));
  return acm;
}
