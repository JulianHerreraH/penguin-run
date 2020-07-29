/**
 * PLayer class for user-controlled penguin
 */
class Player {

    constructor(mesh) {

        this.mesh = mesh
        this.isInvulnerable = false
        this.posYInitital = 10
        this.fishEaten = 0
        // Movement constants
        this.jumpDistance = 80
        this.moveDistance = 30
        this.rotationAngle = 10

        this.bullets = []

        this.canShoot = false
        this.ammo = 4

    }

    /**
     * Instances a bullet shot from player position
     */
    shoot() {


        let pos = this.mesh.position

        let geo = new THREE.SphereBufferGeometry(9, 6, 5)
        let mat = new THREE.MeshToonMaterial({ color: 0x039be5 })
        let mesh = new THREE.Mesh(geo, mat)

        const y = 40
        const zOffset = 10

        mesh.position.set(pos.x, y, pos.z - zOffset)

        let bullet = {
            mesh,
            speed: 15.0,
            damage: 12.0
        }

        scene.add(bullet.mesh)
        this.bullets.push(bullet)

    }

}
