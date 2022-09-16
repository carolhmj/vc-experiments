import { ArcRotateCamera } from "@babylonjs/core";
import { Nullable } from "@babylonjs/core/types";
import * as SpeechCommands from "@tensorflow-models/speech-commands";
import "@tensorflow/tfjs-backend-webgl";

// model: https://teachablemachine.withgoogle.com/models/qhl7u7lRL/
import * as checkpointUrl from "./model/model.json";
import * as metadataUrl from "./model/metadata.json";

/**
 * This class utilizes voice recognition commands to manipulate an Babylon ArcRotateCamera
 */
export class ArcRotateCameraVCController {
    private _camera: Nullable<ArcRotateCamera> = null;
    private _recognizer: Nullable<SpeechCommands.SpeechCommandRecognizer> = null; 
    
    constructor(camera: ArcRotateCamera) {
        this._camera = camera;
    }

    public async createModel() {
        const recognizer = SpeechCommands.create(
            "BROWSER_FFT", // fourier transform type, not useful to change
            undefined, // speech commands vocabulary feature, not useful for your models
            checkpointUrl,
            metadataUrl);

        // check that model and metadata are loaded via HTTPS requests.
        recognizer.ensureModelLoaded();

        this._recognizer = recognizer;
    }

    public listen() {
        if (!this._recognizer) {
            console.warn("Recognizer not ready yet!");
            return;
        }

        const classLabels = this._recognizer.wordLabels();
        this._recognizer.listen(async result => {
            const scores = result.scores; // probability of prediction for each class
            console.log('scores', scores);
            // render the probability scores per class
            for (let i = 0; i < classLabels.length; i++) {
                const classPrediction = classLabels[i] + ": " + result.scores[i];
                console.log('classPrediction', classPrediction);
            }
        }, {
            includeSpectrogram: false, // in case listen should return result.spectrogram
            probabilityThreshold: 0.75,
            invokeCallbackOnNoiseAndUnknown: true,
            overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
        }).then(() => {
            console.log("Start recognition");
        });
    }
}