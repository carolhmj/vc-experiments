# vc-experiments

Experiments in voice controlling camera utilizing [Babylon.js](https://babylonjs.com) and Azure Speech Services. Currently only Arc Rotate Camera is supported.

Usage:

```javascript
const controller = new ArcRotateCameraVCController(camera);

controller.createModel();

scene.onKeyboardObservable.add((keyInfo: KeyboardInfo) => {
    // Start listening on enter
    if (keyInfo.event.key === "Enter") {
        console.log('start listening');
        controller.listen();
    }
});
```

You'll need to add a file `src/vcController/model/modelKey.ts` to grab your Azure API key. The file should have the following format:

```javascript
export const modelKey = "<your api key here>"
```

Project quick-started from [Raanan's amazing starter](https://github.com/RaananW/babylonjs-webpack-es6)