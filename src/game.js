class Game {
    constructor(width = 10, height = 10, numberOfBombs = 10, squareSize = 32) {
        this.__width = Math.max(width, 9);
        this.__height = Math.max(height, 9);
        this.__numberOfBombs = Math.min(numberOfBombs, Math.floor(0.85 * this.__width * this.__height));
        this.__squareSize = squareSize;
        this.__bumble = new Bumble('mine sweeper', this.__width * squareSize, this.__height * squareSize + squareSize, BumbleColor.fromRGB(128, 128, 128), 60);
        this.__reset();
        this.__bumble.runCoroutine(this.init.bind(this));
        this.__images = {};
    }

    __reset() {
        let restarts = this.__bumble.gameState.getState('restarts');
        if (!!restarts) {
            restarts = 0;
        } else {
            restarts += 1;
        }
        this.__bumble.gameState.setState('restarts', restarts);

        this.__grid = new Grid(this.__bumble, this.__width, this.__height, 0, this.__squareSize);
        this.__running = true;
        this.__map = [];
        this.__started = false;
        this.__timeTaken = 0;
        this.__flagsPlaced = 0;
        this.__playing = true;
        this.__wonGame = false;
            
        for (let x = 0; x < this.__width; ++x) {
            const inner = [];
            for (let y = 0; y < this.__height; ++y) {
                inner.push({
                    bomb: false,
                    bombCount: 0,
                    visited: false,
                    flagged: false
                });
            }
            this.__map.push(inner);
        }

        this.mouseButtonState = [false, false, false];
    }

    __mouseReleased(number) {
        const mouseState = this.__bumble.mouse.mouseState.buttonState[number];
        const buttonReleased = this.mouseButtonState[number] && !mouseState;
        this.mouseButtonState[number] = mouseState;
        return buttonReleased;
    }

    __addBombs(startPos) {
        let bombsRemaining = this.__numberOfBombs;
        while (bombsRemaining > 0) {
            const pos = new BumbleVector(Math.floor(Math.random() * this.__width), Math.floor(Math.random() * this.__height));
            if (pos.x != startPos.x && pos.y != startPos.y && !this.__map[pos.x][pos.y].bomb) {
                this.__map[pos.x][pos.y].bomb = true;
                bombsRemaining -= 1;
            }
        }
    }

    __buildNumbers() {
        const areas = [
            new BumbleVector(0,1),
            new BumbleVector(1,1),
            new BumbleVector(1,0),
            new BumbleVector(1,-1),
            new BumbleVector(0,-1),
            new BumbleVector(-1,-1),
            new BumbleVector(-1,0),
            new BumbleVector(-1,1)
        ];
        for (let x = 0; x < this.__width; ++x) {
            for (let y = 0; y < this.__height; ++y) {
                let bombCount = 0;
                for (let area of areas) {
                    const n = new BumbleVector(area.x + x, area.y + y);
                    if (n.x >= 0 && n.x < this.__width && n.y >= 0 && n.y < this.__height) {
                        if (this.__map[n.x][n.y].bomb) {
                            bombCount += 1;
                        }
                    }
                }
                this.__map[x][y].bombCount = bombCount;
            }
        }
    }

    __clearMap(pos) {
        const areas = [
            new BumbleVector(0,1),
            new BumbleVector(1,0),
            new BumbleVector(0,-1),
            new BumbleVector(-1,0)
        ];
        this.__map[pos.x][pos.y].visited = true;
        const queue = [pos];
        while (queue.length > 0) {
            const mapItem = queue.shift();
            for (let area of areas) {
                const n = new BumbleVector(area.x + mapItem.x, area.y + mapItem.y);
                if (n.x >= 0 && n.x < this.__width && n.y >= 0 && n.y < this.__height) {
                    const mapItem = this.__map[n.x][n.y];
                    if (!mapItem.bomb && !mapItem.visited && !mapItem.flagged) {
                        mapItem.visited = true;
                        if (mapItem.bombCount == 0) {
                            queue.push(n);
                        }
                    }
                }
            }
        }
    }

    __getImage(mapItem, showBombs = false) {
        let image = this.__images['blank'];
        if (mapItem.flagged) {
            image = this.__images['flag'];
        } else if (mapItem.visited) {
            if (mapItem.bomb) {
                image = this.__images['bomb'];
            } else if (mapItem.bombCount > 0) {
                image =  this.__images[mapItem.bombCount.toString()];
            } else {
                image = this.__images['empty'];
            }
        }
        if (showBombs && mapItem.bomb) {
            image = this.__images['bomb'];
        }

        return image;
    }

    *init() {
        this.__images['1'] = yield this.__bumble.getImage('img/1.png');
        this.__images['1'].setSize(this.__squareSize, this.__squareSize);
        this.__images['2'] = yield this.__bumble.getImage('img/2.png');
        this.__images['2'].setSize(this.__squareSize, this.__squareSize);
        this.__images['3'] = yield this.__bumble.getImage('img/3.png');
        this.__images['3'].setSize(this.__squareSize, this.__squareSize);
        this.__images['4'] = yield this.__bumble.getImage('img/4.png');
        this.__images['4'].setSize(this.__squareSize, this.__squareSize);
        this.__images['5'] = yield this.__bumble.getImage('img/5.png');
        this.__images['5'].setSize(this.__squareSize, this.__squareSize);
        this.__images['6'] = yield this.__bumble.getImage('img/6.png');
        this.__images['6'].setSize(this.__squareSize, this.__squareSize);
        this.__images['7'] = yield this.__bumble.getImage('img/7.png');
        this.__images['7'].setSize(this.__squareSize, this.__squareSize);
        this.__images['8'] = yield this.__bumble.getImage('img/8.png');
        this.__images['8'].setSize(this.__squareSize, this.__squareSize);
        this.__images['empty'] = yield this.__bumble.getImage('img/empty.png');
        this.__images['empty'].setSize(this.__squareSize, this.__squareSize);
        this.__images['blank'] = yield this.__bumble.getImage('img/blank.png');
        this.__images['blank'].setSize(this.__squareSize, this.__squareSize);
        this.__images['flag'] = yield this.__bumble.getImage('img/flag.png');
        this.__images['flag'].setSize(this.__squareSize, this.__squareSize);
        this.__images['bomb'] = yield this.__bumble.getImage('img/bomb.png');
        this.__images['bomb'].setSize(this.__squareSize, this.__squareSize);
        this.__images['smile'] = yield this.__bumble.getImage('img/smile.jpg');
        this.__images['smile'].setSize(this.__squareSize, this.__squareSize);
        this.__bumble.runCoroutine(this.update.bind(this));
        this.__bumble.runCoroutine(this.render.bind(this));
        this.__bumble.runCoroutine(function *() {
            while (this.__running) {
                if (this.__started && this.__playing) {
                    this.__timeTaken += 1;
                    yield BumbleUtility.wait(1);
                } else {
                    yield;
                }
            }
        }.bind(this));
    }

    *update() {
        while (this.__running) {
            const clicked = this.__mouseReleased(0);
            if (this.__playing) {
                if (clicked) {
                    const clickPos = this.__bumble.mouse.mouseState.position;
                    if (clickPos.y >= this.__squareSize) {
                        const gridPos = this.__grid.worldToGrid(clickPos.x, clickPos.y);
                        if (!this.__started) {
                            this.__started = true;            
                            this.__addBombs(gridPos);
                            this.__buildNumbers();
                            this.__clearMap(gridPos);
                        } else {
                            const mapItem = this.__map[gridPos.x][gridPos.y];
                            if (!mapItem.flagged && !mapItem.visited) {
                                if (mapItem.bomb) {
                                    this.__playing = false;
                                } else {
                                    this.__clearMap(gridPos);
                                }
                            }
                        }
                    }
                } else if (this.__mouseReleased(2) && this.__started) {
                    const clickPos = this.__bumble.mouse.mouseState.position;
                    const gridPos = this.__grid.worldToGrid(clickPos.x, clickPos.y);
                    const mapItem = this.__map[gridPos.x][gridPos.y];
                    if (!mapItem.visited && ((this.__flagsPlaced != this.__numberOfBombs) || mapItem.flagged)) {
                        if (mapItem.flagged) {
                            mapItem.flagged = false;
                            this.__flagsPlaced -= 1;
                        } else {
                            mapItem.flagged = true;
                            this.__flagsPlaced += 1;
                            this.__checkWin();
                        }
                    }
                }
            } 
            if (clicked) {
                const clickPos = this.__bumble.mouse.mouseState.position;
                if (clickPos.x > this.__bumble.width / 2.0 - this.__squareSize / 2.0, clickPos.x < this.__bumble.width / 2.0 + this.__squareSize / 2.0 && clickPos.y < this.__squareSize) {
                    this.__reset();
                }
            }
            yield;
        }
    }

    __checkWin() {
        if (this.__flagsPlaced == this.__numberOfBombs) {
            let misMatch = false;
            for (let x = 0; x < this.__map.length; ++x) {
                for (let y = 0; y < this.__map[x].length; ++y) {
                    const mapItem = this.__map[x][y];
                    if (mapItem.bomb && !mapItem.flagged) {
                        misMatch = true;
                        break;
                    }
                }
            }
            if (!misMatch) {
                this.__playing = false;
                this.__wonGame = true;
            }
        }
    }

    __drawTime() {
        this.__bumble.context.save();
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(this.__bumble.width - 40, 2, 38, this.__squareSize - 4);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "15px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText(this.__timeTaken.toString().padStart(3, 0), this.__bumble.width - 19, this.__squareSize - 5, 36);
        this.__bumble.context.restore();
    }

    __drawFlagsRemaining() {
        this.__bumble.context.save();
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(2, 2, 38, this.__squareSize - 4);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "15px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText((this.__numberOfBombs - this.__flagsPlaced).toString().padStart(3, 0), 19, this.__squareSize - 5, 36);
        this.__bumble.context.restore();
    }

    __drawLose() {
        this.__bumble.context.save();
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(this.__bumble.width * 0.15, this.__bumble.height * 0.15, this.__bumble.width * 0.7, this.__bumble.height * 0.7);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "60px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText('You Lose', this.__bumble.width / 2.0, this.__bumble.height / 2.0, this.__bumble.width * 0.85);
        this.__bumble.context.restore();
    }

    __drawWin() {
        this.__bumble.context.save();
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(this.__bumble.width * 0.15, this.__bumble.height * 0.15, this.__bumble.width * 0.7, this.__bumble.height * 0.7);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "60px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText('You Win', this.__bumble.width / 2.0, this.__bumble.height / 2.0, this.__bumble.width * 0.85);
        this.__bumble.context.restore();
    }

    *render() {
        while (this.__running) {
            this.__bumble.clearScreen();
            const smileImage = this.__images['smile'];
            smileImage.position = new BumbleVector(this.__bumble.width / 2.0, this.__squareSize / 2.0);
            smileImage.draw();
            for (let x = 0; x < this.__map.length; ++x) {
                for (let y = 0; y < this.__map[x].length; ++y) {
                    const image = this.__getImage(this.__map[x][y], !this.__playing && !this.__wonGame);
                    image.position = this.__grid.gridToWorld(x, y);
                    image.draw();
                }
            }
            //this.__grid.render();
            this.__drawFlagsRemaining();
            this.__drawTime();
            if (!this.__playing) {
                if (this.__wonGame) {
                    this.__drawWin();
                } else {
                    this.__drawLose();
                }
            }
            yield;
        }
    }
}