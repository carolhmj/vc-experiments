import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import {UniversalCamera} from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import {HemisphericLight} from "@babylonjs/core";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import {PBRMaterial} from "@babylonjs/core";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import { KeyboardInfo } from "@babylonjs/core";
import { OnlineVoiceControlCommandProducer } from "../commandController/OnlineVoiceControlCommandProducer";
import { ArcRotateCameraCommandProcessor } from "../commandController/arcRotateCameraCommandProcessor";
import { UniversalCameraCommandProcessor } from "../commandController/universalCameraCommandProcessor";
import { HeadPoseCommandProducer } from "../commandController/HeadPoseCommandProducer";
import {MeshBuilder} from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import {DefaultRenderingPipeline} from "@babylonjs/core";

import skyboxTex from "../../assets/environment/forest.env";
import boxUrl from "../../assets/glb/BoomBox.glb";

import "@babylonjs/loaders/glTF";

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
        // const camera = new UniversalCamera("camera", new Vector3(0, 1.5, 0));
        const camera = new ArcRotateCamera(
            "c",
            2.2,
            1.0,
            5,
            new Vector3(0, 0, 0),
            scene
        );
        camera.upperBetaLimit = 1.5;
        camera.upperRadiusLimit = 8;
        camera.lowerRadiusLimit = 3;
        camera.wheelDeltaPercentage = 10;

        // This targets the camera to scene origin
        camera.setTarget(new Vector3(0, 0, 0));

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const hemisphericLight = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );

        // Default intensity is 1. Let's dim the light a small amount
        hemisphericLight.intensity = 0.7;

        const light = new DirectionalLight(
            "light-dir",
            new Vector3(-1, -1, 5),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        const ground = MeshBuilder.CreateGround("ground", {width:10,height:10});
        const groundMaterial = new PBRMaterial("ground material", scene);
        groundMaterial.metallic = 0.0;
        groundMaterial.roughness = 1.0;
        groundMaterial.albedoTexture = new Texture(grassTextureUrl, scene);
        (groundMaterial.albedoTexture as Texture).uScale = 5;
        (groundMaterial.albedoTexture as Texture).vScale = 5;
        ground.material = groundMaterial;

        const skyBoxTexture = CubeTexture.CreateFromPrefilteredData(skyboxTex, scene);

        const rp = new DefaultRenderingPipeline();
        rp.samples = 4;
        rp.bloomEnabled = true;

        const bb = await SceneLoader.ImportMeshAsync("", "", boxUrl);
        bb.meshes[0].normalizeToUnitCube();
        bb.meshes[0].position.y = 0.5;

        const envHelper = scene.createDefaultEnvironment({
            skyboxTexture: skyBoxTexture,
            environmentTexture: skyBoxTexture,
            createGround: false,
            skyboxSize: 10,
        });
        envHelper!.skyboxMaterial!.primaryColor = new Color3(1,1,1);
       
        // const vc = new OnlineVoiceControlCommandProducer();
        const vc = new HeadPoseCommandProducer();
        
        // const cameraProcessor = new UniversalCameraCommandProcessor(camera);
        const cameraProcessor = new ArcRotateCameraCommandProcessor(camera);

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
