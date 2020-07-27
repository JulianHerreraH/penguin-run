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
    gltfLoader = null

// Animation mixers array
let mixers = []
// Array of seagull 3D objects
let seagulls = []

// Extension of THREE JS shaders
let sunShader
let planeShader

// Movement flags
let moveLeft = false
let moveRight = false
let canJump = false
let isInvulnerable = false
// Pressed ENTER flag
let gameStarted = false
let gameRestarted = false

let screenShake

// Global game variables
let score
let scoreText

let player

let obstacles = []
let obstacleSpeed = 10
let collisionPenalty
let lastObstaclePos = 0
let countObstacles = 0



/**
 * Function that updates game logic every frame
 */
function update() {

    // Game constants
    const delta = 5 * clock.getDelta()

    const rotateAnglePlayer = degToRad(10)
    const moveDistance = 30 * delta
    const jumpDistance = 80
    const posYInitital = 10

    const scoreIncrement = 0.3
    const maxObstacles = 12
    const baseSpeed = 10
    const scoreLeveler = 500

    // Logic for when the game starts
    if (gameStarted) {

        // GAME OVER
        if (score <= 0) {
            resetGame()
        }

        score += scoreIncrement
        // Update score text element
        scoreText.text(score.toFixed())

        // CREATION OF OBSTACLES    
        if (Math.random() < 0.06 && obstacles.length < maxObstacles)
            createObstacle()

        // Deal with socre penalties
        if (score.toFixed() < 120)
            collisionPenalty = 30
        else
            collisionPenalty = score.toFixed() * 0.25

        // Increment obstacle speed as the score increases
        if ((score.toFixed() % scoreLeveler) == 0)
            obstacleSpeed = baseSpeed +
                ((score.toFixed() / scoreLeveler) * 0.7)


        // COLLISIONS
        let playerCollider = new THREE.Box3().setFromObject(player)
        // Slightly reduce the size of the collider
        playerCollider.expandByScalar(-3.8)

        obstacles.forEach((obs, ndx) => {
            // Remove obstacle from the scene and array
            if (obs.mesh.position.z > camera.position.z) {
                scene.remove(obs.mesh.parent) //parent is the gltf.scene
                obstacles.splice(ndx, 1)
            } else {
                obs.mesh.position.z += obstacleSpeed
            }

            let colliderBox = new THREE.Box3().setFromObject(obs.mesh)
            let collision = playerCollider.intersectsBox(colliderBox)
            // Reduce score and remove 
            if (collision) {

                if (obs.type == 'fish') {

                    $('#message').css('display', 'block')
                    $('#message').css('color', 'green')
                    $('#message').text('Invulnerable!')

                    scene.remove(obs.mesh.parent)
                    obstacles.splice(ndx, 1)
                    isInvulnerable = true

                    setTimeout(() => {
                        $('#message').css('display', 'none')
                        isInvulnerable = false
                    }, 2500)

                } else if (obs.type == 'spike' && !isInvulnerable) {
                    score -= collisionPenalty
                    scene.remove(obs.mesh.parent)
                    obstacles.splice(ndx, 1)
                    scoreText.css('color', 'red')
                    changeTextColor('white')
                    shakeCamera([0, 0, 6], 300)
                }

            }

        })

        // MOVEMENT
        if (moveLeft) {

            if (player.position.x > -105)
                player.position.x -= moveDistance

            if (player.rotation.y > -rotateAnglePlayer)
                player.rotation.y -= degToRad(0.8)


        } if (moveRight) {

            if (player.position.x < 105)
                player.position.x += moveDistance

            if (player.rotation.y < rotateAnglePlayer)
                player.rotation.y += degToRad(0.8)

        }

        // Jump
        if (canJump && (player.position.y == posYInitital)) {
            player.position.y += jumpDistance
            canJump = false
        }
        // Return player to starting position
        if (player.position.y > posYInitital) {
            player.position.y -= 2.0

        }

    }

    // Small animation for game over
    if (gameRestarted) {
        player.position.y = 20
        player.rotation.y = degToRad(180)
        player.rotation.z += delta * 0.25
    }

    // Animations' mixers
    mixers.forEach((mixer) => {
        mixer.update(delta * 0.3)
    })

    // Change time value in shaders' uniforms
    if (planeShader) {
        planeShader.uniforms.time.value += delta * 0.2
        sunShader.uniforms.time.value += delta * 0.05
    }

    // Move seagulls, reset position once they reach the limit
    seagulls.forEach((obj) => {
        if (obj.scene.children[0].position.x >= 3600) {
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

    update()

    // Screen shake function update
    screenShake.update(camera)
}

/**
 * Initializes the main components of the scene
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
    let directionalLight = new THREE.DirectionalLight(0xffffff, .85);
    directionalLight.position.set(0, 400, 400)
    // Shadows
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -400;
    directionalLight.shadow.camera.right = 400;
    directionalLight.shadow.camera.top = 400;
    directionalLight.shadow.camera.bottom = -400;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 10000;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    // Add main light
    scene.add(directionalLight);

    // Hemisphere Light to make the scene more vibrant
    let hemisphereLight = new THREE.HemisphereLight(0xfc7384, 0xd0c8dd, 0.7);
    scene.add(hemisphereLight)


    const loadManager = new THREE.LoadingManager()
    gltfLoader = new THREE.GLTFLoader(loadManager)
    const textureLoader = new THREE.TextureLoader(loadManager)

    // loading bar elements
    const loadingElem = document.querySelector('#loading')
    const progressBarElem = loadingElem.querySelector('.progressbar')

    // Textures and models to load
    const planeTexture = textureLoader.load('../img/Project/plane.jpg')
    const playerModelUrl = './models/Penguin/penguin.gltf'
    const bearUrl = './models/Bear/bear.gltf'
    const seagullUrl = './models/Seagull/seagull.gltf'
    const walrusUrl = './models/Walrus/walrus.gltf'

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
    ]

    loadGLTFModels(objects)


    loadManager.onLoad = () => {

        loadingElem.style.display = 'none'
        $('#play-text').css('display', 'block')

        // Show play area
        initPlane(planeTexture, 6)

        //Add terrain
        const texture = generateNoiseTexture()
        const terrain = generateTerrain(texture)
        terrain.rotation.x = degToRad(-90)
        scene.add(terrain)

        // Add sun in the backgound
        initSun(1100)

        // Listen to ENTER press to start game
        document.addEventListener('keydown', (event) => {
            if (event.which == 13 && !gameStarted) {
                initGame()
                gameStarted = true
            }
        })

        // controls = new THREE.OrbitControls(camera, canvas)
        // controls.target.set(0, 0, 0)
        // controls.update()

        // In case window is resized
        window.addEventListener('resize', onWindowResize);

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



/******************GAME************************** */

function initGame() {

    // init score
    score = 1

    // Hide texts
    $('#play-text').css('display', 'none')
    $('#message').css('display', 'none')
    scoreText = $('#score')
    scoreText.css('display', 'block')

    //Background music
    if (!gameRestarted) {
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
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);

    } else {
        gameRestarted = false
        player.position.x = 0
        player.position.y = 10
        player.rotation.set(degToRad(-90), 0, degToRad(90))
    }

}


function resetGame() {

    gameStarted = false
    gameRestarted = true

    $('#message').css('display', 'block')
    $('#message').text('GAME OVER')
    $('#play-text').css('display', 'block')
    scoreText.css('display', 'none')

    obstacles.forEach((box) => {
        // Remove all obstacles
        scene.remove(box.mesh.parent)
    })

    obstacles = []

}


function shakeCamera(vector, duration) {
    screenShake.shake(camera, new THREE.Vector3(...vector), duration)
}



/******************INPUTS************************** */

function onKeyDown(event) {
    switch (event.keyCode) {


        case 37: // left
        case 65: // a
            moveLeft = true;
            break;

        case 39: // right
        case 68: // d
            moveRight = true;
            break;

        case 32: // space
            //if (canJump === true) 
            canJump = true;
            break;
    }

}

function onKeyUp(event) {

    switch (event.keyCode) {

        case 37: // left
        case 65: // a
            moveLeft = false;
            break;

        case 39: // right
        case 68: // d
            moveRight = false;
            break;

    }

}



/******************ENVIRONMENT************************** */

/**
 * Loads a list of GLTF models
 */
function loadGLTFModels(objs) {

    objs.forEach((obj) => {

        gltfLoader.load(obj.url, function (gltf) {

            if (obj.name === 'player') {
                player = gltf.scene.children[0]
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


/**
 * Create a obstacle from a model
 */
function createObstacle() {

    let url
    let type

    const friend = 'fish'
    const enemy = 'spike'

    if (countObstacles == 18) {
        type = friend
        url = './models/Fish/fish.gltf'
        countObstacles = 0
    } else {
        countObstacles += 1
        type = enemy
        url = './models/Spikes/spikeVertical.gltf'
    }

    let loader = new THREE.GLTFLoader()

    loader.load(url, function (gltf) {

        gltf.scene.traverse(function (object) {
            if (object.isMesh) {
                object.geometry.computeBoundingBox()
                object.castShadow = true
            }
        })

        let x = getRandomFloat(-105, 106)
        let z = -980
        let y

        if (type == friend) {
            y = 15
            gltf.scene.children[0].scale.set(5, 5, 5)
            gltf.scene.children[0].rotation.z = degToRad(90)

        } else if (type == enemy) {
            y = 80
            gltf.scene.children[0].scale.set(15, 15, 15)
            gltf.scene.children[0].rotation.z = Math.floor(getRandomFloat(0, 1.7)) == 0 ? degToRad(90) : 0
            gltf.scene.children[0].rotation.x = degToRad(90)

        }


        while (lastObstaclePos == x) {
            x = getRandomFloat(-105, 106)
        }

        gltf.scene.children[0].position.set(x, y, z)

        lastObstaclePos = x

        let obstacle = {
            mesh: gltf.scene.children[0],
            type
        }

        obstacles.push(obstacle)
        scene.add(gltf.scene)

    })

}


/**
 * Plane for the penguin
 */
function initPlane(t1, maxPlanes) {

    t1.wrapS = THREE.RepeatWrapping;
    t1.wrapT = THREE.RepeatWrapping;
    t1.repeat.set(1, maxPlanes)

    const mat = new THREE.MeshToonMaterial({
        map: t1,
        side: THREE.DoubleSide
    })

    mat.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 }
        shader.vertexShader = `
         uniform float time;
         ` + shader.vertexShader
        const token = '#include <begin_vertex>'
        const customTransform = `
        vec3 transformed = vec3(position);
        transformed.x = position.x + sin(position.y*10.0 + time*10.0)*1.2;
        transformed.y = position.y + sin(position.y*5.0 + time*10.0)*5.0;
        `
        shader.vertexShader =
            shader.vertexShader.replace(token, customTransform)
        planeShader = shader
    }

    const height = 300

    let geo = new THREE.PlaneBufferGeometry(250, height * maxPlanes, 32, 32);

    let plane = new THREE.Mesh(geo, mat)

    plane.position.z = -200
    plane.position.y = 0
    plane.rotation.x = degToRad(90)
    plane.receiveShadow = true
    scene.add(plane)

}


/**
 * Initialize sun object that shines in the background
 */
function initSun(radius) {
    let mat = new THREE.MeshLambertMaterial({
        color: 0xff6e7f,
        flatShading: true,
        //wireframe: true
    })

    mat.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 }
        shader.vertexShader = `
         uniform float time;
         ` + shader.vertexShader
        const token = '#include <begin_vertex>'
        const customTransform = `
            vec3 transformed = vec3(position);
            transformed.x = position.x + sin(position.x*15.0 + time*8.0)*15.0;
            transformed.y = position.y + sin(position.x*15.0 + time*8.0)*15.0;
            `
        shader.vertexShader =
            shader.vertexShader.replace(token, customTransform)
        sunShader = shader

    }

    let geo = new THREE.SphereBufferGeometry(radius, 16, 16)
    let mesh = new THREE.Mesh(geo, mat)

    mesh.position.x = 350
    mesh.position.y = -50
    mesh.position.z = -3500

    mesh.receiveShadow = true

    scene.add(mesh)
}



/******************TERRAIN************************** */
// Adapted from: https://blog.mozvr.com/low-poly-style-terrain-generation/

// Use SimplexNoise Library to generate noisy data
let simplex = new SimplexNoise(5)

/**
 * Utility function for the noise
 */
function noise(nx, ny) {
    // Rescale from -1.0:+1.0 to 0.0:1.0
    return simplex.noise2D(nx, ny) / 2 + 0.5;
}

/**
 * Utiility function for the noise
 * Stacks noisefields
 */
function octave(nx, ny, octaves) {

    let val = 0
    let freq = 1
    let max = 0
    let amp = 1

    for (let i = 0; i < octaves; i++) {

        val += noise(nx * freq, ny * freq) * amp
        max += amp
        amp /= 2
        freq *= 2

    }

    return val / max;

}

/**
 * Generates a texture from the noise data
 */
function generateNoiseTexture() {

    // Hidden debug canvas to generate texture 
    const canvasElement = document.getElementById('debug-canvas')
    const c = canvasElement.getContext('2d')

    for (let i = 0; i < canvasElement.width; i++) {

        for (let j = 0; j < canvasElement.height; j++) {

            let v = octave(i / canvasElement.width, j / canvasElement.height, 16)
            const per = (100 * v).toFixed(2) + '%'
            c.fillStyle = `rgb(${per},${per},${per})`
            c.fillRect(i, j, 1, 1)

        }

    }

    return c.getImageData(0, 0, canvasElement.width, canvasElement.height)

}

/**
 * Generates a plane terrain from noise texture
 * Receives the texture data
 */
function generateTerrain(data) {

    const planeGeo = new THREE.PlaneGeometry(data.width, data.height + 15, data.width, data.height + 1)

    for (let j = 0; j < data.height; j++) {

        for (let i = 0; i < data.width; i++) {

            const n = (j * (data.width) + i)
            const nn = (j * (data.width + 1) + i)
            const col = data.data[n * 4]
            const v1 = planeGeo.vertices[nn]

            v1.z = map(col, 0, 255, -10, 10)

        }
    }

    planeGeo.faces.forEach(face => {

        const a = planeGeo.vertices[face.a]
        const b = planeGeo.vertices[face.b]
        const c = planeGeo.vertices[face.c]
        const avg = (a.z + b.z + c.z) / 3
        const max = Math.max(a.z, Math.max(b.z, c.z))

        //if average is below water, set to 0
        if (avg < 0) {
            a.z = 0
            b.z = 0
            c.z = 0
        }

        //Assign colors to the faces
        if (max <= 0) return face.color.set(0x002171) // water
        if (max <= 1.5) return face.color.set(0x5472d3) // Base
        if (max <= 3.5) return face.color.set(0x4fc3f7)// Mid
        if (max <= 5) return face.color.set(0x29b6f6) // Mid-Top
        face.color.set(0x039be5) // Tops
    })

    planeGeo.colorsNeedUpdate = true
    planeGeo.verticesNeedUpdate = true
    planeGeo.computeFlatVertexNormals()

    const mesh = new THREE.Mesh(planeGeo, new THREE.MeshLambertMaterial({
        vertexColors: THREE.VertexColors,
        flatShading: true,
    }))
    mesh.position.x = 200
    mesh.position.y = -50
    mesh.position.z = -500

    mesh.receiveShadow = true

    mesh.scale.set(60, 60, 60) //Make the terrain larger
    return mesh

}


/******************HELPERS************************** */

/**
 * Helper map function
 */
function map(val, smin, smax, emin, emax) {
    const t = (val - smin) / (smax - smin)
    return (emax - emin) * t + emin
}

/**
 * Helper conversion function
 */
function degToRad(deg) {
    return deg * Math.PI / 180
}

/**
 * Generates random float in a range
 * Receives the inclusive min and exclusive max limit
 */
function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min)
}


function changeTextColor(color) {
    setTimeout(() => {
        scoreText.css('color', color)
    }, 550)
}


/**
 * Resizes the canvas when window is changed
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

