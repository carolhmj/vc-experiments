import { Tools } from "@babylonjs/core/Misc"
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import {UniversalCamera} from "@babylonjs/core/Cameras/universalCamera";
import { Command, CommandProcessor } from "./commandProcessor";


/**
 * This class utilizes voice commands to manipulate an Babylon UniversalCamera
 */
export class UniversalCameraCommandProcessor implements CommandProcessor {
    private _camera: UniversalCamera;
    private _rotateStep = Tools.ToRadians(15);
    private _panStep = 0.5;
    
    constructor(camera: UniversalCamera) {
        this._camera = camera;
    }

    processCommand(command: Command) {
        console.log('parse commands', command);
        const times = 1;
        if (command.action === ("rotate") || command.action === ("spin") || command.action === ("look")) {
            let rotateAmount = this._rotateStep;
            if (command.value) {
                rotateAmount = command.value;
            }
            console.log('rotate amt', rotateAmount);
            const finalRot = rotateAmount * times;
            const vectorToRotate = this._camera.target.subtract(this._camera.position);
            const len = vectorToRotate.length();
            vectorToRotate.normalize();
            let axisToRotate;
            if (command.modifier === ("left")) {
                axisToRotate = Vector3.Down().scale(finalRot);
            } else if (command.modifier === ("right")) {
                axisToRotate = Vector3.Up().scale(finalRot);
            } else if (command.modifier === ("up")) {
                axisToRotate = Vector3.Left().scale(finalRot);
            } else {
                axisToRotate = Vector3.Right().scale(finalRot);
            }
            
            const rotatedAxis = vectorToRotate.applyRotationQuaternion(Quaternion.FromEulerVector(axisToRotate)).scale(len);

            this._camera.target = this._camera.position.add(rotatedAxis); 
        }
        if (command.action === ("move") || command.action === ("walk")) {
            let panAmount = this._panStep;
            if (command.value) {
                panAmount = command.value;
            }
            console.log('pan amt', panAmount);
            const finalPan = panAmount * times;
            if (command.modifier === ("left")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Left()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Left()).scale(finalPan));
            } else if (command.modifier === ("right")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Right()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Right()).scale(finalPan));
            } else if (command.modifier === ("up")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Up()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Up()).scale(finalPan));
            } else if (command.modifier === ("down")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Down()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Down()).scale(finalPan));
            } else if (command.modifier === ("forward")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Forward()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Forward()).scale(finalPan));
            } else if (command.modifier === ("backward")) {
                this._camera?.position.addInPlace(this._camera.getDirection(Vector3.Backward()).scale(finalPan));
                this._camera?.target.addInPlace(this._camera.getDirection(Vector3.Backward()).scale(finalPan));
            }
        }
    }
}