class Boss {

    constructor(mesh) {

        this.mesh = mesh

        this.health = 350
        this.isPresent = false
        this.trigger = 5 //Fishes for boss to appear
        this.spikes = []
        this.attackActive = false
        this.introduced = false

        this.ATTACKS = {
            right: 'RIGHT',
            left: 'LEFT',
            center: 'CENTER'
        }

        this.MULTIPLIERS = {
            collision: 1.25,
            speed: 1.6
        }

    }

    attack(side) {

        let x

        switch (side) {

            case this.ATTACKS.right:
                x = 106
                for (let i = 0; i < 5; i++) {
                    this.createSpike(x)
                    x -= 40
                }
                break

            case this.ATTACKS.left:
                x = -106
                for (let i = 0; i < 5; i++) {
                    this.createSpike(x)
                    x += 40
                }
                break

            case this.ATTACKS.center:
                x = -50
                for (let i = 0; i < 4; i++) {
                    this.createSpike(x)
                    x += 35
                }
                break
        }

    }

    createSpike(posX) {
        let loader = new THREE.GLTFLoader()
        let url = './models/Spikes/spikeVertical.gltf'

        let y = 80
        let z = -950

        let spike


        loader.load(url, (gltf) => {

            gltf.scene.traverse(function (object) {
                if (object.isMesh) {
                    object.geometry.computeBoundingBox()
                    object.castShadow = true
                }
            })


            gltf.scene.children[0].scale.set(15, 15, 15)
            //gltf.scene.children[0].rotation.z = degToRad(90) 
            gltf.scene.children[0].rotation.x = degToRad(90)

            gltf.scene.children[0].position.set(posX, y, z)

            spike = gltf.scene.children[0]

            this.spikes.push(spike)

            scene.add(gltf.scene)

        })

    }

    playAudio(type) {

        let url

        if (type == 'intro') {
            url = './sounds/orca.mp3'
        } else if (type == 'hit') {
            url = './sounds/hit.mp3'
        }

        const listener = new THREE.AudioListener()
        this.mesh.add(listener)
        const sound = new THREE.Audio(listener)
        const audioLoader = new THREE.AudioLoader()
        audioLoader.load(url, function (buffer) {
            sound.setBuffer(buffer)
            sound.setLoop(false)
            sound.setVolume(0.5)
            sound.play()
        })

    }

    onDeath() {


        $('#message').text('Orczilla Retreated!')
        $('#boss').css('display', 'none')

        $('#ammo-div').fadeOut('fast')

        setTimeout(() => {

            $('#message').css('display', 'none')
            $('#fish-text').text('0')

            this.reset()
            player.fishEaten = 0

        }, 2000)
    }

    reset() {
        this.spikes.forEach((obs) => {
            scene.remove(obs.parent)
        })
        player.bullets.forEach((bullet) => {
            scene.remove(bullet.mesh)
        })

        this.introduced = false
        this.health = 350
        this.attackActive = false
        this.isPresent = false
        this.spikes = []
        this.mesh.position.y = -500
        this.mesh.rotation.y = 0
    }

}
