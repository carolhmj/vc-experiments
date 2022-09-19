import { ArcRotateCamera } from "@babylonjs/core";
import { Nullable } from "@babylonjs/core/types";
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

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
    }

    public createModel() {
        const speechConfig = speechsdk.SpeechConfig.fromSubscription(modelKey, "eastus");
        speechConfig.speechRecognitionLanguage = 'en-US';

        this._config = speechConfig;

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
                    this._parseCommands(text.toLowerCase());
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