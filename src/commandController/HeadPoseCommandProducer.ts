import { CommandProducer } from "./commandProducer";
import { Human } from "@vladmandic/human";
import { Tools } from "@babylonjs/core";
/**
 * This class produces commands based on headpose by using human.js
 */
export class HeadPoseCommandProducer extends CommandProducer {
    private _video: HTMLVideoElement;
    private _stream?: MediaStreamTrack;
    private _human: Human;
    private _runningId?: number;
    private _restingPosition: {
        pitch: number;
        yaw: number;
        numSamples: number;
        calculated: boolean;
    };
    private _numRestingSamples = 3; //minimum samples needed to get the average
    private _timingIntervals = 700; // Interval in ms between sending two batches of transformation
    private _verticalAngleDiff = Tools.ToRadians(20);
    private _horizontalAngleDiff = Tools.ToRadians(20);
    private _verticalAngleChange = Tools.ToRadians(1);
    private _horizontalAngleChange = Tools.ToRadians(1);
    private _videoContainer: HTMLDivElement;

    constructor() {
        super();

        this._restingPosition = {
            pitch: 0,
            yaw: 0,
            numSamples: 0,
            calculated: false,
        };

        const existingVideoContainer = document.getElementById("videoContainer");
        if (existingVideoContainer) {
            this._videoContainer = existingVideoContainer as HTMLDivElement;
        } else {
            this._videoContainer = document.createElement("div");
            this._videoContainer.id = "videoContainer";
            document.body.appendChild(this._videoContainer);
            this._videoContainer.style.position = "absolute";
            this._videoContainer.style.top = "10px";
            this._videoContainer.style.right = "10px";
            this._videoContainer.style.width = "350px";
            this._videoContainer.style.height = "350px";
            this._videoContainer.style.background = "black";
            this._videoContainer.style.display = "flex";
            this._videoContainer.style.alignItems = "center";
            this._videoContainer.style.justifyContent = "center";

            const innerDiv = document.createElement("div");
            innerDiv.id = "innerDiv";
            innerDiv.style.position = "absolute";
            innerDiv.style.width = "100%";
            innerDiv.style.height = "100%";
            innerDiv.style.background = "rgba(111, 111, 111, 0.5)";
            innerDiv.style.zIndex = "100";
            innerDiv.style.display = "flex";
            innerDiv.style.justifyContent = "center";
            innerDiv.style.alignItems = "center";
            this._videoContainer.appendChild(innerDiv);

            const innerDivText = document.createElement("div");
            innerDivText.id =  "innerDivText";
            innerDivText.style.color = "white";
            innerDivText.innerHTML = "WAITING FOR VIDEO";
            innerDiv.appendChild(innerDivText);
        }

        const existingVideo = document.getElementById("headPoseVideo");
        if (existingVideo) {
            this._video = existingVideo as HTMLVideoElement;
        } else {
            this._video = document.createElement("video");
            // document.body.appendChild(this._video);
            this._video.id = "headPoseVideo";
            this._videoContainer.appendChild(this._video);
            this._video.style.width = "100%";
        }

        this._human = new Human({});
    }

    private _accumulateInitialSamples(pitch: number, yaw: number) {
        if (
            this._restingPosition.numSamples < this._numRestingSamples &&
            !this._restingPosition.calculated
        ) {
            this._restingPosition.pitch += pitch;
            this._restingPosition.yaw += yaw;
            this._restingPosition.numSamples += 1;
        } else if (
            this._restingPosition.numSamples >= this._numRestingSamples &&
            !this._restingPosition.calculated
        ) {
            // console.log("more than numsamples");
            this._restingPosition.pitch /= this._restingPosition.numSamples;
            this._restingPosition.yaw /= this._restingPosition.numSamples;
            this._restingPosition.calculated = true;
            console.log(
                "average head position pitch and yaw in degrees",
                Tools.ToDegrees(this._restingPosition.pitch),
                Tools.ToDegrees(this._restingPosition.yaw)
            );
            const overlay = this._videoContainer.children[0] as HTMLElement;
            console.log('overlay', overlay);
            overlay.style.visibility = "hidden";
        }
        return this._restingPosition.calculated;
    }

    private _calculateCommand(pitch: number, yaw: number) {
        const diffPitch = pitch - this._restingPosition.pitch;
        // console.log("diffpitch in degrees", Tools.ToDegrees(diffPitch));
        if (Math.abs(diffPitch) > this._verticalAngleDiff) {
            this._produceCommand({
                action: "rotate",
                modifier: diffPitch < 0 ? "up" : "down",
                value: this._verticalAngleChange
            });
        }
        const diffYaw = yaw - this._restingPosition.yaw;
        // console.log("diffyaw in degrees", Tools.ToDegrees(diffPitch));
        if (Math.abs(diffYaw) > this._horizontalAngleDiff) {
            this._produceCommand({
                action: "rotate",
                modifier: diffYaw > 0 ? "right" : "left",
                value: this._horizontalAngleChange
            });
        }
    }

    _runDetection = () => {
        console.log("start detect");
        // Resting position hasn't been calculated, calculate it with a shorter interval
        if (this._restingPosition.calculated) {
            this._runningId = window.setTimeout(this._runDetection, 100);
        } else {
            this._runningId = window.setTimeout(
                this._runDetection,
                this._timingIntervals
            );
        }
        this._human
            .detect(this._video, {
                face: {
                    enabled: true,
                    detector: { rotation: true },
                    mesh: { enabled: true },
                },
                gesture: {
                    enabled: false,
                },
            })
            .then((result) => {
                if (
                    result.face &&
                    result.face.length > 0 &&
                    result.face[0].rotation?.angle
                ) {
                    const { pitch, yaw } = result.face[0].rotation.angle;
                    const canCalulate = this._accumulateInitialSamples(
                        pitch,
                        yaw
                    );
                    if (canCalulate) {
                        this._calculateCommand(pitch, yaw);
                    }
                }
            });
    };

    public start(): void {
        console.log("start");
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then((stream) => {
                const text = this._videoContainer.children[0].children[0];
                text.innerHTML = "INITIALIZING DETECTION";
                this._video.srcObject = stream;
                this._stream = stream.getVideoTracks()[0];
                this._video.play();
                this._runDetection();
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    public stop(stopCallback?: (() => void) | undefined): void {
        console.log("call stop");
        this._stream?.stop();
        if (this._runningId) {
            console.log("stop detection");
            const overlay = this._videoContainer.children[0] as HTMLElement;
            console.log('overlay', overlay);
            overlay.style.visibility = "visible";
            // cancelAnimationFrame(this._runningId);
            clearTimeout(this._runningId);
        }
        if (stopCallback) {
            stopCallback();
        }
    }
}
