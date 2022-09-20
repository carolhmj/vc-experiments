/**
 * A command is something used to give instructions to be executed
 */

import { CommandProcessor } from "./commandProcessor";


/**
 * A CommandProducer is a class that issues commands used to control an object through the CommandController.
 * These commands can be issued through speech, gesture recognition, etc...
 */
export class CommandProducer {
    protected _processors: CommandProcessor[] = [];

    addProcessor(processor: CommandProcessor) {
        if (this._processors.indexOf(processor) < 0) {
            this._processors.push(processor);
        } 
    }

    removeProcessor(processor: CommandProcessor) {
        const idx = this._processors.indexOf(processor);
        if (idx >= 0) {
            this._processors.splice(idx, 1);
        }
    }

    /**
     * The start function will start generating the commands
     * and passing them to the processors
     * Each derived class will implement its own way of issuing commands
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public start() {

    }

    /**
     * The stop function will stop issuing commands and call stopCallback once this is done
     * @param stopCallback 
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public stop(stopCallback?: () => void) {
        
        if (stopCallback) {
            stopCallback();
        }
    }
}