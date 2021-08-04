// Taken from https://github.com/ehn-dcc-development/ehn-sign-verify-javascript-trivial/blob/main/cose_verify.js
// and https://github.com/ehn-dcc-development/dgc-check-mobile-app/blob/main/src/app/cose-js/sign.js

import { DecodedData } from './payload'

type Cert = {
  kid: string;
  verifier: any;
};
type CoseKeyHeader = {
  4: Uint8Array;
};
type DecodeResult = {
  decoded: DecodedData,
  verification: any
}

const base45 = require("base45");
const pako = require("pako");
const cbor = require("cbor-js");
const cose = require("cose-js");
const certs: Array<Cert> = require("./data/allCertsPrepped.json");

export function typedArrayToBufferSliced(array: Uint8Array): ArrayBuffer {
  return array.buffer.slice(
    array.byteOffset,
    array.byteLength + array.byteOffset
  );
}

export function typedArrayToBuffer(array: Uint8Array): ArrayBuffer {
  var buffer = new ArrayBuffer(array.length);

  array.map(function (value, i) {
    return ((buffer as any)[i] = value);
  });

  return array.buffer;
}

export function decodeData(data: string): Promise<DecodeResult> {
  if (data.startsWith("HC1")) {
    data = data.substring(3);

    if (data.startsWith(":")) {
      data = data.substring(1);
    }
  }

  var arrayBuffer: Uint8Array = base45.decode(data);

  if (arrayBuffer[0] == 0x78) {
    arrayBuffer = pako.inflate(arrayBuffer);
  }

  var payloadArray: Array<Uint8Array> = cbor.decode(
    typedArrayToBuffer(arrayBuffer)
  );

  if (!Array.isArray(payloadArray) || payloadArray.length !== 4) {
    throw new Error("decodingFailed");
  }

  var plaintext: Uint8Array = payloadArray[2];

  let result: DecodeResult = {
    decoded: cbor.decode(typedArrayToBufferSliced(plaintext)),
    verification: false
  };

  let buf = Buffer.from(typedArrayToBuffer(arrayBuffer));
  return verify(buf, payloadArray[1] as unknown as CoseKeyHeader)
    .then((cert) => {
      result.verification = cert;
    }, console.log)
    .then(() => result);
}

function verify(rawCose: Buffer, header: CoseKeyHeader) {
  return new Promise((resolve, reject) => {
    let kid = Buffer.from(header[4]).toString("base64");
    let key = certs.find((cert) => cert.kid === kid);

    if (!key) {
      return reject("Key not found");
    }

    cose.sign.verify(rawCose, key.verifier).then(() => resolve(key), reject);
  });
}
