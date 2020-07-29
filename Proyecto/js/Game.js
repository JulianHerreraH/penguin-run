/**
 * Game class holds all relevant data to the game´s functionality
 */
class Game {

    constructor() {

        this.started = false
        this.restarted = false

        this.obstacles = []
        this.obstacleSpeed = 10
        this.maxObstacles = 12
        this.obstacleCounter = 0
        this.lastObstaclePos = 0

        this.collisionPenalty = 0

        this.score = 0
        this.leveler = 500

        this.TYPES = {
            friend: 'fish',
            enemy: 'spike'
        }

    }


    /**
     * Initializes game data and HTML texts. Listens for player input
     */
    init() {

        // init score
        this.score = 1

        $('#message').fadeOut('fast')
        $('#play-text').fadeOut('fast')
        $('#fish-div').fadeIn('slow')

        scoreText = $('#score')
        scoreText.fadeIn('slow')

        if (!this.restarted) {
            console.log('music')
            const listener = new THREE.AudioListener()
            camera.add(listener)
            const sound = new THREE.Audio(listener)
            const audioLoader = new THREE.AudioLoader()
            audioLoader.load('./sounds/background.mp3', function (buffer) {
                sound.setBuffer(buffer)
                sound.setLoop(true)
                sound.setVolume(0.15)
                sound.play()
            })
            // Effect for the music info element
            const infoDiv = $('#music')
            setTimeout(() => {
                infoDiv.fadeIn('slow')
                infoDiv.css('display', 'flex')
            }, 1500)

            // Listen to key presses
            document.addEventListener('keydown', (e) => { inputManager.onKeyDown(e) }, false)
            document.addEventListener('keyup', (e) => { inputManager.onKeyUp(e) }, false)

        }
        else {
            this.restarted = false
            player.mesh.position.x = 0
            player.mesh.position.y = 10
            player.mesh.rotation.set(degToRad(-90), 0, degToRad(90))
        }

    }


    /**
     * Resets game data and HTML texts. Player and boss too
     */
    reset() {

        this.started = false
        this.restarted = true

        // Change titles
        $('#boss').css('display', 'none')

        $('#message').css('display', 'block')
        $('#message').css('color', 'red')
        $('#message').text('GAME OVER')

        $('#play-text').css('display', 'block')
        $('#ammo-div').fadeOut('fast')
        $('#fish-div').fadeOut('fast')
        $('#fish-text').text('0')

        scoreText.css('display', 'none')

        this.obstacles.forEach((box) => {
            // Remove all obstacles
            scene.remove(box.mesh.parent)
        })

        this.obstacles = []
        this.score = 1

        player.fishEaten = 0

        // Resets boss and its data
        boss.reset()
    }


    /**
    * Loads and adds a GLTF to use as obstacle
    */
    createObstacle() {

        let url
        let type

        if (this.obstacleCounter == 18) {
            type = this.TYPES.friend
            url = './models/Fish/fish.gltf'
            game.obstacleCounter = 0
        } else {
            type = this.TYPES.enemy
            url = './models/Spikes/spikeVertical.gltf'
            game.obstacleCounter += 1
        }

        let loader = new THREE.GLTFLoader()

        loader.load(url, gltf => {

            gltf.scene.traverse(function (object) {
                if (object.isMesh) {
                    object.geometry.computeBoundingBox()
                    object.castShadow = true
                }
            })

            let x = getRandomFloat(-105, 106)
            let z = -980
            let y

            if (type == this.TYPES.friend) {

                y = 15
                gltf.scene.children[0].scale.set(5, 5, 5)
                gltf.scene.children[0].rotation.z = degToRad(90)

            } else if (type == this.TYPES.enemy) {

                y = 80
                gltf.scene.children[0].scale.set(15, 15, 15)
                gltf.scene.children[0].rotation.z = Math.floor(getRandomFloat(0, 1.7)) == 0 ? degToRad(90) : 0
                gltf.scene.children[0].rotation.x = degToRad(90)

            }

            while (this.lastObstaclePos == x) {
                x = getRandomFloat(-105, 106)
            }

            gltf.scene.children[0].position.set(x, y, z)

            this.lastObstaclePos = x

            let obstacle = {
                mesh: gltf.scene.children[0],
                type
            }

            this.obstacles.push(obstacle)
            scene.add(gltf.scene)

        })

    }

}
