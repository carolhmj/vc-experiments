import { CommandProducer} from "./commandProducer";
import { Command } from "./commandProcessor";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const speechsdk = require('microsoft-cognitiveservices-speech-sdk');

import {modelKey} from "./model/modelKey";
import { Tools } from "@babylonjs/core";

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

export class OnlineVoiceControlCommandProducer extends CommandProducer {
    private _config: any;
    private _recognizer: any;

    constructor() {
        super();

        const speechConfig = speechsdk.SpeechConfig.fromSubscription(modelKey, "eastus");
        speechConfig.speechRecognitionLanguage = 'en-US';

        this._config = speechConfig;
    }

    /**
     * Extracts a value from text
     * @param textWithValue 
     */
    private _parseValue(textWithValue: string) {
        const valueMatch = textWithValue.match(/(by )?(one|two|three|four|five|six|seven|eight|nine|\d+)( \w+)?/);
        console.log('value match', valueMatch);
        if (valueMatch) {
            // The second group is the numeric value, the third is a possible unit
            const stringVal = valueMatch[2];
            let val = numberToStringArray.indexOf(stringVal);
            if (val < 0) {
                val = parseFloat(stringVal);
            }
            // Convert unit if we have one
            let unit = valueMatch[3];
            if (unit) {
                unit = unit.trim();
            }
            if (unit === "degrees") {
                val = Tools.ToRadians(val);
            }
            return val;
        }
        return undefined;
    }

    private _parseCommands(text: string) : Command[] {
        // COMMANDS CAN BE BROKEN BY "AND"
        const andClauses = text.split("and");
        // A voice command will be defined by ACTION MODIFIER VALUE
        // ACTION is something like look, move, stop, attack, modifier is something like down, up, running, etc, value is something like 15 degrees, etc
        const parsed: Command[] = [];

        for (const clause of andClauses) {
            const structure = clause.match(/(\w+) (\w+)?(.*)/);
            console.log('structure match', structure);

            if (structure && structure.length > 1) {
                const action = structure[1];
                const modifier = structure[2];
                const value = this._parseValue(structure[3]);
                parsed.push({action, modifier, value});
            }
        }

        return parsed;
    }

    private _treatText(text: string) {
        return text.toLowerCase().replace(/[!?.,:;]/, "");
    }

    public start(): void {
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
                    const commands = this._parseCommands(this._treatText(text));
                    for (const processor of this._processors) {
                        for (const command of commands) {
                            processor.processCommand(command);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            
        }
    }

    public stop(stopCallback?: (() => void) | undefined): void {
        if (!this._recognizer) {
            console.warn("Recognizer not ready yet!");
            return;
        }
        this._recognizer.stopContinuousRecognitionAsync(() => {
            console.log("Stopped recognition");
            if (stopCallback) {
                stopCallback();
            }
        }, (err: string) => {
            console.error("Error on stop recognition", err);
        })
    }
}