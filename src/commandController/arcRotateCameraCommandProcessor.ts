import { ArcRotateCamera } from "@babylonjs/core";
import { Tools } from "@babylonjs/core/Misc"
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CommandProcessor, Command } from "./commandProcessor";

/**
 * This class receives commands to control arcrotatecamera
 */
export class ArcRotateCameraCommandProcessor implements CommandProcessor {
    private _camera: ArcRotateCamera;
    
    private _zoomStep = 1; 
    private _rotateStep = Tools.ToRadians(45);
    private _panStep = 0.5;
    
    constructor(camera: ArcRotateCamera) {
        this._camera = camera;
    }

    processCommand(command: Command) {
        console.log('parse commands on text', command);
        // Frequency case
        const times = 1;
        console.log('times repeat', times);
        // Zoom case
        if (command.action === "zoom") {
            const zoomAmt = this._zoomStep * times;
            if (command.modifier === "out") {
                console.log('zoom out');
                this._camera.radius += zoomAmt;
            } else {
                console.log('zoom in');
                this._camera.radius -= zoomAmt;
            }
        }
        if (command.action === ("rotate") || command.action === ("spin") || command.action === ("look")) {
            let rotateAmount = this._rotateStep;
            if (command.value) {
                rotateAmount = command.value;
            }
            const finalRot = rotateAmount * times;
            console.log(finalRot);
            if (command.modifier === ("left")) {
                this._camera.alpha -= finalRot;
            } else if (command.modifier === ("right")) {
                this._camera.alpha += finalRot;
            } else if (command.modifier === ("up")) {
                this._camera.beta -= finalRot;
            } else {
                this._camera.beta += finalRot;
            }
        }
        if (command.action === ("pan") || command.action === ("move")) {
            let panAmount = this._panStep;
            if (command.value) {
                panAmount = command.value;
            }
            console.log('pan amt', panAmount);
            const finalPan = panAmount * times;
            if (command.modifier === ("left")) {
                this._camera.target.addInPlace(this._camera.getDirection(Vector3.Left()).scale(finalPan));
            } else if (command.modifier === ("right")) {
                this._camera.target.addInPlace(this._camera.getDirection(Vector3.Right()).scale(finalPan));
            } else if (command.modifier === ("up")) {
                this._camera.target.addInPlace(this._camera.getDirection(Vector3.Up()).scale(finalPan));
            } else if (command.modifier === ("down")) {
                this._camera.target.addInPlace(this._camera.getDirection(Vector3.Down()).scale(finalPan));
            }
        }
    }
}