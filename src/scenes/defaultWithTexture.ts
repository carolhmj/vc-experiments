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
import {MeshBuilder} from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import {DefaultRenderingPipeline} from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import {Sound} from "@babylonjs/core";

import skyboxTex from "../../assets/environment/forest.env";
import grassOpac from "../../assets/Dot.png";
import grassn from "../../assets/grassn.png";
import eagle from "../../assets/glb/Eagle.glb";
import footsteps from "../../assets/footsteps.mp3";

import "@babylonjs/loaders/glTF";
import { SoundCommandProcessor } from "../commandController/soundCommandProcessor";

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
            scene.debugLayer.show({
                handleResize: true,
                overlay: true,
                globalRoot: document.getElementById("#root") || undefined,
            });
        });

        // This creates and positions a free camera (non-mesh)
        const camera = new UniversalCamera("camera", new Vector3(0, 1.5, 0));
        const camera2 = new ArcRotateCamera(
            "spy",
            0,
            Math.PI / 3,
            10,
            new Vector3(0, 0, 0),
            scene
        );

        // This targets the camera to scene origin
        camera.setTarget(new Vector3(0, 1.5, 1));

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

        // Our built-in 'ground' shape.
        const ground = CreateGround(
            "ground",
            { width: 100, height: 100 },
            scene
        );

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);
        (groundMaterial.diffuseTexture as Texture).uScale = 10;
        (groundMaterial.diffuseTexture as Texture).vScale = 10;
        groundMaterial.bumpTexture = new Texture(grassn, scene);
        (groundMaterial.bumpTexture as Texture).uScale = 10;
        (groundMaterial.bumpTexture as Texture).vScale = 10;
        groundMaterial.opacityTexture = new Texture(grassOpac, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new DirectionalLight(
            "light-dir",
            new Vector3(-1, -1, 5),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        const shadowGenerator = new ShadowGenerator(512, light)
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        shadowGenerator.setDarkness(0);

        const skyBoxTexture = CubeTexture.CreateFromPrefilteredData(skyboxTex, scene);

        const skybox = MeshBuilder.CreateBox("skyBox", { size: 100.0 }, scene);
        const skyboxMaterial = new StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = skyBoxTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        const rp = new DefaultRenderingPipeline();
        rp.samples = 4;
        rp.bloomEnabled = true;

        const eaglesResult = await SceneLoader.ImportMeshAsync("", "", eagle);

        const eaglesAnims = eaglesResult.animationGroups;
        
        const eagleRoot = eaglesResult.meshes[0];
        const eagleBase = eaglesResult.meshes[1] as Mesh;

        const eagleMat = new StandardMaterial("eagleMat");
        eagleMat.diffuseColor = Color3.FromHexString("#5A3D00");
        eagleMat.specularColor = Color3.Black();
        eagleBase.material = eagleMat;
        
        const nEagles = 100;
        
        // range -rng rng
        function randomFullRange(rng: number) {
            return (Math.random()-0.5)*2.0*rng;
        }

        // range 0 rng
        function randomZeroRange(rng:number) {
            return Math.random()*rng;
        }
        
        for (let i = 0; i < nEagles; i++) {
            const eagleInst = eagleRoot.clone("e"+i, null);
            eagleInst!.scaling = new Vector3(0.1, 0.1, 0.1);
            eagleInst!.position = new Vector3(randomFullRange(40), 3-randomFullRange(1.5), 20 + randomZeroRange(10));
            (eagleInst as any)!.speed = Math.random()*0.02+0.01;
            (eagleInst as any)!.maxPos = 10 + randomZeroRange(10);
            scene.onBeforeRenderObservable.add(() => {
                eagleInst!.position.z -= (eagleInst as any)!.speed;
                if (eagleInst!.position.z < -(eagleInst as any)!.maxPos) {
                    eagleInst!.position.z = (eagleInst as any)!.maxPos;
                } 
            });
        }
        
        eagleRoot.isVisible = false;
        eagleBase.isVisible = false;
        eaglesAnims[0].stop();
        eaglesAnims[1].start(true);

        const vc = new OnlineVoiceControlCommandProducer();
        
        const cameraProcessor = new UniversalCameraCommandProcessor(camera);

        const stepSound = new Sound("footsteps", footsteps);
        const soundProc = new SoundCommandProcessor();
        soundProc.linkCommandToSound(stepSound, "move", undefined, undefined, 1);

        vc.addProcessor(cameraProcessor);
        vc.addProcessor(soundProc);
        
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
