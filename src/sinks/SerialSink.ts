import SerialPort = require("serialport");
import { Frame } from "../common/frame.interface";
import { BaseSink } from "./BaseSink";



export class SerialSink extends BaseSink {
    port: SerialPort;
    currentlyTransmitting: boolean = false;
    lastTransmit: number = 0;   // ms

    // width & height not actually needed
    constructor(width: number, height: number, protected portName: string, protected baudrate: number, protected minDelay: number = 0) {
        super(width, height);
        setTimeout(() => this.initConnection(), 200); // try to circumvent race condition of port not closing fast enough on baudrate change
    }

    initConnection() {
        this.port = new SerialPort(this.portName, { baudRate: this.baudrate }, (error) => {
            process.stdout.write(`[Serial] Sink inizializing for port '${this.portName}'... `);
            if (error) {
                console.log(`failed! (${error})`);
            }
            else {
                console.log("success!");
            }
        });
        this.port.on('error', (data) => {
            console.log('[Serial] Unhandled error!', data);
        });

    }

    close() {
        if (this.port?.isOpen) {
            this.port.close((error) => {
                console.log(`[Serial] Sink closing for port '${this.portName}' ${error ? error : ''}`);
            });
        }
    }

    portWriteAsync(port: SerialPort, data: string | number[] | Buffer) {
        return new Promise<number>((resolve, reject) => { port.write(data, (err, bytesWritten) => { err ? reject(err) : resolve(bytesWritten) }) });
    }

    portDrainAsync(port: SerialPort) {
        return new Promise<void>((resolve, reject) => { port.drain((err) => { err ? reject(err) : resolve() }) });
    }

    async sendFrame(frame: Frame): Promise<void> {
        if (this.port?.isOpen) {
            if (this.currentlyTransmitting || Date.now() - this.lastTransmit < this.minDelay) {
                console.log(`[Serial] Warning! Dropping frame. Previous write still in progress. Reduce framerate or increase baudrate.`);
                return;
            }

            this.currentlyTransmitting = true;

            try {
                await this.portWriteAsync(this.port, frame.buffer);
                await this.portDrainAsync(this.port);
                this.currentlyTransmitting = false;
                this.lastTransmit = Date.now();
            }
            catch (e) {
                console.log(`[Serial] Unhandled error during write:`, e);
            }
        }
    }
}