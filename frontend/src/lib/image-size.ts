export function parseImageSize(bytes: Uint8Array) {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let index = 2;
  while (index + 9 < bytes.length) {
    if (bytes[index] !== 0xff) {
      index += 1;
      continue;
    }
    const marker = bytes[index + 1];
    const size = (bytes[index + 2] << 8) + bytes[index + 3];
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: (bytes[index + 5] << 8) + bytes[index + 6],
        width: (bytes[index + 7] << 8) + bytes[index + 8],
      };
    }
    if (size < 2) break;
    index += 2 + size;
  }
  return null;
}

export async function readImageSize(url: string) {
  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-65535" } });
    if (!response.ok && response.status !== 206) return null;
    return parseImageSize(new Uint8Array(await response.arrayBuffer()));
  } catch {
    return null;
  }
}
