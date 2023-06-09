import Dude from "./Dude.js";
import { Ninja } from "./Ninja.js";

let canvas;
let engine;
let scene;
window.onload = startGame;

function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();

    // enable physics
    scene.enablePhysics();

    // modify some default settings (i.e pointer events to prevent cursor to go
    // out of the game window)
    modifySettings();

    let tank = scene.getMeshByName("heroTank");

    scene.toRender = () => {
        let deltaTime = engine.getDeltaTime(); // remind you something ?

        tank.move();
        tank.fireCannonBalls(); // will fire only if space is pressed !
        tank.fireLasers(); // will fire only if l is pressed !

        moveHeroDude();
        moveHeroDude2();
        moveOtherDudes();

        scene.render();
    };

    //engine.runRenderLoop();
    // instead of running the game, we tell instead the asset manager to load.
    // when finished it will execute its onFinish callback that will run the loop
    scene.assetsManager.load();
}

function createScene() {
    let scene = new BABYLON.Scene(engine);

    scene.assetsManager = configureAssetManager(scene);

    let ground = createGround(scene);
    //let freeCamera = createFreeCamera(scene);

    loadTank(scene);

    let tank = createTank(scene);

    // second parameter is the target to follow
    scene.followCameraTank = createFollowCamera(scene, tank);
    scene.activeCamera = scene.followCameraTank;

    createLights(scene);

    createHeroDude(scene); // we added the creation of a follow camera for the dude

    createHeroDude2(scene);

    loadSounds(scene);

    return scene;
}

function configureAssetManager(scene) {
    // useful for storing references to assets as properties. i.e scene.assets.cannonsound, etc.
    scene.assets = {};

    let assetsManager = new BABYLON.AssetsManager(scene);

    assetsManager.onProgress = function(
        remainingCount,
        totalCount,
        lastFinishedTask
    ) {
        engine.loadingUIText =
            "We are loading the scene. " +
            remainingCount +
            " out of " +
            totalCount +
            " items still need to be loaded.";
        console.log(
            "We are loading the scene. " +
            remainingCount +
            " out of " +
            totalCount +
            " items still need to be loaded."
        );
    };

    assetsManager.onFinish = function(tasks) {
        engine.runRenderLoop(function() {
            scene.toRender();
        });
    };

    return assetsManager;
}

function loadTank(scene) {
    let meshTask = scene.assetsManager.addMeshTask(
        "tank task",
        "",
        "models/Dude2/",
        "Run.glb",
    );

    meshTask.onSuccess = function(task) {
        let t = task.loadedMeshes[0];
        t.name = "heroTank";
        console.log("tank loaded " + t);
    }
}

function loadSounds(scene) {
    var assetsManager = scene.assetsManager;

    var binaryTask = assetsManager.addBinaryFileTask("laserSound", "sounds/laser.wav");
    binaryTask.onSuccess = function(task) {
        scene.assets.laserSound = new BABYLON.Sound("laser", task.data, scene, null, { loop: false, spatialSound: true });
    };

    binaryTask = assetsManager.addBinaryFileTask("cannonSound", "sounds/cannonBlast.mp3");
    binaryTask.onSuccess = function(task) {
        scene.assets.cannonSound = new BABYLON.Sound(
            "cannon",
            task.data,
            scene,
            null, { loop: false, spatialSound: true }
        );
    };

    binaryTask = assetsManager.addBinaryFileTask("dieSound", "sounds/dying.wav");
    binaryTask.onSuccess = function(task) {
        scene.assets.dieSound = new BABYLON.Sound("die", task.data, scene, null, {
            loop: false,
            spatialSound: true
        });
    };

    binaryTask = assetsManager.addBinaryFileTask("gunSound", "sounds/shot.wav");
    binaryTask.onSuccess = function(task) {
        scene.assets.gunSound = new BABYLON.Sound("gun", task.data, scene, null, {
            loop: false,
        });
    };

    binaryTask = assetsManager.addBinaryFileTask("explosion", "sounds/explosion.mp3");
    binaryTask.onSuccess = function(task) {
        scene.assets.explosion = new BABYLON.Sound(
            "explosion",
            task.data,
            scene,
            null, { loop: false, spatialSound: true }
        );
    };

    binaryTask = assetsManager.addBinaryFileTask("pirates", "sounds/pirateFun.mp3");
    binaryTask.onSuccess = function(task) {
        scene.assets.pirateMusic = new BABYLON.Sound(
            "piratesFun",
            task.data,
            scene,
            null, {
                loop: true,
                autoplay: true,
            }
        );
    };
}

function loadCrossHair(scene) {
    var crossHair = new BABYLON.Mesh.CreateBox("crossHair", .1, scene);
    crossHair.parent = scene.freeCameraDude;
    //console.log("minZ is " + scene.freeCameraDude.minZ);
    //  scene.freeCameraDude.minZ = .1;
    //  crossHair.position.z += 0.2;
    crossHair.position.z += 2;

    // strange....?
    //impact.position.y -= scene.freeCameraDude.ellipsoidOffset.y;
    crossHair.material = new BABYLON.StandardMaterial("crossHair", scene);
    crossHair.material.diffuseTexture = new BABYLON.Texture("images/gunaims.png", scene);
    crossHair.material.diffuseTexture.hasAlpha = true;
    crossHair.isPickable = false;
}

function createGround(scene) {
    const groundOptions = {
        width: 2000,
        height: 2000,
        subdivisions: 20,
        minHeight: 0,
        maxHeight: 100,
        onReady: onGroundCreated,
    };
    //scene is optional and defaults to the current scene
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
        "gdhm",
        "images/hmap2.jpg",
        groundOptions,
        scene
    );

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial(
            "groundMaterial",
            scene
        );
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/grass.jpg");
        ground.material = groundMaterial;
        // to be taken into account by collision detection
        ground.checkCollisions = true;
        //groundMaterial.wireframe=true;

        // for physic engine
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground,
            BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0 },
            scene
        );
    }
    return ground;
}

function createLights(scene) {
    // i.e sun light with all light rays parallels, the vector is the direction.
    let light0 = new BABYLON.DirectionalLight(
        "dir0",
        new BABYLON.Vector3(-1, -1, 0),
        scene
    );
}

function createFreeCamera(scene, initialPosition) {
    let camera = new BABYLON.FreeCamera("freeCamera", initialPosition, scene);
    camera.attachControl(canvas);
    // prevent camera to cross ground
    camera.checkCollisions = true;
    // avoid flying with the camera
    camera.applyGravity = true;

    // Make it small as we're going to put in on top of the Dude
    camera.ellipsoid = new BABYLON.Vector3(.1, .1, .1); // very small ellipsoid/sphere 
    camera.ellipsoidOffset.y = 4;
    // Add extra keys for camera movements
    // Need the ascii code of the extra key(s). We use a string method here to get the ascii code
    camera.keysUp.push("z".charCodeAt(0));
    camera.keysDown.push("s".charCodeAt(0));
    camera.keysLeft.push("q".charCodeAt(0));
    camera.keysRight.push("d".charCodeAt(0));
    camera.keysUp.push("Z".charCodeAt(0));
    camera.keysDown.push("S".charCodeAt(0));
    camera.keysLeft.push("Q".charCodeAt(0));
    camera.keysRight.push("D".charCodeAt(0));

    return camera;
}

function createFollowCamera(scene, target) {
    let targetName = target.name;

    // use the target name to name the camera
    let camera = new BABYLON.FollowCamera(
        targetName + "FollowCamera",
        target.position,
        scene,
        target
    );

    // default values
    camera.radius = 40; // how far from the object to follow
    camera.heightOffset = 14; // how high above the object to place the camera
    camera.rotationOffset = 0; // the viewing angle
    camera.cameraAcceleration = 0.1; // how fast to move
    camera.maxCameraSpeed = 5; // speed limit

    // specific values
    switch (target.name) {
        case "heroDude":
            camera.rotationOffset = 0;
            break;
        case "heroDude2":
            camera.rotationOffset = 0;
            break;
        case "heroTank":
            camera.rotationOffset = 180; // the viewing angle
            break;
    }

    return camera;
}

let zMovement = 5;

function createTank(scene) {
    let tank = new BABYLON.MeshBuilder.CreateBox(
        "heroTank", { height: 1, depth: 6, width: 6 },
        scene
    );
    let tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseColor = new BABYLON.Color3.Red();
    tankMaterial.emissiveColor = new BABYLON.Color3.Blue();
    tank.material = tankMaterial;


    // tank cannot be picked by rays, but tank will not be pickable by any ray from other
    // players.... !
    //tank.isPickable = false;

    // By default the box/tank is in 0, 0, 0, let's change that...
    tank.position.y = 0.6;
    tank.speed = 1;
    tank.frontVector = new BABYLON.Vector3(0, 0, 1);

    tank.move = () => {
        if (scene.activeCamera !== scene.followCameraTank) return;
        //tank.position.z += -1; // speed should be in unit/s, and depends on
        // deltaTime !

        // if we want to move while taking into account collision detections
        // collision uses by default "ellipsoids"

        let yMovement = 0;

        if (tank.position.y > 2) {
            zMovement = 0;
            yMovement = -2;
        }


        // adjusts y position depending on ground height...
        // create a ray that starts above the tank, and goes down vertically
        let origin = new BABYLON.Vector3(tank.position.x, 1000, tank.position.z);
        let direction = new BABYLON.Vector3(0, -1, 0);
        let ray = new BABYLON.Ray(origin, direction, 10000);

        // compute intersection point with the ground
        let pickInfo = scene.pickWithRay(ray, (mesh) => { return (mesh.name === "gdhm"); });
        let groundHeight = pickInfo.pickedPoint.y;
        tank.position.y = groundHeight + 1.5;

        //tank.moveWithCollisions(new BABYLON.Vector3(0, yMovement, zMovement));

        if (scene.inputStates.up) {
            //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, 1*tank.speed));
            tank.moveWithCollisions(
                tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed)
            );
        }
        if (scene.inputStates.down) {
            //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
            tank.moveWithCollisions(
                tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed)
            );
        }
        if (scene.inputStates.left) {
            //tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
            tank.rotation.y -= 0.02;
            tank.frontVector = new BABYLON.Vector3(
                Math.sin(tank.rotation.y),
                0,
                Math.cos(tank.rotation.y)
            );
        }
        if (scene.inputStates.right) {
            //tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
            tank.rotation.y += 0.02;
            tank.frontVector = new BABYLON.Vector3(
                Math.sin(tank.rotation.y),
                0,
                Math.cos(tank.rotation.y)
            );
        }
    };

    // to avoid firing too many cannonball rapidly
    tank.canFireCannonBalls = true;
    tank.fireCannonBallsAfter = 0.1; // in seconds

    tank.fireCannonBalls = function() {
        if (!scene.inputStates.space) return;

        if (!this.canFireCannonBalls) return;

        // ok, we fire, let's put the above property to false
        this.canFireCannonBalls = false;

        // let's be able to fire again after a while
        setTimeout(() => {
            this.canFireCannonBalls = true;
        }, 1000 * this.fireCannonBallsAfter);

        scene.assets.cannonSound.setPosition(tank.position);
        scene.assets.cannonSound.setVolume(0.7);
        scene.assets.cannonSound.play();

        // Create a canonball
        let cannonball = BABYLON.MeshBuilder.CreateSphere(
            "cannonball", { diameter: 2, segments: 32 },
            scene
        );
        cannonball.material = new BABYLON.StandardMaterial("Fire", scene);
        cannonball.material.diffuseTexture = new BABYLON.Texture(
            "images/Fire.jpg",
            scene
        );

        let pos = this.position;
        // position the cannonball above the tank
        cannonball.position = new BABYLON.Vector3(pos.x, pos.y + 1, pos.z);
        // move cannonBall position from above the center of the tank to above a bit further than the frontVector end (5 meter s further)
        cannonball.position.addInPlace(this.frontVector.multiplyByFloats(5, 5, 5));

        // add physics to the cannonball, mass must be non null to see gravity apply
        cannonball.physicsImpostor = new BABYLON.PhysicsImpostor(
            cannonball,
            BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1 },
            scene
        );

        // the cannonball needs to be fired, so we need an impulse !
        // we apply it to the center of the sphere
        let powerOfFire = 100;
        let azimuth = 0.1;
        let aimForceVector = new BABYLON.Vector3(
            this.frontVector.x * powerOfFire,
            (this.frontVector.y + azimuth) * powerOfFire,
            this.frontVector.z * powerOfFire
        );

        cannonball.physicsImpostor.applyImpulse(aimForceVector, cannonball.getAbsolutePosition());

        cannonball.actionManager = new BABYLON.ActionManager(scene);
        // register an action for when the cannonball intesects a ninja, so we need to iterate on each dude
        scene.ninjas.forEach((ninja) => {
            cannonball.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction({
                        trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                        parameter: scene.ninjas[0].bounder,
                    },
                    () => {
                        console.log("HIT !");
                        ninja.health--;

                    }));
        });

        // scene.dudes.forEach((dude) => {
        //     cannonball.actionManager.registerAction(
        //         new BABYLON.ExecuteCodeAction({
        //                 trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
        //                 parameter: dude.Dude.bounder,
        //             }, // dude is the mesh, Dude is the instance if Dude class that has a bbox as a property named bounder.
        //             // see Dude class, line 16 ! dudeMesh.Dude = this;
        //             () => {
        //                 // console.log(dude.Dude.bounder)
        //                 if (dude.Dude.bounder._isDisposed) return;

        //                 //console.log("HIT !")
        //                 //dude.Dude.bounder.dispose();
        //                 //dude.dispose();
        //                 dude.Dude.gotKilled();
        //                 //cannonball.dispose(); // don't work properly why ? Need for a closure ?
        //             }
        //         )
        //     );
        // });

        // Make the cannonball disappear after 3s
        setTimeout(() => {
            cannonball.dispose();
        }, 3000);
    };

    // to avoid firing too many cannonball rapidly
    tank.canFireLasers = true;
    tank.fireLasersAfter = 0.3; // in seconds

    tank.fireLasers = function() {
        // is the l key pressed ?
        if (!scene.inputStates.laser) return;

        if (!this.canFireLasers) return;

        // ok, we fire, let's put the above property to false
        this.canFireLasers = false;

        // let's be able to fire again after a while
        setTimeout(() => {
            this.canFireLasers = true;
        }, 1000 * this.fireLasersAfter);

        scene.assets.laserSound.setPosition(tank.position);
        scene.assets.laserSound.setVolume(0.6);
        scene.assets.laserSound.play();

        //console.log("create ray")
        // create a ray
        let origin = this.position; // position of the tank
        //let origin = this.position.add(this.frontVector);

        // Looks a little up (0.1 in y)
        let direction = new BABYLON.Vector3(
            this.frontVector.x,
            this.frontVector.y + 0.1,
            this.frontVector.z
        );
        let length = 1000;
        let ray = new BABYLON.Ray(origin, direction, length);

        // to make the ray visible :
        let rayHelper = new BABYLON.RayHelper(ray);
        rayHelper.show(scene, new BABYLON.Color3.Red());

        // to make ray disappear after 200ms
        setTimeout(() => {
            rayHelper.hide(ray);
        }, 200);

        // what did the ray touched?
        /*
            let pickInfo = scene.pickWithRay(ray);
            // see what has been "picked" by the ray
            console.log(pickInfo);
            */

        // See also multiPickWithRay if you want to kill "through" multiple objects
        // this would return an array of boundingBoxes.... instead of one.

        let pickInfo = scene.pickWithRay(ray, (mesh) => {
            /*
                  if((mesh.name === "heroTank")|| ((mesh.name === "ray"))) return false;
                  return true;
                  */
            return mesh.name.startsWith("bounder");
        });

        if (pickInfo.pickedMesh) {
            // sometimes it's null for whatever reason...?
            // the mesh is a bounding box of a dude
            console.log(pickInfo.pickedMesh.name);
            let bounder = pickInfo.pickedMesh;
            let dude = bounder.dudeMesh.Dude;
            // let's decrease the dude health, pass him the hit point
            dude.decreaseHealth(pickInfo.pickedPoint);

            //bounder.dudeMesh.dispose();
            //bounder.dispose();
        }
    };

    return tank;
}

function createHeroDude2(scene) {
    let meshTask = scene.assetsManager.addMeshTask(
        "Dude2 task",
        "",
        "models/Dude2/",
        "Run.glb"
    );

    meshTask.onSuccess = function(task) {
        onDudeImported(
            task.loadedMeshes,
            task.loadedParticleSystems,
            task.loadedSkeletons);

        function onDudeImported(newMeshes, particleSystems, skeletons) {
            console.log("meshes -> ", newMeshes);
            let ninja = newMeshes[0];

            // give it a name so that we can retrieve it easily
            ninja.name = "ninja";

            scene.ninjas = [];
            let hero = new Ninja(ninja, 1, 3.0, 5, scene);
            scene.ninjas.push(hero);
        };
    }
}


function createHeroDude(scene) {
    // load the Dude 3D animated model
    // name, folder, skeleton name
    //BABYLON.SceneLoader.ImportMesh("him", "models/Dude/", "Dude.babylon", scene, onDudeImported);

    let meshTask = scene.assetsManager.addMeshTask(
        "Dude task",
        "him",
        "models/Dude/",
        "Dude.babylon"
    );

    meshTask.onSuccess = function(task) {
        onDudeImported(
            task.loadedMeshes,
            task.loadedParticleSystems,
            task.loadedSkeletons
        );
    };

    function onDudeImported(newMeshes, particleSystems, skeletons) {
        let heroDude = newMeshes[0];
        heroDude.position = new BABYLON.Vector3(0, 0, 5); // The original dude
        // make it smaller
        //heroDude.speed = 0.1;

        // give it a name so that we can query the scene to get it by name
        heroDude.name = "heroDude";

        // create a follow camera for this mesh
        scene.followCameraDude = createFollowCamera(scene, heroDude);


        // there might be more than one skeleton in an imported animated model. Try console.log(skeletons.length)
        // here we've got only 1.
        // animation parameters are skeleton, starting frame, ending frame,  a boolean that indicate if we're gonna
        // loop the animation, speed,
        // let's store the animatableObject into the main dude mesh
        heroDude.animation = scene.beginAnimation(skeletons[0], 0, 120, true, 1);

        setTimeout(() => {
                heroDude.animation.pause();
            }, 500)
            // params = id, speed, scaling, scene
        let hero = new Dude(heroDude, -1, 1, 0.2, scene);

        // Let's add a free camera on the head of the dude (on top of the bounding box + 0.2)
        let bboxHeightScaled = hero.getBoundingBoxHeightScaled();
        let freeCamPosition = new BABYLON.Vector3(heroDude.position.x,
            heroDude.position.y + bboxHeightScaled + 0.2,
            heroDude.position.z);
        scene.freeCameraDude = createFreeCamera(scene, freeCamPosition);
        // associate a crosshair to this cam, to see where we are aiming
        loadCrossHair(scene);

        // make clones
        scene.dudes = [];
        for (let i = 0; i < 0; i++) {
            scene.dudes[i] = doClone(heroDude, skeletons, i);
            scene.beginAnimation(scene.dudes[i].skeleton, 0, 120, true, 1);

            // Create instance with move method etc.
            // params = speed, scaling, scene
            var temp = new Dude(scene.dudes[i], i, 0.3, 0.2, scene);
            // remember that the instances are attached to the meshes
            // and the meshes have a property "Dude" that IS the instance
            // see render loop then....
        }
        // insert at pos 0, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
        // it will be easier for us to distinguish it later on...
        scene.dudes.unshift(heroDude);
    }
}

function doClone(originalMesh, skeletons, id) {
    let myClone;
    let xrand = Math.floor(Math.random() * 500 - 250);
    let zrand = Math.floor(Math.random() * 500 - 250);

    myClone = originalMesh.clone("clone_" + id);
    myClone.position = new BABYLON.Vector3(xrand, 0, zrand);

    if (!skeletons) return myClone;

    // The mesh has at least one skeleton
    if (!originalMesh.getChildren()) {
        myClone.skeleton = skeletons[0].clone("clone_" + id + "_skeleton");
        return myClone;
    } else {
        if (skeletons.length === 1) {
            // the skeleton controls/animates all children, like in the Dude model
            let clonedSkeleton = skeletons[0].clone("clone_" + id + "_skeleton");
            myClone.skeleton = clonedSkeleton;
            let nbChildren = myClone.getChildren().length;

            for (let i = 0; i < nbChildren; i++) {
                myClone.getChildren()[i].skeleton = clonedSkeleton;
            }
            return myClone;
        } else if (skeletons.length === originalMesh.getChildren().length) {
            // each child has its own skeleton
            for (let i = 0; i < myClone.getChildren().length; i++) {
                myClone.getChildren()[i].skeleton = skeletons[i].clone(
                    "clone_" + id + "_skeleton_" + i
                );
            }
            return myClone;
        }
    }

    return myClone;
}

function moveHeroDude() {
    let heroDude = scene.getMeshByName("heroDude");
    //console.log(heroDude);
    if (heroDude) heroDude.Dude.moveFPS(scene);
}

function moveHeroDude2() {
    let ninja = scene.getMeshByName("ninja");
    if (ninja) {
        //console.log(ninja.Ninja.bounder.position);
        ninja.Ninja.moveInSquarre();
    }

}

function moveOtherDudes() {
    if (scene.dudes) {
        // start at 1 so the original dude will not move and follow the tank...
        for (var i = 1; i < scene.dudes.length; i++) {
            scene.dudes[i].Dude.followTank(scene);
        }
    }
}

window.addEventListener("resize", () => {
    engine.resize();
});

function modifySettings() {
    // as soon as we click on the game window, the mouse pointer is "locked"
    // you will have to press ESC to unlock it
    scene.onPointerDown = () => {
        if (!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");

            if (scene.activeCamera === scene.freeCameraDude) {
                // let fire the gun
                let heroDude = scene.getMeshByName("heroDude");
                if (heroDude) heroDude.Dude.fireGun();
            }
        }
    };

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        if (element) {
            // lets create a custom attribute
            scene.alreadyLocked = true;
        } else {
            scene.alreadyLocked = false;
        }
    });

    // key listeners for the tank
    scene.inputStates = {};
    scene.inputStates.left = false;
    scene.inputStates.right = false;
    scene.inputStates.up = false;
    scene.inputStates.down = false;
    scene.inputStates.space = false;
    scene.inputStates.laser = false;

    //add the listener to the main, window object, and update the states
    window.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
                scene.inputStates.left = true;
            } else if (
                event.key === "ArrowUp" ||
                event.key === "z" ||
                event.key === "Z"
            ) {
                scene.inputStates.up = true;
            } else if (
                event.key === "ArrowRight" ||
                event.key === "d" ||
                event.key === "D"
            ) {
                scene.inputStates.right = true;
            } else if (
                event.key === "ArrowDown" ||
                event.key === "s" ||
                event.key === "S"
            ) {
                scene.inputStates.down = true;
            } else if (event.key === " ") {
                scene.inputStates.space = true;
            } else if (event.key === "l" || event.key === "L") {
                scene.inputStates.laser = true;
            } else if (event.key == "t" || event.key == "T") {
                scene.activeCamera = scene.followCameraTank;
            } else if (event.key == "y" || event.key == "Y") {
                scene.activeCamera = scene.followCameraDude;
            } else if (event.key == "u" || event.key == "U") {
                scene.activeCamera = scene.freeCameraDude;
            }
        },
        false
    );

    //if the key will be released, change the states object
    window.addEventListener(
        "keyup",
        (event) => {
            if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
                scene.inputStates.left = false;
            } else if (
                event.key === "ArrowUp" ||
                event.key === "z" ||
                event.key === "Z"
            ) {
                scene.inputStates.up = false;
            } else if (
                event.key === "ArrowRight" ||
                event.key === "d" ||
                event.key === "D"
            ) {
                scene.inputStates.right = false;
            } else if (
                event.key === "ArrowDown" ||
                event.key === "s" ||
                event.key === "S"
            ) {
                scene.inputStates.down = false;
            } else if (event.key === " ") {
                scene.inputStates.space = false;
            } else if (event.key === "l" || event.key === "L") {
                scene.inputStates.laser = false;
            }
        },
        false
    );
}