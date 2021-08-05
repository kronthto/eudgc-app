import React from "react";
import "./App.css";
import { BrowserQRCodeReader } from "@zxing/browser";

import {getPayloadBodyFromQR} from './process'
import {PassData} from './pass';

interface IProps {
}

interface IState {
  captureDev: string | null;
  devs: Array<any>;
  done: Boolean;
  output: string | null;
}

class App extends React.Component<IProps, IState> {
  codeReader!: BrowserQRCodeReader;

  constructor(props: any) {
    super(props);

    this.state = {
      devs: [],
      captureDev: null,
      done: false,
      output: null,
    };
  }

  componentDidMount() {
    this.codeReader = new BrowserQRCodeReader();

        let cb = () => {
          BrowserQRCodeReader.listVideoInputDevices().then((devs) => {
            this.setState({ devs });
            if (devs.length === 1) {
              let onlyDev = devs[0].deviceId;
              this.startVideoCapture(onlyDev);
            }
          });
        }

        if ('permissions' in navigator) {
          navigator.permissions.query({name: 'camera'}).then(cb,cb)
        } else {
          cb();
        }
  }

  startVideoCapture(deviceId:string) {
    this.setState({ captureDev: deviceId });
    this.codeReader.decodeFromVideoDevice(
      deviceId,
      (this.refs.vid as HTMLVideoElement),
      (result, error, controls) => {
        if (result !== undefined) {
          getPayloadBodyFromQR(result)
            .then(function (payloadBody) {
              return PassData.generatePass(payloadBody);
            })
            .then((pass) => {
              this.setState({ output: pass, done: true });
            })
            .catch((e) => {
              this.setState({ output: e.message });
            });

          controls.stop();
        }
        if (error !== undefined) {
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
            <div style={{textAlign:'left'}}>
            Select camera:
              {this.state.devs.map((dev) => (
                <div onClick={() => this.startVideoCapture(dev.deviceId)} style={{padding: '5px'}}>
                  {dev.label}
                </div>
              ))}
              {this.state.devs.length === 0 && <span>No video devices found</span>}
            </div>
          )}
          {!this.state.done && <video ref="vid" style={{ display: "block", width:'100%' }} />}
          <code style={{ display: "block", whiteSpace: "pre-wrap",textAlign:'left',wordBreak:'break-all' }}>
            {this.state.output}
          </code>
        </main>
        <hr/>
        <section>
        <p style={{textAlign:'left'}}>About: Scanning, verifying and extracting/decoding of Covid19 Digital Health Certificates (Digitaler Impfnachweis / EU Digital Green Certificate) is entirely possible only using JavaScript in the Browser sandbox, without need for a native app and the privacy concerns that come with installing that.</p>
        <a href="https://github.com/kronthto/eudgc-app">Source</a>
        </section>
        <footer style={{fontSize:'9px',marginTop:'20px'}}>
        This is a hobby project. Do not rely on this over official CovPass/Check apps.<br/>
          Imprint: Tobias Kronthaler, 86609 Donauwörth, E-Mail: tk@kronthto.de (<a href="https://keys.openpgp.org/vks/v1/by-fingerprint/03D9590FF78E0AD0AA354DF1FF9AD1FA6F263700">PGP 0x6F263700</a>)
        </footer>
      </div>
    );
  }
}

export default App;
