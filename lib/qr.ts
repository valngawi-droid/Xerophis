import QRCode from "qrcode";

/**
 * Renders a QR code (as a data URL) for the device-linking flow.
 * The QR encodes the pairing token so the phone can scan and confirm it.
 */
export async function qrDataUrl(token: string, size = 280): Promise<string> {
  // Encode a stable, scannable payload. Using the token (secret) is OK here
  // because it is only handed to the entity that initiated the pairing.
  const payload = token;
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#050707", light: "#ffffff" },
  });
}
