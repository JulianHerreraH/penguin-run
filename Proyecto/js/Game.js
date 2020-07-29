/**
 * 
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

    }


    /**
     * 
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
     * 
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
        scoreText.css('display', 'none')

        this.obstacles.forEach((box) => {
            // Remove all obstacles
            scene.remove(box.mesh.parent)
        })

        this.obstacles = []
        this.score = 1

        player.fishEaten = 0

        boss.reset()
    }




}
