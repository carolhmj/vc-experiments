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

/**
 * This class utilizes voice recognition commands to manipulate an Babylon ArcRotateCamera
 */
export class ArcRotateCameraVCController {
    private _camera: Nullable<ArcRotateCamera> = null;
    private _config: any;
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

    private _parseCommands(text: string) {
        // Zoom case
        if (text.startsWith("zoom")) {
            if (text.includes("out")) {
                console.log('zoom out');
                this._camera!.radius += this._zoomStep;
            } else {
                console.log('zoom in');
                this._camera!.radius -= this._zoomStep;
            }
        }
    }

    public createModel() {
        const speechConfig = speechsdk.SpeechConfig.fromSubscription(modelKey, "eastus");
        speechConfig.speechRecognitionLanguage = 'en-US';

        this._config = speechConfig;
    }

    public listen() {
        if (!this._config) {
            console.warn("Recognizer not ready yet!");
            return;
        }
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(this._config, audioConfig);

        recognizer.recognizeOnceAsync((result: any) => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
                // Parse text
                this._parseCommands(result.text.toLowerCase());
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }
            console.log(displayText);
        });
    }
}