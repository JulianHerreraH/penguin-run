/**
 * Player class for user-controlled penguin
 */
class Player {

    /**
     * 
     * @param {Mesh} mesh 
     */
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

        const pos = this.mesh.position
        const y = 40
        const zOffset = 10

        let geo = new THREE.SphereBufferGeometry(9, 6, 5)
        let mat = new THREE.MeshToonMaterial({ color: environment.COLORS.ice })
        let mesh = new THREE.Mesh(geo, mat)

        mesh.castShadow = true
        mesh.position.set(pos.x, y, pos.z - zOffset)

        let bullet = {
            mesh,
            speed: 15.0,
            damage: 10.0
        }

        scene.add(bullet.mesh)
        this.bullets.push(bullet)

    }

}
