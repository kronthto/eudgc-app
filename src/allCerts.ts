export type Cert = {
  kid: string;
  verifier: any;
};

const certs: Array<Cert> = require('./data/allCertsPrepped.json');

export default certs;
