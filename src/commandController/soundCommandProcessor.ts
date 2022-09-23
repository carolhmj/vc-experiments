import { Command, CommandProcessor } from "./commandProcessor";
import {Sound} from "@babylonjs/core";

interface ActionSoundAssociation {
    sound: Sound;
    modifiers?: string[];
    valueTest?: (value: any) => boolean;
    playTime?: number;
}

/**
 * This class can play sound according to commands
 */
export class SoundCommandProcessor implements CommandProcessor {
    private _actionToSound: {[id: string]: ActionSoundAssociation[]} = {};

    linkCommandToSound(sound: Sound, action: string, modifiers?: string[], valueTest?: (value: any) => boolean, playTime?: number) {
        const existingAssociations = this._actionToSound[action];

        if (!existingAssociations) {
            this._actionToSound[action] = [];
        }

        this._actionToSound[action].push({
            sound: sound,
            modifiers,
            valueTest,
            playTime
        });
    }

    /**
     * Play the animation associated with a command
     * @param command 
     */
    processCommand = (command: Command) => {
        const associations = this._actionToSound[command.action];

        if (associations) {
            let idx = 0;
            if (command.modifier || command.value) {
                for (;idx < associations.length; idx++) {
                    const curr = associations[idx];
                    if ((!command.modifier || !curr.modifiers || curr.modifiers.includes(command.modifier)) && (!command.value || !curr.valueTest || curr.valueTest(command.value))) {
                        console.log('found idx', idx);
                        break;
                    }
                }
            }
            if (idx < associations.length) {
                if (associations[idx].playTime) {
                    associations[idx].sound.play(undefined, undefined, associations[idx].playTime);
                } else {
                    associations[idx].sound.play();
                }
            }
        }
    }
}