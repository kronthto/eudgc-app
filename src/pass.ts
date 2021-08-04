import { Payload, PayloadBody, PassDictionary } from "./payload";
import { ValueSets } from "./value_sets";

enum Encoding {
  utf8 = "utf-8",
}

interface QrCode {
  message: string;
  messageEncoding: Encoding;
}

export class PassData {
  generic: PassDictionary;
  properties: object;

  static async generatePass(payloadBody: PayloadBody): Promise<string> {
    // Get the Value Sets from GitHub
    const valueSets: ValueSets = await ValueSets.loadValueSets();

    // Create Payload
    const payload: Payload = new Payload(payloadBody, valueSets);

    // Create QR Code Object
    const qrCode: QrCode = {
      message: payload.rawData,
      messageEncoding: Encoding.utf8,
    };

    // Create pass data
    const pass: PassData = new PassData(payload, qrCode);

    // Create pass.json
    const passJson = JSON.stringify(pass, null, 2);

    return passJson;
  }

  private constructor(payload: Payload, qrCode: QrCode) {
    this.generic = payload.generic;
    this.properties = payload.properties;
  }
}
