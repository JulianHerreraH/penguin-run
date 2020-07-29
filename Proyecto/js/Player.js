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

    shoot() {
        let pos = this.mesh.position

        let geo = new THREE.BoxBufferGeometry(10, 10, 10)
        let mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        let mesh = new THREE.Mesh(geo, mat)

        mesh.position.set(pos.x, 40, pos.z - 10)

        let bullet = {
            mesh,
            speed: 15.0,
            damage: 10.0
        }

        scene.add(bullet.mesh)
        this.bullets.push(bullet)
        //$('#ammo-text').text(`${this.bullets.length}x`)

    }

}
