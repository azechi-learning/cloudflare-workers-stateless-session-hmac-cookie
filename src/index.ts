import { cookieSession } from "./cookieSession";
import { base64UrlEncode, base64UrlDecode } from "./base64Url";

export default {
  async fetch(
    req: Request,
    _env: {},
    _ctx: ExecutionContext
  ): Promise<Response> {
    const key = base64UrlDecode("sM1gh5bo1zyke8XQvoGq3nZ5tJ1VQJIYkuQe8YLHYJQ");
    const [saveSession, loadSession] = await cookieSession(
      {
        name: "session",
        path: "/verify",
        sameSite: "Strict",
      },
      key
    );

    const url = new URL(req.url);

    if (url.pathname === "/") {
      const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(24)));
      const sessionExpires = new Date(Date.now() + 5000);

      const response = new Response(null, {
        status: 302,
        headers: {
          Location: `/verify?${new URLSearchParams([["state", state]])}`,
        },
      });
      return await saveSession(response, state, sessionExpires);
    } else if (url.pathname === "/verify") {
      try {
        const sessionValue = await loadSession(req, new Date());
        console.log(sessionValue, url.searchParams.get("state"));

        if (!sessionValue || sessionValue !== url.searchParams.get("state")) {
          throw Error("state invalid");
        }
        return new Response();
      } catch (e) {
        return new Response(`${e}`);
      }
    }

    return new Response(null, { status: 404 });
  },
};
