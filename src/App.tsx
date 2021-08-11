import React from "react";
import "./App.css";
import type { BrowserQRCodeReader,IScannerControls } from "@zxing/browser";
import {addCert,getCerts} from './db';
import type {PassData} from './pass';

interface IProps {}

interface IState {
  captureDev: string | null;
  devs: Array<any>;
  done: Boolean;
  saved: Array<PassData>;
  output: string | null;
  img: string | null;
}

class App extends React.Component<IProps, IState> {
  codeReader!: BrowserQRCodeReader;
  vidControls!: IScannerControls;

  constructor(props: any) {
    super(props); 

    this.state = {
      devs: [],
      saved: [],
      captureDev: null,
      done: false,
      output: null,
      img: null,
    };
  }

  componentDidMount() {
    const cbp = import("./miniqr").then((mod) => {
      const BrowserQRCodeReader = mod.default;
      this.codeReader = new BrowserQRCodeReader();

      return () => {
        BrowserQRCodeReader.listVideoInputDevices().then((devs) => {
          this.setState({ devs });
          if (devs.length === 1) {
            let onlyDev = devs[0].deviceId;
            this.startVideoCapture(onlyDev);
          }
        });
      };
    });
    let cb = () => cbp.then((actualcb) => actualcb());

    if ("permissions" in navigator) {
      // todo: use request method once supported
      navigator.permissions.query({ name: "camera" }).then(cb, cb);
    } else {
      cb();
    }

    getCerts().then(certs => {
      this.setState({saved:Object.values(certs)});
    })
  }

  startVideoCapture(deviceId: string) {
    this.setState({ captureDev: deviceId, done:false,img:null });
    this.codeReader.decodeFromVideoDevice(
      deviceId,
      this.refs.vid as HTMLVideoElement,
      (result, error, controls) => {
        this.vidControls = controls;
        if (result !== undefined) {
          import("./process").then((mod) => {
            mod
              .getPayloadBodyFromQR(result)
              .then((pass) => {
                addCert(pass);
                this.setState({
                  output: JSON.stringify(pass, null, 2),
                  done: true,
                });
              })
              .catch((e) => {
                this.setState({ output: e.message });
              });
          });

          controls.stop();
        }
        if (error !== undefined && error.message) {
          this.setState({ output: error.message });
        }
      }
    );
  }

  render() {
    return (
      <div className="App">
        <main>
          {!this.state.captureDev && (
            <div style={{ textAlign: "left" }}>
              Select camera:
              {this.state.devs.map((dev) => (
                <div
                  onClick={() => this.startVideoCapture(dev.deviceId)}
                  style={{ padding: "5px" }}
                >
                  {dev.label}
                </div>
              ))}
              {this.state.devs.length === 0 && (
                <span>No video devices found</span>
              )}
            </div>
          )}
          {!this.state.done && (
            <video ref="vid" style={{ display: "block", width: "100%" }} />
          )}
          {this.state.img &&   <img src={this.state.img} style={{ display: "block", width: "100%" }} />}
          <code
            style={{
              display: "block",
              whiteSpace: "pre-wrap",
              textAlign: "left",
              wordBreak: "break-all",
            }}
          >
            {this.state.output}
          </code>
        </main>
        <hr />
        {this.state.saved.length && <><section>
          Previous scans:
          {this.state.saved.map((cert) => (
            <div
              onClick={() => {
                if (this.vidControls) {
                this.vidControls.stop();
                }
                this.setState({
                  output: JSON.stringify(cert, null, 2),
                  done: true,
                  img: null,
                });
                import('qrcode').then(mod => {
                  mod.toDataURL(cert.properties.rawData).then(url => {
                    this.setState({img:url})
                  })
                })
              }}
              style={{ padding: "5px" }}
            >
              {cert.generic.name} {cert.generic.uvci}
            </div>
          ))}
          </section><hr/></>}
        <section>
          <p style={{ textAlign: "left" }}>
            About: QR-Code-Scanning, verifying and extracting/decoding of
            Covid19 Digital Health Certificates (Digitaler Impfnachweis / EU
            Digital Green Certificate / Impf-Zertifikat) is entirely possible
            only using JavaScript in the Browser sandbox / Web-App, without need
            for a native app and the privacy concerns that come with installing
            that.
          </p>
          <a href="https://github.com/kronthto/eudgc-app">Source</a>
        </section>
        <footer style={{ fontSize: "9px", marginTop: "20px" }}>
          This is a hobby project. Do not rely on this over official
          CovPass/Check apps.
          <br />
          Imprint: Tobias Kronthaler, 86609 Donauwörth, E-Mail: tk@kronthto.de (
          <a href="https://keys.openpgp.org/vks/v1/by-fingerprint/03D9590FF78E0AD0AA354DF1FF9AD1FA6F263700">
            PGP 0x6F263700
          </a>
          )
        </footer>
      </div>
    );
  }
}

export default App;
