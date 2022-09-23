# vc-experiments

Experiments in voice controlling cameras utilizing [Babylon.js](https://babylonjs.com), Azure Speech Services, and controlling through gestures with [human.js](https://github.com/vladmandic/human). Supports Arc Rotate Camera and Universal Camera.

Usage:

```javascript
    const vc = new OnlineVoiceControlCommandProducer();
    const cameraProcessor = new UniversalCameraCommandProcessor(camera);

    vc.addProcessor(cameraProcessor);
    scene.onKeyDown = (...) => {
        vc.start(); // Done inside a keyboard event as we need permission from user to listen to mic
...
```

```javascript
    const vc = new HeadPoseCommandProducer();
    const cameraProcessor = new UniversalCameraCommandProcessor(camera);

    vc.addProcessor(cameraProcessor);
    scene.onKeyDown = (...) => {
        vc.start(); // Done inside a keyboard event as to not capture camera from start
...
```

You'll need to add a file `src/commandController/model/modelKey.ts` to grab your Azure API key. The file should have the following format:

```javascript
export const modelKey = "<your api key here>"
```

Project quick-started from [Raanan's amazing starter](https://github.com/RaananW/babylonjs-webpack-es6)