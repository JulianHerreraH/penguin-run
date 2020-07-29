class InputManager {

    constructor() {
        this.moveLeft = false
        this.moveRight = false
        this.canJump = false
        this.canShoot = false
    }

    onKeyDown(event) {
        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                this.canShoot = true;
                break;

            case 37: // left
            case 65: // a
                this.moveLeft = true;
                break;

            case 39: // right
            case 68: // d
                this.moveRight = true;
                break;

            case 32: // space
                this.canJump = true;
                break;
        }

    }

    onKeyUp(event) {

        switch (event.keyCode) {

            case 37: // left
            case 65: // a
                this.moveLeft = false;
                break;

            case 39: // right
            case 68: // d
                this.moveRight = false;
                break;

        }

    }

    o


}
