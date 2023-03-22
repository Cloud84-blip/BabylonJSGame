export class Ninja {
    constructor(ninjaMeshes, id, speed, scaling, scene) {
        this.ninjaMeshes = ninjaMeshes;
        this.id = id;
        this.speed = new BABYLON.Vector3(speed, speed, speed);
        this.scene = scene;
        this.scaling = scaling;
        this.health = 2;

        this.ninjaMeshes.position = new BABYLON.Vector3(0, this.getGroundHeight(), 0);
        this.frontVector = new BABYLON.Vector3(0, 0, -1); // at start ninja is facing camera looking to -Z
        this.ninjaMeshes.scaling = new BABYLON.Vector3(scaling, scaling, scaling);
        this.bounder = this.createBox();
        this.ninjaMeshes.Ninja = this;
    }

    createBox() {

        let box = BABYLON.MeshBuilder.CreateBox("box", { width: 1, height: 1, depth: 1 }, this.scene);
        let mat = new BABYLON.StandardMaterial("mat", this.scene);
        mat.alpha = 0.2;
        box.material = mat;

        let pos = this.ninjaMeshes.position;
        box.position = new BABYLON.Vector3(pos.x, this.getGroundHeight() + this.scaling * 2, pos.z);

        let scal = this.ninjaMeshes.scaling;
        box.scaling = new BABYLON.Vector3(scal.x, scal.y * 2, scal.z);
        box.showBoundingBox = true;

        return box;
    }

    getGroundHeight() {
        // create a ray that starts above the ninja, and goes down vertically
        // to find the ground height
        let origin = new BABYLON.Vector3(this.ninjaMeshes.position.x, 1000, this.ninjaMeshes.position.z);
        let direction = new BABYLON.Vector3(0, -1, 0);
        let ray = new BABYLON.Ray(origin, direction, 10000);
        let pickInfo = this.scene.pickWithRay(ray, (mesh) => { return (mesh.name === "gdhm"); });
        let groundHeight = pickInfo.pickedPoint.y;
        return groundHeight;
    }

    moveInSquarre() {
        // ajust the ninja position to be inside the square and turn it to face the right direction
        if (this.ninjaMeshes.position.z < -40) {
            this.ninjaMeshes.position.z = -39;
            this.frontVector = new BABYLON.Vector3(1, 0, 0);
            this.ninjaMeshes.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.WORLD);
        }
        if (this.ninjaMeshes.position.z > 40) {
            this.ninjaMeshes.position.z = 39;
            this.frontVector = new BABYLON.Vector3(-1, 0, 0);
            this.ninjaMeshes.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.WORLD);
        }
        if (this.ninjaMeshes.position.x > 40) {
            this.ninjaMeshes.position.x = 39;
            this.frontVector = new BABYLON.Vector3(0, 0, 1);
            this.ninjaMeshes.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.WORLD);
        }
        if (this.ninjaMeshes.position.x < -40) {
            this.ninjaMeshes.position.x = -39;
            this.frontVector = new BABYLON.Vector3(0, 0, -1);
            this.ninjaMeshes.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.WORLD);
        }



        // move the ninja

        this.ninjaMeshes.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed.x / 10, this.speed.y, this.speed.z / 10));
        this.bounder.position = new BABYLON.Vector3(this.ninjaMeshes.position.x, this.getGroundHeight() + this.scaling, this.ninjaMeshes.position.z);
        this.ninjaMeshes.position.y = this.getGroundHeight() + 1;

    }
}