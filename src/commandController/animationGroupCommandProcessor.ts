import {AnimationGroup} from "@babylonjs/core";
import { Command, CommandProcessor } from "./commandProcessor";

interface ActionAnimationAssociation {
    animation: AnimationGroup;
    modifiers?: string[];
    valueTest?: (value: any) => boolean;
}

/**
 * This class can play animation groups according to commands
 */
export class AnimationGroupCommandProcessor implements CommandProcessor {
    private _actionToAnimation: {[id: string]: ActionAnimationAssociation[]} = {};

    linkCommandToAnimation(animation: AnimationGroup, action: string, modifiers?: string[], valueTest?: (value: any) => boolean) {
        const existingAssociations = this._actionToAnimation[action];

        if (!existingAssociations) {
            this._actionToAnimation[action] = [];
        }

        this._actionToAnimation[action].push({
            animation,
            modifiers,
            valueTest
        });
    }

    /**
     * Play the animation associated with a command
     * @param command 
     */
    processCommand = (command: Command) => {
        const associations = this._actionToAnimation[command.action];

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
                associations[idx].animation.play();
            }
        }
    }
}