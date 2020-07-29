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


/**
 * Resizes the canvas when window is changed
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}
