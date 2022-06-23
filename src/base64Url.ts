export function base64UrlEncode(buff: ArrayBufferLike) {
  return btoa(String.fromCharCode(...new Uint8Array(buff))).replace(
    /\/|\+|=/g,
    (m) => ({ "/": "_", "+": "-", "=": "" }[m]!)
  );
}

export function base64UrlDecode(str: string) {
  return new Uint8Array(
    (function* (s) {
      for (let i = 0, len = s.length; i < len; i++) {
        yield s.charCodeAt(i);
      }
    })(atob(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" }[m]!))))
  );
}
