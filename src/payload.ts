import { ValueSets } from "./value_sets";

enum CertificateType {
  Vaccination = "Vaccination Card",
  Test = "Test Certificate",
  Recovery = "Recovery Certificate",
}

interface Field {
  key: string;
  label: string;
  value: string;
}

export interface PassDictionary {
  fields: Array<Field>;
  name: string;
  uvci: string;
  mainField: Field | null;
}

type HealthCert = {
  "1": any
}
export type DecodedData = {
  "-260": HealthCert
}

export interface PayloadBody {
  rawData: string;
  decodedData: DecodedData;
  verification: any;
}

export class Payload {
  certificateType: CertificateType;

  rawData: string;

  generic: PassDictionary;

  properties: any;

  constructor(body: PayloadBody, valueSets: ValueSets) {
    const healthCertificate = body.decodedData["-260"];
    const covidCertificate = healthCertificate["1"]; // Version number subject to change

    if (!covidCertificate) {
      throw new Error("certificateData");
    }

    // Get name and date of birth information
    const nameInformation = covidCertificate["nam"];
    const dateOfBirth = covidCertificate["dob"];

    if (!nameInformation) {
      throw new Error("nameMissing");
    }
    if (!dateOfBirth) {
      throw new Error("dobMissing");
    }

    const firstName = nameInformation["gn"];
    const lastName = nameInformation["fn"];

    const transliteratedFirstName = nameInformation["gnt"].replace(/</g, " ");
    const transliteratedLastName = nameInformation["fnt"].replace(/</g, " ");

    // Check if name contains non-latin characters
    const nameRegex = new RegExp(
      "^[\\p{Script=Latin}\\p{P}\\p{M}\\p{Z}]+$",
      "u"
    );

    let name: string;

    if (nameRegex.test(firstName) && nameRegex.test(lastName)) {
      name = `${firstName} ${lastName}`;
    } else {
      name = `${transliteratedFirstName} ${transliteratedLastName}`;
    }

    let properties: any;

    // Set certificate type and properties
    if (covidCertificate["v"] !== undefined) {
      this.certificateType = CertificateType.Vaccination;
      properties = covidCertificate["v"][0];
    } else if (covidCertificate["t"] !== undefined) {
      this.certificateType = CertificateType.Test;
      properties = covidCertificate["t"][0];
    } else if (covidCertificate["r"] !== undefined) {
      this.certificateType = CertificateType.Recovery;
      properties = covidCertificate["r"][0];
    } else {
      throw new Error("certificateType uk");
    }

    // Get country, identifier and issuer
    const countryCode = properties["co"];
    const uvci = properties["ci"];
    const certificateIssuer = properties["is"];

    if (!(countryCode in valueSets.countryCodes)) {
      throw new Error("invalidCountryCode");
    }

    const country : string = ((valueSets.countryCodes as any)[countryCode]).display;

    const generic: PassDictionary = {
      uvci: uvci,
      name: name,
      mainField: null,
      fields: [
        {
          key: "type",
          label: "EU Digital COVID",
          value: this.certificateType,
        },
        {
          key: "issuer",
          label: "Certificate Issuer",
          value: certificateIssuer,
        },
      ],
    };

    // Set Values
    this.rawData = body.rawData;

    this.generic = Payload.fillPassData(
      this.certificateType,
      generic,
      properties,
      valueSets,
      country,
      dateOfBirth
    );

    this.properties = body;
  }

  static fillPassData(
    type: CertificateType,
    data: PassDictionary,
    properties: any,
    valueSets: ValueSets,
    country: string,
    dateOfBirth: string
  ): PassDictionary {
    switch (type) {
      case CertificateType.Vaccination:
        const dose = `${properties["dn"]}/${properties["sd"]}`;
        const dateOfVaccination = properties["dt"];
        const medialProductKey = properties["mp"];
        const manufacturerKey = properties["ma"];

        if (!(medialProductKey in valueSets.medicalProducts)) {
          throw new Error("invalidMedicalProduct");
        }
        if (!(manufacturerKey in valueSets.manufacturers)) {
          throw new Error("invalidManufacturer");
        }

        const vaccineName = valueSets.medicalProducts[
          medialProductKey
        ].display.replace(/\s*\([^)]*\)\s*/g, "");
        const manufacturer = valueSets.manufacturers[manufacturerKey].display;

        data.mainField = {
          key: "dose",
          label: "Dose",
          value: dose,
        };

        data.fields.push(
          ...[
            {
              key: "dose",
              label: "Dose",
              value: dose,
            },
            {
              key: "dov",
              label: "Date of Vaccination",
              value: dateOfVaccination,
            },
          ]
        );
        data.fields.push(
          ...[
            {
              key: "vaccine",
              label: "Vaccine",
              value: vaccineName,
            },
            {
              key: "dob",
              label: "Date of Birth",
              value: dateOfBirth,
            },
          ]
        );
        data.fields.push(
          ...[
            {
              key: "cov",
              label: "Country of Vaccination",
              value: country,
            },
            {
              key: "manufacturer",
              label: "Manufacturer",
              value: manufacturer,
            },
          ]
        );
        break;
      case CertificateType.Test:
        const testTypeKey = properties["tt"];
        const testDateTimeString = properties["sc"];
        const testResultKey = properties["tr"];
        const testingCentre = properties["tc"];

        if (!(testResultKey in valueSets.testResults)) {
          throw new Error("invalidTestResult");
        }
        if (!(testTypeKey in valueSets.testTypes)) {
          throw new Error("invalidTestType");
        }

        const testResult = valueSets.testResults[testResultKey].display;
        const testType = valueSets.testTypes[testTypeKey].display;

        const testTime =
          testDateTimeString.replace(/.*T/, "").replace("Z", " ") + "UTC";
        const testDate = testDateTimeString.replace(/T.*/, "");

        data.fields.push(
          ...[
            {
              key: "result",
              label: "Test Result",
              value: testResult,
            },
            {
              key: "dot",
              label: "Date of Test",
              value: testDate,
            },
          ]
        );
        data.fields.push(
          ...[
            {
              key: "time",
              label: "Time of Test",
              value: testTime,
            },
            {
              key: "dob",
              label: "Date of Birth",
              value: dateOfBirth,
            },
          ]
        );
        data.fields.push({
          key: "cot",
          label: "Country of Test",
          value: country,
        });
        if (testingCentre !== undefined)
          data.fields.push({
            key: "centre",
            label: "Testing Centre",
            value: testingCentre,
          });
        data.fields.push(
          ...[
            {
              key: "test",
              label: "Test Type",
              value: testType,
            },
          ]
        );
        break;
      case CertificateType.Recovery:
        const firstPositiveTestDate = properties["fr"];
        const validFrom = properties["df"];
        const validUntil = properties["du"];

        data.mainField = {
          key: "until",
          label: "Valid Until",
          value: validUntil,
        };

        data.fields.push(
          ...[
            {
              key: "until",
              label: "Valid Until",
              value: validUntil,
            },
            {
              key: "dot",
              label: "Date of positive Test",
              value: firstPositiveTestDate,
            },
          ]
        );
        data.fields.push(
          ...[
            {
              key: "from",
              label: "Valid From",
              value: validFrom,
            },
            {
              key: "dob",
              label: "Date of Birth",
              value: dateOfBirth,
            },
          ]
        );
        data.fields.push(
          ...[
            {
              key: "cot",
              label: "Country of Test",
              value: country,
            },
          ]
        );
        break;
      default:
        throw new Error("certificateType");
    }

    return data;
  }
}
