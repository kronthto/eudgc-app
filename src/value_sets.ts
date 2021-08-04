const fetch = require("node-fetch");

interface ValueTypes {
  medicalProducts: string;
  countryCodes: string;
  manufacturers: string;
  testResults: string;
  testTypes: string;
}

const j1 = require("./data/vaccine-medicinal-product.json");
const j2 = require("./data/country-2-codes.json");
const j3 = require("./data/vaccine-mah-manf.json");
const j4 = require("./data/test-result.json");
const j5 = require("./data/test-type.json");

export class ValueSets {
  private static VALUE_SET_BASE_URL: string =
    "https://raw.githubusercontent.com/ehn-dcc-development/ehn-dcc-valuesets/main/";
  private static VALUE_TYPES: ValueTypes = {
    medicalProducts: "vaccine-medicinal-product.json",
    countryCodes: "country-2-codes.json",
    manufacturers: "vaccine-mah-manf.json",
    testResults: "test-result.json",
    testTypes: "test-type.json",
  };

  medicalProducts: any;
  countryCodes: any;
  manufacturers: any;
  testResults: any;
  testTypes: any;

  private constructor(
    medicalProducts: object,
    countryCodes: object,
    manufacturers: object,
    testResults: object,
    testTypes: object
  ) {
    this.medicalProducts = medicalProducts;
    this.countryCodes = countryCodes;
    this.manufacturers = manufacturers;
    this.testResults = testResults;
    this.testTypes = testTypes;
  }

  private static async fetchValueSet(file: string): Promise<object> {
    return await (await fetch(ValueSets.VALUE_SET_BASE_URL + file)).json();
  }

  public static loadValueSets(): ValueSets {
    return new ValueSets(
      j1["valueSetValues"],
      j2["valueSetValues"],
      j3["valueSetValues"],
      j4["valueSetValues"],
      j5["valueSetValues"]
    );
  }
}
