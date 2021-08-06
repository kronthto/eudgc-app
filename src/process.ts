import { PayloadBody } from "./payload";
import { decodeData } from "./decode";
import { Result } from "@zxing/library";
import { PassData } from './pass';

export async function getPayloadBodyFromQR(
  qrCodeResult: Result
): Promise<PassData> {
  // Get raw data
  let rawData = qrCodeResult.getText();

  // Decode Data
  let decodedData;

  try {
    decodedData = await decodeData(rawData);
  } catch (e) {
    throw Error("invalidQrCode");
  }

  return PassData.generatePass({
    rawData: rawData,
    decodedData: decodedData.decoded,
    verification: decodedData.verification,
  });
}
