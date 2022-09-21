import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import {UniversalCamera} from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import { KeyboardInfo } from "@babylonjs/core";
import { OnlineVoiceControlCommandProducer } from "../commandController/OnlineVoiceControlCommandProducer";
import { ArcRotateCameraCommandProcessor } from "../commandController/arcRotateCameraCommandProcessor";
import { UniversalCameraCommandProcessor } from "../commandController/universalCameraCommandProcessor";
import { HeadPoseCommandProducer } from "../commandController/HeadPoseCommandProducer";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then((_values) => {
            console.log(_values);
            // scene.debugLayer.show({
            //     handleResize: true,
            //     overlay: true,
            //     globalRoot: document.getElementById("#root") || undefined,
            // });
        });

        // This creates and positions a free camera (non-mesh)
        // const camera = new ArcRotateCamera(
        //     "my first camera",
        //     0,
        //     Math.PI / 3,
        //     10,
        //     new Vector3(0, 0, 0),
        //     scene
        // );
        const camera = new UniversalCamera("camera", new Vector3(0, 1, -10));

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        // const light = new HemisphericLight(
        //     "light",
        //     new Vector3(0, 1, 0),
        //     scene
        // );

        // // Default intensity is 1. Let's dim the light a small amount
        // light.intensity = 0.7;

        // Our built-in 'sphere' shape.
        const sphere = CreateSphere(
            "sphere",
            { diameter: 2, segments: 32 },
            scene
        );

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape.
        const ground = CreateGround(
            "ground",
            { width: 6, height: 6 },
            scene
        );

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        const shadowGenerator = new ShadowGenerator(512, light)
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        shadowGenerator.setDarkness(0.2);

        shadowGenerator.getShadowMap()!.renderList!.push(sphere);

        // const vc = new OnlineVoiceControlCommandProducer();
        const vc = new HeadPoseCommandProducer();
        
        // const cameraProcessor = new ArcRotateCameraCommandProcessor(camera);
        const cameraProcessor = new UniversalCameraCommandProcessor(camera);

        vc.addProcessor(cameraProcessor);
        
        let listening = false;
        let lastStateToggle = Date.now();

        const keyListen = (keyInfo: KeyboardInfo) => {
            const canChangeState = Date.now() - lastStateToggle > 1000;
            if (keyInfo.event.key === "Enter" && canChangeState && !listening) {
                listening = true;
                console.log('start listening');
                vc.start();
                lastStateToggle = Date.now();
            } else if (keyInfo.event.key === "Enter" && canChangeState && listening) {
                vc.stop(() => {
                    listening = false;
                    console.log('stop listening');
                    lastStateToggle = Date.now();
                });
            }
        }
        const keyListenObserver = scene.onKeyboardObservable.add(keyListen);

        return scene;
    };
}

export default new DefaultSceneWithTexture();
