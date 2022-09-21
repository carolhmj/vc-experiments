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
    private _numRestingSamples = 15; //minimum samples needed to get the average

    private _batchTransformation: {
        totalPitchChange: number;
        totalYawChange: number;
        stage: "accumulating" | "waiting to send" | "sent";
        lastSent: number;
    };
    private _batchIntervals = 1000; // Interval in ms between sending two batches of transformation

    constructor() {
        super();

        this._restingPosition = {
            pitch: 0,
            yaw: 0,
            numSamples: 0,
            calculated: false,
        };

        this._batchTransformation = {
            totalPitchChange: 0,
            totalYawChange: 0,
            stage: "accumulating",
            lastSent: Date.now(),
        };

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
            console.log("more than numsamples");
            this._restingPosition.pitch /= this._restingPosition.numSamples;
            this._restingPosition.yaw /= this._restingPosition.numSamples;
            this._restingPosition.calculated = true;
            console.log(
                "average head position pitch and yaw",
                this._restingPosition.pitch,
                this._restingPosition.yaw
            );
        }
        return this._restingPosition.calculated;
    }

    private _accumulateBatch(pitch: number, yaw: number) {
        const pitchDiffLim = Tools.ToRadians(25);
        const yawDiffLim = Tools.ToRadians(30);
        const rotValue = Tools.ToRadians(5);

        const distPitch = pitch - this._restingPosition.pitch;
        console.log("diffpitch in degrees", Tools.ToDegrees(distPitch));
        console.log("diffpitch in degrees", Tools.ToDegrees(distPitch));
        if (
            Math.abs(distPitch) > pitchDiffLim &&
            this._batchTransformation.stage === "accumulating"
        ) {
            this._batchTransformation.totalPitchChange += distPitch;
        }
        const diffYaw = yaw - this._restingPosition.yaw;
        if (
            Math.abs(diffYaw) > yawDiffLim &&
            this._batchTransformation.stage === "accumulating"
        ) {
            this._batchTransformation.totalYawChange += diffYaw;
        }

        if (
            Date.now() - this._batchTransformation.lastSent >
            this._batchIntervals
        ) {
            this._batchTransformation.stage = "waiting to send";
        }
        // returns if the batch can be sent
        return this._batchTransformation.stage === "waiting to send";
    }

    private _sendBatch() {
        const batch = this._batchTransformation;
        console.log('batch', batch.totalPitchChange, batch.totalYawChange);
        if (Math.abs(batch.totalPitchChange) > 0) {
            this._produceCommand({
                action: "rotate",
                modifier: batch.totalPitchChange < 0 ? "up" : "down",
                // value: Math.abs(batch.totalPitchChange),
            });
        }
        // this._produceCommand({
        //     action: "rotate",
        //     modifier: batch.totalYawChange < 0 ? "left" : "right",
        //     value: Math.abs(batch.totalYawChange)*0.01,
        // });

        this._batchTransformation = {
            totalPitchChange: 0,
            totalYawChange: 0,
            stage: "accumulating",
            lastSent: Date.now(),
        };
    }

    _runDetection = () => {
        console.log("start detect");
        this._human
            .detect(this._video, {
                face: {
                    enabled: true,
                    detector: { rotation: true },
                    mesh: { enabled: true },
                },
            })
            .then((result) => {
                // console.log('human detect result', result);
                this._runningId = requestAnimationFrame(this._runDetection);
                // console.log('gestures:', result.gesture.map(g => g.gesture).join(","))
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
                    // Accumulate resting position samples
                    if (canCalulate) {
                        const canSendBatch = this._accumulateBatch(pitch, yaw);
                        if (canSendBatch) {
                            this._sendBatch();
                        }
                    }
                }
            });
    };

    public start(): void {
        console.log("start");
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then((stream) => {
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
            cancelAnimationFrame(this._runningId);
        }
        if (stopCallback) {
            stopCallback();
        }
    }
}
