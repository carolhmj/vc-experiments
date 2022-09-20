import { Nullable } from "@babylonjs/core/types";
import { Tools } from "@babylonjs/core/Misc"
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import {UniversalCamera} from "@babylonjs/core/Cameras/universalCamera";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const speechsdk = require('microsoft-cognitiveservices-speech-sdk');

import {modelKey} from "./model/modelKey";

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
 * This class utilizes voice recognition commands to manipulate an Babylon UniversalCamera
 */
export class UniversalCameraVCController {
    private _camera: Nullable<UniversalCamera> = null;
    private _config: any;
    private _recognizer: any;
    private _zoomStep = 1; 
    private _rotateStep = Tools.ToRadians(15);
    private _panStep = 0.5;
    
    constructor(camera: UniversalCamera) {
        this._camera = camera;
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
        if (text.startsWith("rotate") || text.startsWith("spin") || text.startsWith("look")) {
            let rotateAmount = this._rotateStep;
            const matchDegree = text.match(/(left|right|up|down) (by )?(.+) (degrees)?/);
            console.log('match', matchDegree);
            if (matchDegree) {
                rotateAmount = Tools.ToRadians(this._convertNumberString(matchDegree[3]));
            }
            console.log('rotate amt', rotateAmount);
            const finalRot = rotateAmount * times;
            const vectorToRotate = this._camera!.target.subtract(this._camera!.position);
            const len = vectorToRotate.length();
            vectorToRotate.normalize();
            let axisToRotate;
            if (text.includes("left")) {
                axisToRotate = Vector3.Down().scale(finalRot);
            } else if (text.includes("right")) {
                axisToRotate = Vector3.Up().scale(finalRot);
            } else if (text.includes("up")) {
                axisToRotate = Vector3.Left().scale(finalRot);
            } else {
                axisToRotate = Vector3.Right().scale(finalRot);
            }
            
            const rotatedAxis = vectorToRotate.applyRotationQuaternion(Quaternion.FromEulerVector(axisToRotate)).scale(len);

            this._camera!.target = this._camera!.position.add(rotatedAxis); 
        }
        if (text.startsWith("move")) {
            let panAmount = this._panStep;
            const matchAmt = text.match(/(left|right|up|down|forwards|backwards) (by )?(.+) ?/);
            console.log('match', matchAmt);
            if (matchAmt) {
                panAmount = this._convertNumberString(matchAmt[3]);
            }
            console.log('pan amt', panAmount);
            const finalPan = panAmount * times;
            if (text.includes("left")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Left()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Left()).scale(finalPan));
            } else if (text.includes("right")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Right()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Right()).scale(finalPan));
            } else if (text.includes("up")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Up()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Up()).scale(finalPan));
            } else if (text.includes("down")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Down()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Down()).scale(finalPan));
            } else if (text.includes("forward")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Forward()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Forward()).scale(finalPan));
            } else if (text.includes("backward")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Backward()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Backward()).scale(finalPan));
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