export interface Command {
    action: string;
    modifier?: string;
    value?: any;
}

/**
 * The command processor can be used for things like controlling a camera through voice controls, etc...
 */
export interface CommandProcessor {
    processCommand: (command: Command) => void;
}