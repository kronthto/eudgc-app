import type {PassData} from './pass'

let dbP : Promise<Storage> = new Promise((resolve,reject) => {
  if (typeof window === 'undefined') {
    return reject('Node');
  }
  resolve(window.localStorage);
});

let getCerts = (): Promise<Record<string,PassData>> => {
  return dbP.then(db => {
    let stored = db.getItem('certs');
    if (!stored) {
      return {}
    }
    return JSON.parse(stored)
  })
};

let addCert = async (cert: PassData) => {
  let certs = await getCerts();
  certs[cert.generic.uvci] = cert;
  localStorage.setItem('certs',JSON.stringify(certs));
}

export {dbP,getCerts,addCert};
