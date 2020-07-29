// Adapted from: https://blog.mozvr.com/low-poly-style-terrain-generation/

/**
 * Environment class that inits game's area
 */
class Environment {

    constructor() {
        // Extension of THREE shaders
        this.planeShader = null
        this.sunShader = null
        // Use SimplexNoise Library to generate noisy data
        this.simplex = new SimplexNoise(5)

        this.COLORS = {
            purple: 0x5472d3,
            lightBlue: 0x4fc3f7,
            blue: 0x29b6f6,
            ice: 0x039be5,
            water: 0x002171,
            sun: 0xff6e7f,
        }
    }


    /**
     * Utility function for the noise
     * @param {number} nx
     * @param {number} ny
     */
    noise(nx, ny) {
        // Rescale from -1.0:+1.0 to 0.0:1.0
        return this.simplex.noise2D(nx, ny) / 2 + 0.5
    }


    /**
     * Stacks noisefields
     * @param {number} nx 
     * @param {number} ny 
     * @param {number} octaves 
     */
    octave(nx, ny, octaves) {

        let val = 0
        let freq = 1
        let max = 0
        let amp = 1

        for (let i = 0; i < octaves; i++) {

            val += this.noise(nx * freq, ny * freq) * amp
            max += amp
            amp /= 2
            freq *= 2

        }

        return val / max

    }


    /**
     * Generates a texture from the noise data
     */
    generateNoiseTexture() {

        // Hidden debug canvas to generate texture 
        const canvasElement = document.getElementById('debug-canvas')
        const c = canvasElement.getContext('2d')

        for (let i = 0; i < canvasElement.width; i++) {

            for (let j = 0; j < canvasElement.height; j++) {

                let v = this.octave(i / canvasElement.width, j / canvasElement.height, 16)
                const per = (100 * v).toFixed(2) + '%'
                c.fillStyle = `rgb(${per},${per},${per})`
                c.fillRect(i, j, 1, 1)

            }

        }

        return c.getImageData(0, 0, canvasElement.width, canvasElement.height)

    }


    /**
     * Generates a plane terrain from noise texture
     * @param {ImageData} data 
     */
    generateTerrain(data) {

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
            if (max <= 0)
                return face.color.set(this.COLORS.water)
            if (max <= 1.5)
                return face.color.set(this.COLORS.purple) // Base
            if (max <= 3.5)
                return face.color.set(this.COLORS.lightBlue) // Mid
            if (max <= 5)
                return face.color.set(this.COLORS.blue) // Mid-Top
            face.color.set(this.COLORS.ice) // Tops
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


    /**
     * Generates plane for player-controlled penguin
     * @param {Texture} texture 
     * @param {number} maxPlanes 
     */
    initPlane(texture, maxPlanes) {

        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(1, maxPlanes)

        const mat = new THREE.MeshToonMaterial({
            map: texture,
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
            this.planeShader = shader
        }

        const height = 300

        let geo = new THREE.PlaneBufferGeometry(250, height * maxPlanes, 32, 32)

        let plane = new THREE.Mesh(geo, mat)

        plane.position.z = -200
        plane.position.y = 0
        plane.rotation.x = degToRad(90)
        plane.receiveShadow = true
        scene.add(plane)

    }


    /**
     * Initialize sun object that shines in the background
     * @param {number} radius 
     */
    initSun(radius) {
        let mat = new THREE.MeshLambertMaterial({
            color: this.COLORS.sun,
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
            this.sunShader = shader

        }

        let geo = new THREE.SphereBufferGeometry(radius, 16, 16)
        let mesh = new THREE.Mesh(geo, mat)

        mesh.position.x = 350
        mesh.position.y = -50
        mesh.position.z = -3500

        mesh.receiveShadow = true

        scene.add(mesh)
    }

}
