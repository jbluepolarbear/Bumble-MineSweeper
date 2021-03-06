class Game {
    constructor(width = 10, height = 10, numberOfBombs = 10, squareSize = 32) {
        this.__width = Math.max(width, 9);
        this.__height = Math.max(height, 9);
        this.__numberOfBombs = Math.min(numberOfBombs, Math.floor(0.85 * this.__width * this.__height));
        this.__squareSize = squareSize;
        this.__bumble = new Bumble('mine sweeper', this.__width * squareSize, this.__height * squareSize + squareSize, BumbleColor.fromRGB(128, 128, 128), 60);
        this.__bumble.loaderBackgroundColor = 'blue';
        this.__bumble.loaderProgressBackgroundColor = 'grey';
        this.__bumble.loaderProgressColor = 'black';
        this.__reset();
        this.__bumble.runCoroutine(this.init.bind(this));
        this.__images = {};
        this.__bumble.preloader.loadAll([
            new BumbleResource('1', 'img/1.png', 'image'),
            new BumbleResource('2', 'img/2.png', 'image'),
            new BumbleResource('3', 'img/3.png', 'image'),
            new BumbleResource('4', 'img/4.png', 'image'),
            new BumbleResource('5', 'img/5.png', 'image'),
            new BumbleResource('6', 'img/6.png', 'image'),
            new BumbleResource('7', 'img/7.png', 'image'),
            new BumbleResource('8', 'img/8.png', 'image'),
            new BumbleResource('blank', 'img/blank.png', 'image'),
            new BumbleResource('empty', 'img/empty.png', 'image'),
            new BumbleResource('bomb', 'img/bomb.png', 'image'),
            new BumbleResource('flag', 'img/flag.png', 'image'),
            new BumbleResource('smile', 'img/smile.jpg', 'image'),
            new BumbleResource('ambient', 'audio/PM_CS_ambiance_1.mp3', 'audio'),
            new BumbleResource('clicked', 'audio/PM_CS_click_glassy.mp3', 'audio'),
            new BumbleResource('failed', 'audio/PM_CS_close_complex.mp3', 'audio')
        ]);
    }

    __reset() {
        let restarts = this.__bumble.gameState.getState('restarts');
        if (restarts == null) {
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
        this.__images['1'] = this.__bumble.getImage('1');
        this.__images['2'] = this.__bumble.getImage('2');
        this.__images['3'] = this.__bumble.getImage('3');
        this.__images['4'] = this.__bumble.getImage('4');
        this.__images['5'] = this.__bumble.getImage('5');
        this.__images['6'] = this.__bumble.getImage('6');
        this.__images['7'] = this.__bumble.getImage('7');
        this.__images['8'] = this.__bumble.getImage('8');
        this.__images['empty'] = this.__bumble.getImage('empty');
        this.__images['blank'] = this.__bumble.getImage('blank');
        this.__images['flag'] = this.__bumble.getImage('flag');
        this.__images['bomb'] = this.__bumble.getImage('bomb');
        this.__images['smile'] = this.__bumble.getImage('smile');
        this.__imageTransform = new BumbleTransformation(this.__images['1'].width, this.__images['1'].height);
        this.__imageTransform.scale = new BumbleVector(this.__squareSize / this.__imageTransform.width, this.__squareSize / this.__imageTransform.height);
        //this.__imageTransform.anchor = new BumbleVector(this.__squareSize / 2, this.__squareSize / 2);
        this.__ambientSound = this.__bumble.getAudio('ambient');
        this.__ambientSound.play();
        this.__ambientSound.loop = true;
        this.__clickedSound = this.__bumble.getAudio('clicked');
        this.__failedSound = this.__bumble.getAudio('failed');
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
            if (clicked) {
                this.__clickedSound.play();
            }
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
                                    this.__failedSound.play();
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
        this.__bumble.context.setTransform(1, 0, 0, 1, 0, 0);
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(this.__bumble.width - 40, 2, 38, this.__squareSize - 4);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "15px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText(this.__timeTaken.toString().padStart(3, 0), this.__bumble.width - 19, this.__squareSize - 5, 36);
    }

    __drawFlagsRemaining() {
        this.__bumble.context.setTransform(1, 0, 0, 1, 0, 0);
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(2, 2, 38, this.__squareSize - 4);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "15px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText((this.__numberOfBombs - this.__flagsPlaced).toString().padStart(3, 0), 19, this.__squareSize - 5, 36);
    }

    __drawLose() {
        this.__bumble.context.setTransform(1, 0, 0, 1, 0, 0);
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(this.__bumble.width * 0.15, this.__bumble.height * 0.15, this.__bumble.width * 0.7, this.__bumble.height * 0.7);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "60px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText('You Lose', this.__bumble.width / 2.0, this.__bumble.height / 2.0, this.__bumble.width * 0.85);
    }

    __drawWin() {
        this.__bumble.context.setTransform(1, 0, 0, 1, 0, 0);
        this.__bumble.context.fillStyle = BumbleColor.fromRGBA(0, 0, 0, 0.5);
        this.__bumble.context.fillRect(this.__bumble.width * 0.15, this.__bumble.height * 0.15, this.__bumble.width * 0.7, this.__bumble.height * 0.7);
        this.__bumble.context.fillStyle = BumbleColor.fromRGB(255, 255, 255);
        this.__bumble.context.font = "60px Arial";
        this.__bumble.context.textAlign = "center";
        this.__bumble.context.fillText('You Win', this.__bumble.width / 2.0, this.__bumble.height / 2.0, this.__bumble.width * 0.85);
    }

    *render() {
        while (this.__running) {
            this.__bumble.clearScreen();
            const smileImage = this.__images['smile'];
            this.__imageTransform.position = new BumbleVector(this.__bumble.width / 2.0, this.__squareSize / 2.0);
            this.__bumble.applyTransformation(this.__imageTransform.build());
            smileImage.draw();
            for (let x = 0; x < this.__map.length; ++x) {
                for (let y = 0; y < this.__map[x].length; ++y) {
                    const image = this.__getImage(this.__map[x][y], !this.__playing && !this.__wonGame);
                    this.__imageTransform.position = this.__grid.gridToWorld(x, y);
                    this.__bumble.applyTransformation(this.__imageTransform.build());
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
