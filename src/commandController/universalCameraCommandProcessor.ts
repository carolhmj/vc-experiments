import { Tools } from "@babylonjs/core/Misc"
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import {UniversalCamera} from "@babylonjs/core/Cameras/universalCamera";
import { Command, CommandProcessor } from "./commandProcessor";
import {Animation} from "@babylonjs/core/Animations/animation";


/**
 * This class utilizes voice commands to manipulate an Babylon UniversalCamera
 */
export class UniversalCameraCommandProcessor implements CommandProcessor {
    private _camera: UniversalCamera;
    private _rotateStep = Tools.ToRadians(15);
    private _panStep = 1;
    private _animate = true;
    private _animationRate = 60;
    private _animationDuration = 60;
    
    constructor(camera: UniversalCamera) {
        this._camera = camera;
        this._camera.storeState();
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

            const finalTarget = this._camera.position.add(rotatedAxis);
            if (this._animate) {
                Animation.CreateAndStartAnimation("anim", this._camera, "target", this._animationRate, this._animationDuration, this._camera.target, finalTarget, 0);
            } else {
                this._camera.target = finalTarget; 
            }
        }
        if (command.action === ("move") || command.action === ("walk")) {
            let panAmount = this._panStep;
            if (command.value) {
                panAmount = command.value;
            }
            console.log('pan amt', panAmount);
            const finalPan = panAmount * times;
            let finalPosition = new Vector3();
            let finalTarget = new Vector3();
            if (command.modifier === ("left")) {
                finalPosition = this._camera.position.add(this._camera.getDirection(Vector3.Left()).scale(finalPan));
                finalTarget = this._camera.target.add(this._camera.getDirection(Vector3.Left()).scale(finalPan));
            } else if (command.modifier === ("right")) {
                finalPosition = this._camera.position.add(this._camera.getDirection(Vector3.Right()).scale(finalPan));
                finalTarget = this._camera.target.add(this._camera.getDirection(Vector3.Right()).scale(finalPan));
            } else if (command.modifier === ("up")) {
                finalPosition = this._camera.position.add(this._camera.getDirection(Vector3.Up()).scale(finalPan));
                finalTarget = this._camera.target.add(this._camera.getDirection(Vector3.Up()).scale(finalPan));
            } else if (command.modifier === ("down")) {
                finalPosition = this._camera.position.add(this._camera.getDirection(Vector3.Down()).scale(finalPan));
                finalTarget = this._camera.target.add(this._camera.getDirection(Vector3.Down()).scale(finalPan));
            } else if (command.modifier === ("forward")) {
                finalPosition = this._camera.position.add(this._camera.getDirection(Vector3.Forward()).scale(finalPan));
                finalTarget = this._camera.target.add(this._camera.getDirection(Vector3.Forward()).scale(finalPan));
            } else if (command.modifier === ("backward")) {
                finalPosition = this._camera.position.add(this._camera.getDirection(Vector3.Backward()).scale(finalPan));
                finalTarget = this._camera.target.add(this._camera.getDirection(Vector3.Backward()).scale(finalPan));
            }

            if (this._animate) {
                Animation.CreateAndStartAnimation("anim", this._camera, "position", this._animationRate, this._animationDuration, this._camera.position, finalPosition, 0);
                Animation.CreateAndStartAnimation("anim", this._camera, "target", this._animationRate, this._animationDuration, this._camera.target, finalTarget, 0);
            } else {
                this._camera.position = finalPosition;
                this._camera.target = finalTarget;
            }
        }
        if (command.action === "reset") {
            this._camera.restoreState();
        }
    }
}