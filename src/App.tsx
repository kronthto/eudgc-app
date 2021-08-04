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
    BrowserQRCodeReader.listVideoInputDevices().then((devs) => {
      this.setState({ devs });
      if (devs.length === 1) {
        let onlyDev = devs[0].deviceId;
        this.startVideoCapture(onlyDev);
      }
    });
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
            <div>
              {this.state.devs.map((dev) => (
                <div onClick={() => this.startVideoCapture(dev.deviceId)} style={{padding: '5px'}}>
                  {dev.label}
                </div>
              ))}
            </div>
          )}
          {!this.state.done && <video ref="vid" style={{ display: "block", width:'100%' }} />}
          <code style={{ display: "block", whiteSpace: "pre-wrap",textAlign:'left',wordBreak:'break-all' }}>
            {this.state.output}
          </code>
        </main>
        <footer>
          Imprint: Tobias Kronthaler, 86609 Donauwörth, tk@kronthto.de - Source:
          ..
        </footer>
      </div>
    );
  }
}

export default App;
