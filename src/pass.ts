import { Payload, PayloadBody, PassDictionary } from "./payload";
import { ValueSets } from "./value_sets";

type PassProps = {
  rawData: string;
  verification: boolean | string;
}

export class PassData {
  generic: PassDictionary;
  properties: PassProps;

  static async generatePass(payloadBody: PayloadBody): Promise<PassData> {
    // Get the Value Sets from GitHub
    const valueSets: ValueSets = await ValueSets.loadValueSets();

    // Create Payload
    const payload: Payload = new Payload(payloadBody, valueSets);

    // Create pass data
    const pass: PassData = new PassData(payload);

    return pass;
  }

  private constructor(payload: Payload) {
    this.generic = payload.generic;
    this.properties = payload.properties;
  }
}
