import { CommandProducer } from "./commandProducer";
import {Human} from "@vladmandic/human";
import { Tools } from "@babylonjs/core";
/**
 * This class produces commands based on headpose by using human.js
 */
export class HeadPoseCommandProducer extends CommandProducer {
    private _video: HTMLVideoElement;
    private _stream?: MediaStreamTrack;
    private _human: Human;
    private _runningId?: number;

    constructor() {
        super();

        const existingVideo = document.getElementById("headPoseVideo");
        if (existingVideo) {
            this._video = existingVideo as HTMLVideoElement;
        } else {
            this._video = document.createElement("video");
            document.body.appendChild(this._video);
            this._video.id = "headPoseVideo";
            this._video.style.position = "absolute";
            this._video.style.top = "10px";
            this._video.style.right = "10px";
            this._video.style.width = "350px";
            this._video.style.height = "350px";
        }

        this._human = new Human({});
    }

    _runDetection = () => {
        console.log('start detect');
        this._human.detect(this._video, {
            face: {
                enabled: true,
                detector: {rotation: true},
                mesh: {enabled: true}
            }
        }).then((result) => {
            // console.log('human detect result', result);
            this._runningId = requestAnimationFrame(this._runDetection);
            // console.log('gestures:', result.gesture.map(g => g.gesture).join(","))
            if (result.face && result.face.length > 0 && result.face[0].rotation?.angle) {
                const {pitch, yaw} = result.face[0].rotation.angle;
                console.log('pitch', pitch, 'yaw', yaw);
                const pitchLim = Tools.ToRadians(30);
                const yawLim = Tools.ToRadians(30);
                const rotValue = Tools.ToRadians(5);
                if (Math.abs(yaw) > yawLim) {
                    console.log('rotate', yaw > 0 ? "left" : "right");
                    // this._processCommand({
                    //     action: "rotate",
                    //     modifier: yaw > 0 ? "left" : "right",
                    //     value: rotValue
                    // });
                } else if (Math.abs(pitch) > pitchLim) {
                    console.log('rotate', pitch > 0 ? "up" : "down");
                    // this._processCommand({
                    //     action: "rotate",
                    //     modifier: pitch > 0 ? "up" : "down",
                    //     value: rotValue
                    // });
                } 
            }
        });
    }
    
    public start(): void {
        navigator.mediaDevices.getUserMedia({video: true, audio: false}).then((stream) => {
            this._video.srcObject = stream;
            this._stream = stream.getVideoTracks()[0];
            this._video.play();
            this._runDetection();
        }).catch((error) => {
            console.error("Error:", error);
        })
    }

    public stop(stopCallback?: (() => void) | undefined): void {
        console.log('call stop');
        this._stream?.stop();
        if (this._runningId) {
            console.log('stop detection');
            cancelAnimationFrame(this._runningId);
        }
        if (stopCallback) {
            stopCallback();
        }
    }
}