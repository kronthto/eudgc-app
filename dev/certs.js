const fetch = require("node-fetch");
const dataP = fetch("https://de.dscg.ubirch.com/trustList/DSC/")
  .then((res) => res.text())
  .then((txt) => {
    let parts = txt.split("\n");
    parts.shift();
    return JSON.parse(parts.join("\n"));
  });
var fs = require("fs");

var execFile = require("child_process").execFile;
var stream = require("stream");

let finCerts = [];
let proms = [];

dataP.then((data) => {
  data.certificates.forEach((cert) => {
    var p1 = new Promise((resolve, reject) => {
      var child = execFile(
        "openssl",
        ["x509", "-noout", "-inform", "der", "-text"],
        function (err, stdout, stderr) {
          if (err) {
            console.log(err);
          }
          if (stderr) {
            console.log(stderr);
          }

          cert.certInfo = stdout;
          resolve();
        }
      );

      var stdinStream = new stream.Readable();

      stdinStream.push(Buffer.from(cert.rawData, "base64"));
      stdinStream.push(null);
      stdinStream.pipe(child.stdin);
    });

    var p2 = new Promise((resolve, reject) => {
      var child2 = execFile(
        "bash",
        [
          "-c",
          "openssl x509 -pubkey -inform der | openssl ec -pubin -noout -text -conv_form uncompressed | grep -E \"^ +.*\" | tr -d ' \n' | sed 's/^...//' | sed 's/./ /96'",
        ],
        function (err, stdout, stderr) {
          if (err) {
            console.log(err);
          }

          if (stdout.length !== 191) {
            console.log(stderr, stdout, cert.kid);
            reject();
          } else {
            let split = stdout.split(" ");
            cert.verifier = {
              // add keyid?
              key: {
                x: split[0].replace(/:/g, ""),
                y: split[1].replace(/:/g, ""),
              },
            };

            resolve();
          }
        }
      );

      var stdinStream2 = new stream.Readable();

      stdinStream2.push(Buffer.from(cert.rawData, "base64"));
      stdinStream2.push(null);
      stdinStream2.pipe(child2.stdin);
    });

    proms.push(
      Promise.all([p1, p2])
        .then(() => {
          delete cert.rawData;
          delete cert.signature;
          finCerts.push(cert);
        })
        .catch(console.error)
    );
  });

  Promise.all(proms).then(() => {
    fs.writeFileSync("./src/data/allCertsPrepped.json", JSON.stringify(finCerts, null, 2));
  });
});
