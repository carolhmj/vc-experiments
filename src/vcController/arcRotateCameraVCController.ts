import { ArcRotateCamera } from "@babylonjs/core";
import { Nullable } from "@babylonjs/core/types";
import { Tools } from "@babylonjs/core/Misc"
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const speechsdk = require('microsoft-cognitiveservices-speech-sdk');

import {modelKey} from "./model/modelKey";

enum CommandList {
    ZOOM,
    UNRECOGNIZED_COMMAND
}

const numberToStringArray = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine"
];

/**
 * This class utilizes voice recognition commands to manipulate an Babylon ArcRotateCamera
 */
export class ArcRotateCameraVCController {
    private _camera: Nullable<ArcRotateCamera> = null;
    private _config: any;
    private _recognizer: any;
    private _zoomStep = 1; 
    private _rotateStep = Tools.ToRadians(45);
    private _panStep = 0.5;
    
    constructor(camera: ArcRotateCamera) {
        this._camera = camera;
    }

    private _getMainCommand(text: string) {
        if (text.startsWith("zoom")) {
            return CommandList.ZOOM;
        }
        return CommandList.UNRECOGNIZED_COMMAND;
    }

    private _convertNumberString(number: string) {
        console.log('convert number to string', number);
        let parsed = parseFloat(number);
        if (!isNaN(parsed)) {
            return parsed;
        }
        parsed = numberToStringArray.indexOf(number);
        if (parsed < 0) {
            throw new Error("Not a number");
        }
        return parsed;
    }

    private _parseCommands(text: string) {
        console.log('parse commands on text', text);
        // Frequency case
        let times = 1;
        if (text.includes("twice")) {
            times = 2;
        }
        if (text.includes("thrice")) {
            times = 3;
        }
        const matchTimes = text.match(/ ([^ ]+) times/);
        if (matchTimes) {
            times = this._convertNumberString(matchTimes[1]);
        }
        console.log('times repeat', times);
        // Zoom case
        if (text.startsWith("zoom")) {
            const zoomAmt = this._zoomStep * times;
            if (text.includes("out")) {
                console.log('zoom out');
                this._camera!.radius += zoomAmt;
            } else {
                console.log('zoom in');
                this._camera!.radius -= zoomAmt;
            }
        }
        if (text.startsWith("rotate")) {
            let rotateAmount = this._rotateStep;
            const matchDegree = text.match(/(left|right|up|down) (by )?(.+) (degrees)?/);
            console.log('match', matchDegree);
            if (matchDegree) {
                rotateAmount = Tools.ToRadians(this._convertNumberString(matchDegree[3]));
            }
            console.log('rotate amt', rotateAmount);
            const finalRot = rotateAmount * times;
            if (text.includes("left")) {
                this._camera!.alpha -= finalRot;
            } else if (text.includes("right")) {
                this._camera!.alpha += finalRot;
            } else if (text.includes("up")) {
                this._camera!.beta -= finalRot;
            } else {
                this._camera!.beta += finalRot;
            }
        }
        if (text.startsWith("pan")) {
            let panAmount = this._panStep;
            const matchAmt = text.match(/(left|right|up|down) (by )?(.+) ?/);
            console.log('match', matchAmt);
            if (matchAmt) {
                panAmount = this._convertNumberString(matchAmt[3]);
            }
            console.log('rotate amt', panAmount);
            const finalPan = panAmount * times;
            if (text.includes("left")) {
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Left()).scale(finalPan));
            } else if (text.includes("right")) {
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Right()).scale(finalPan));
            } else if (text.includes("up")) {
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Up()).scale(finalPan));
            } else if (text.includes("down")) {
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Down()).scale(finalPan));
            }
        }
    }

    public createModel() {
        const speechConfig = speechsdk.SpeechConfig.fromSubscription(modelKey, "eastus");
        speechConfig.speechRecognitionLanguage = 'en-US';

        this._config = speechConfig;

    }

    private _treatText(text: string) {
        return text.toLowerCase().replace(/[!?.,:;]/, "");
    }
    
    public startListening(listenCallback?: () => void) {
        if (!this._config) {
            console.warn("Config not ready yet!");
            return;
        }
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        this._recognizer = new speechsdk.SpeechRecognizer(this._config, audioConfig);
        console.log('start recognizer');
        this._recognizer.startContinuousRecognitionAsync(() => {
            console.log('start recognition')
        }, (err: string) => {
            console.error("Error on recognition", err);
        });

        this._recognizer.speechStartDetected = (a: any, b: any) => {
            console.log('speech started event');
        }
        this._recognizer.speechEndDetected = (a: any, b: any) => {
            console.log('speech end detected');
        }
        this._recognizer.recognizing = (a: any, b: any) => {
            console.log('recognizing');
        }
        this._recognizer.recognized = (a: any, b: any) => {
            const text = b?.privResult?.privText;
            if (text) {
                console.log("Recognized text", text);
                try {
                    this._parseCommands(this._treatText(text));
                    if (listenCallback) {
                        listenCallback();
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            
        }
    }

    public stopListening(callback: () => void) {
        if (!this._recognizer) {
            console.warn("Recognizer not ready yet!");
            return;
        }
        this._recognizer.stopContinuousRecognitionAsync(() => {
            console.log("Stopped recognition");
            if (callback) {
                callback();
            }
        }, (err: string) => {
            console.error("Error on stop recognition", err);
        })
    }
}