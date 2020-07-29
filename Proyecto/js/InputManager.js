/**
 * InputManager class for the state of user's inputs
 */
class InputManager {

    constructor() {
        this.moveLeft = false
        this.moveRight = false
        this.canJump = false
        this.canShoot = false
    }


    /**
     * Checks event triggered by a key down listener
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                this.canShoot = true
                break

            case 37: // left
            case 65: // a
                this.moveLeft = true
                break

            case 39: // right
            case 68: // d
                this.moveRight = true
                break

            case 32: // space
                this.canJump = true
                break
        }

    }


    /**
     * Checks event triggered by a key up listener
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event) {

        switch (event.keyCode) {

            case 37: // left
            case 65: // a
                this.moveLeft = false
                break

            case 39: // right
            case 68: // d
                this.moveRight = false
                break

        }

    }

}
