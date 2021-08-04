import { PayloadBody } from "./payload";
import { decodeData } from "./decode";
import { Result } from "@zxing/library";

export async function getPayloadBodyFromQR(
  qrCodeResult: Result
): Promise<PayloadBody> {
  // Get raw data
  let rawData = qrCodeResult.getText();

  // Decode Data
  let decodedData;

  try {
    decodedData = await decodeData(rawData);
  } catch (e) {
    throw Error("invalidQrCode");
  }

  return {
    rawData: rawData,
    decodedData: decodedData.decoded,
    verification: decodedData.verification,
  };
}
