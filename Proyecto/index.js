/*
    Julian Herrera, A01114097
    Graficas Computacionales
*/

// Global objects
let renderer = null,
    scene = null,
    camera = null,
    controls = null,
    clock = null,
    gltfLoader = null,
    stats = null

// Animation mixers array
let mixers = []
// Array of seagull 3D objects
let seagulls = []
// Screenshaker utility global variable
let screenShake
// Global score HTML element
let scoreText

// Global objects
let player
let game
let inputManager
let environment
let boss


/**
 * Function that updates game logic every frame
 */
function update() {

    // Game constants
    const delta = 5 * clock.getDelta()

    const rotateAnglePlayer = degToRad(player.rotationAngle)
    const moveDistance = player.moveDistance * delta

    const scoreIncrement = 0.33
    const baseSpeed = 10
    const basePenalty = 30
    const obstacleChance = 0.06

    const planeLimitP = 106
    const planeLimitN = -106


    // Logic for when the game starts
    if (game.started) {

        // GAME OVER
        if (game.score <= 0) {
            $('#highScore').text(game.highScore.toFixed())
            localStorage.setItem('high_score', game.highScore)
            game.reset()
        }

        // Check high score
        if (game.highScore < game.score)
            gamehighScore = game.score


        game.score += scoreIncrement
        // Update score text element
        scoreText.text(game.score.toFixed())

        // CREATION OF OBSTACLES    
        if (Math.random() < obstacleChance && game.obstacles.length < game.maxObstacles && !boss.isPresent)
            game.createObstacle()

        // Deal with score penalties
        if (game.score.toFixed() < 120)
            game.collisionPenalty = basePenalty
        else
            game.collisionPenalty = game.score.toFixed() * 0.21

        // Increment obstacle speed as the score increases
        if ((game.score.toFixed() % game.leveler) == 0)
            game.obstacleSpeed = baseSpeed +
                ((game.score.toFixed() / game.leveler) * 0.7)


        // COLLISIONS
        let playerCollider = new THREE.Box3().setFromObject(player.mesh)
        // Slightly reduce the size of the collider
        playerCollider.expandByScalar(-3.8)

        // Obstacles logic
        game.obstacles.forEach((obs, ndx) => {

            // Remove obstacle from the scene and array
            if (obs.mesh.position.z > camera.position.z) {
                scene.remove(obs.mesh.parent) //parent is the gltf.scene
                game.obstacles.splice(ndx, 1)
            } else {
                obs.mesh.position.z += game.obstacleSpeed
            }

            let colliderBox = new THREE.Box3().setFromObject(obs.mesh)
            let collision = playerCollider.intersectsBox(colliderBox)

            if (collision) {

                if (obs.type == game.TYPES.friend) {

                    player.fishEaten += 1
                    // Change HTML text
                    $('#message').css('display', 'block')
                    $('#message').css('color', 'green')
                    $('#message').text('Invulnerable!')
                    $('#fish-text').text(`${player.fishEaten}x`)

                    scene.remove(obs.mesh.parent)
                    game.obstacles.splice(ndx, 1)
                    player.isInvulnerable = true

                    // Make player vulnerable again, hide text
                    setTimeout(() => {
                        $('#message').css('display', 'none')
                        player.isInvulnerable = false
                    }, 2500)

                } else if (obs.type == game.TYPES.enemy && !player.isInvulnerable) {

                    //Check high score
                    if (game.highScore < game.score)
                        game.highScore = game.score

                    game.score -= game.collisionPenalty
                    scene.remove(obs.mesh.parent)
                    game.obstacles.splice(ndx, 1)
                    scoreText.css('color', 'red')

                    // Reset color of  text
                    setTimeout(() => {
                        scoreText.css('color', 'white')
                    }, 550)

                    shakeCamera([0, 0, 6.5], 300)

                }

            }

        })


        // MOVEMENT
        if (inputManager.moveLeft) {

            if (player.mesh.position.x > planeLimitN)
                player.mesh.position.x -= moveDistance

            if (player.mesh.rotation.y > -rotateAnglePlayer)
                player.mesh.rotation.y -= degToRad(0.8)


        } if (inputManager.moveRight) {

            if (player.mesh.position.x < planeLimitP)
                player.mesh.position.x += moveDistance

            if (player.mesh.rotation.y < rotateAnglePlayer)
                player.mesh.rotation.y += degToRad(0.8)

        }

        // Jump
        if (inputManager.canJump && (player.mesh.position.y == player.posYInitital)) {
            player.mesh.position.y += player.jumpDistance
            inputManager.canJump = false
        }
        // Return player to starting position after jump
        if (player.mesh.position.y > player.posYInitital) {
            player.mesh.position.y -= 2.0

        }


        // Boss logic: eat fish, boss appears
        if (player.fishEaten == boss.trigger) {

            // Remove other obstacles present
            game.obstacles.forEach((box) => {
                scene.remove(box.mesh.parent)
            })

            boss.isPresent = true
            boss.mesh.position.y = 0

            $('#message').css('display', 'block')

            if (!boss.introduced) {

                boss.playAudio(boss.AUDIOS.intro)
                boss.introduced = true

                // Titles
                $('#boss').fadeIn()
                $('#message').css('color', 'white')
                $('#ammo-div').fadeIn('slow')


                setTimeout(() => {
                    $('#boss').fadeOut()
                }, 5000)

            }

            player.canShoot = true

            if (boss.health > 0) {

                $('#message').text(`HP: ${boss.health}`)

                // Boss attack if possible
                if (!boss.attackActive) {
                    //Attack the side where the player is
                    if (player.mesh.position.x < -25)
                        boss.attack(boss.ATTACKS.left)
                    else if (player.mesh.position.x > 25)
                        boss.attack(boss.ATTACKS.right)
                    else
                        boss.attack(boss.ATTACKS.center)

                    boss.attackActive = true
                }

                // Move and check collision of boss' attacks
                boss.spikes.forEach((obs, ndx) => {

                    if (obs.position.z >= camera.position.z) {

                        scene.remove(obs.parent)
                        boss.spikes = []
                        boss.attackActive = false

                    } else {
                        obs.position.z += game.obstacleSpeed * boss.MULTIPLIERS.speed
                    }

                    let colliderBox = new THREE.Box3().setFromObject(obs)
                    let collision = playerCollider.intersectsBox(colliderBox)

                    if (collision) {

                        //Check high score
                        if (game.highScore < game.score)
                            game.highScore = game.score


                        game.score -= game.collisionPenalty * boss.MULTIPLIERS.collision
                        scene.remove(obs.parent)
                        boss.spikes.splice(ndx, 1)
                        scoreText.css('color', 'red')

                        setTimeout(() => {
                            scoreText.css('color', 'white')
                        }, 550)

                        shakeCamera([0, 0, 6.5], 300)
                    }

                })

                // Init boss collider
                let bossCollider = new THREE.Box3().setFromObject(boss.mesh)

                // Deal with player attacks
                if (player.canShoot) {

                    const ammo = player.ammo - player.bullets.length
                    $('#ammo-text').text(`${ammo}x`)

                    if (inputManager.canShoot) {

                        if (player.bullets.length < player.ammo) {
                            player.shoot()
                            inputManager.canShoot = false
                        }

                    }

                    // Move bullets and check collisions
                    player.bullets.forEach((bullet, ndx) => {

                        if (bullet.mesh.position.z < boss.mesh.position.z - 100) {

                            scene.remove(bullet.mesh)
                            player.bullets.splice(ndx, 1)

                        } else {
                            bullet.mesh.position.z -= bullet.speed
                        }

                        let bulletCollider = new THREE.Box3().setFromObject(bullet.mesh)
                        let isHit = bossCollider.intersectsBox(bulletCollider)

                        if (isHit) {

                            boss.health -= bullet.damage
                            boss.playAudio(boss.AUDIOS.hit)

                            scene.remove(bullet.mesh)
                            player.bullets.splice(ndx, 1)

                        }

                    })
                }

            } else {
                // "Animation" for boss defeat
                boss.mesh.rotation.z -= delta * 1.5
                boss.onDeath()
            }

        }

    }

    // Small animation for game over
    if (game.restarted) {

        player.mesh.position.y = 20
        player.mesh.rotation.y = degToRad(180)
        player.mesh.rotation.z += delta * 0.25

    }

    // Animations' mixers
    mixers.forEach((mixer) => {
        mixer.update(delta * 0.3)
    })

    // Change time value in shaders' uniforms
    if (environment.planeShader) {

        environment.planeShader.uniforms.time.value += delta * 0.2
        environment.sunShader.uniforms.time.value += delta * 0.05

    }

    // Move seagulls, reset position once they reach the screen limit
    seagulls.forEach((obj) => {

        if (obj.scene.children[0].position.x >= 4000) {
            obj.scene.children[0].position.x = obj.positionReset + getRandomFloat(-100, 100)
        }
        obj.scene.children[0].position.x += delta * 55

    })

}


/**
 * Scene rendering loop
 */
function run() {
    requestAnimationFrame(function () { run() })


    // Render the scene
    renderer.render(scene, camera)

    stats.begin();
    // monitored code goes here
    stats.end();

    update()

    // Screen shake function update
    screenShake.update(camera)
}


/**
 * Inits the main components of THREE JS and the game environment
 * @param {HTMLElement} canvas 
 */
function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
    })

    // Turn on shadows
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.BasicShadowMap
    renderer.outputEncoding = THREE.GammaEncoding

    // Set the viewport size
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)

    // Create a new Three.js scene
    scene = new THREE.Scene()

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 1, 40000)
    camera.position.y = 150
    camera.position.z = 600
    scene.add(camera)

    // Main light for shadows
    let directionalLight = new THREE.DirectionalLight(0xffffff, .85)
    directionalLight.position.set(0, 400, 400)
    // Shadows
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -400
    directionalLight.shadow.camera.right = 400
    directionalLight.shadow.camera.top = 400
    directionalLight.shadow.camera.bottom = -400
    directionalLight.shadow.camera.near = 1
    directionalLight.shadow.camera.far = 10000
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    // Add main light
    scene.add(directionalLight)

    // Hemisphere Light to make the scene more vibrant
    let hemisphereLight = new THREE.HemisphereLight(0xfc7384, 0xd0c8dd, 0.7)
    scene.add(hemisphereLight)


    const loadManager = new THREE.LoadingManager()
    gltfLoader = new THREE.GLTFLoader(loadManager)
    const textureLoader = new THREE.TextureLoader(loadManager)

    // loading bar elements
    const loadingElem = document.querySelector('#loading')
    const progressBarElem = loadingElem.querySelector('.progressbar')

    // Textures and models to load
    const planeTexture = textureLoader.load('../img/Project/plane.png')
    const playerModelUrl = './models/Penguin/penguin.gltf'
    const bearUrl = './models/Bear/bear.gltf'
    const seagullUrl = './models/Seagull/seagull.gltf'
    const walrusUrl = './models/Walrus/walrus.gltf'
    const orczillaUrl = './models/Orczilla/scene.gltf'

    // Define models' properties
    let objects = [
        player = {
            url: playerModelUrl,
            scale: [9, 9, 9],
            rotation: [degToRad(-90), 0, degToRad(90)],
            position: [0, 10, 340],
            name: 'player',
            animated: true
        },
        bear = {
            url: bearUrl,
            scale: [20, 20, 20],
            rotation: [degToRad(-90), 0, degToRad(-120)],
            position: [300, -48, -100],
            name: 'bear',
            animated: false
        },
        s1 = {
            url: seagullUrl,
            scale: [3, 3, 3],
            rotation: [degToRad(-90), 0, 0],
            position: [-4500, 600, -2400],
            name: 'seagull',
            animated: true,
        },
        s2 = {
            url: seagullUrl,
            scale: [3, 3, 3],
            rotation: [degToRad(-90), 0, 0],
            position: [-4900, 850, -2200],
            name: 'seagull',
            animated: true,
        },
        walrus = {
            url: walrusUrl,
            scale: [9.5, 9.5, 9.5],
            rotation: [degToRad(-90), 0, degToRad(-45)],
            position: [-335, 110, 20],
            name: 'walrus',
            animated: false,
        },
        orczilla = {
            url: orczillaUrl,
            scale: [0.2, 0.2, 0.2],
            rotation: [degToRad(-90), 0, 0],
            position: [0, -500, -1000],
            name: 'orczilla',
            animated: true,
        }
    ]

    loadGLTFModels(objects)

    loadManager.onLoad = () => {

        loadingElem.style.display = 'none'
        $('#play-text').css('display', 'block')

        //Init objects
        game = new Game()
        inputManager = new InputManager()
        environment = new Environment()

        //Set or look for local storage high score
        const localStorageHigh = parseInt(localStorage.getItem('high_score'))
        if (!localStorageHigh) {
            localStorage.setItem('high_score', 0)
            $('#highScore').fadeIn()
            $('#highScore').text(`High Score: ${localStorageHigh.toFixed()}`)
        } else {
            game.highScore = localStorageHigh
            $('#highScore').fadeIn()
            $('#highScore').text(`High Score: ${localStorageHigh.toFixed()}`)
        }

        // Show play plane
        environment.initPlane(planeTexture, 6)
        // Add sun in the backgound
        environment.initSun(1100)

        //Add terrain
        const texture = environment.generateNoiseTexture()
        const terrain = environment.generateTerrain(texture)
        terrain.rotation.x = degToRad(-90)
        scene.add(terrain)

        // Listen to ENTER press to start game
        document.addEventListener('keydown', (event) => {
            if (event.which == 13 && !game.started) {
                game.init()
                game.started = true
            }
        })

        // controls = new THREE.OrbitControls(camera, canvas)
        // controls.target.set(0, 0, 0)
        // controls.update()

        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        stats.domElement.style.cssText = 'position:absolute;bottom:0px;right:0px;'
        document.body.appendChild(stats.dom);

        // In case window is resized
        window.addEventListener('resize', onWindowResize)

        // Init screenshake utility
        screenShake = ScreenShake()

        clock = new THREE.Clock()

        // Call the main loop once everything is loaded
        run()
    }

    // Show progress with the HTML element
    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal
        progressBarElem.style.transform = `scaleX(${progress})`
    }

}


/**
 * Uses ScreenShake util to move camera
 * @param {Array} vector
 * @param {number} duration 
 */
function shakeCamera(vector, duration) {
    screenShake.shake(camera, new THREE.Vector3(...vector), duration)
}


/**
 * Loads and adds to scene a list of GLTF models with their data
 * @param {Array} objs 
 */
function loadGLTFModels(objs) {

    objs.forEach((obj) => {

        gltfLoader.load(obj.url, function (gltf) {

            if (obj.name === 'player') {
                player = new Player(gltf.scene.children[0])
            }
            if (obj.name === 'orczilla') {
                boss = new Boss(gltf.scene.children[0])
            }

            if (obj.name === 'seagull') {
                let seagull = {
                    scene: gltf.scene,
                    positionReset: -4200
                }
                seagulls.push(seagull)
            }

            if (obj.animated) {
                let mixer = new THREE.AnimationMixer(gltf.scene)
                let action = mixer.clipAction(gltf.animations[0])
                action.play()
                mixers.push(mixer)
            }

            gltf.scene.traverse(function (object) {
                if (object.isMesh) {
                    object.geometry.computeBoundingBox()
                    object.castShadow = true
                }
            })

            gltf.scene.children[0].scale.set(...obj.scale)
            gltf.scene.children[0].rotation.set(...obj.rotation)
            gltf.scene.children[0].position.set(...obj.position)

            scene.add(gltf.scene)

        })

    })

}
