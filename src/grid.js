class Grid {
    constructor(bumble, width, height, xOffset = 0, yOffset = 0) {
        this.__bumble = bumble;
        this.__width = width;
        this.__height = height;
        if ((this.__bumble.height - yOffset) / this.__height < (this.__bumble.width - xOffset) / this.__width) {
            this.__squareSize = Math.floor((this.__bumble.height - yOffset) / this.__height);
        } else {
            this.__squareSize = Math.floor((this.__bumble.width - xOffset) / this.__width);
        }
        this.xOffset = ((this.__bumble.width - xOffset) - this.__squareSize * this.__width) / 2 + xOffset;
        this.yOffset = ((this.__bumble.height - yOffset) - this.__squareSize * this.__height) / 2 + yOffset;
    }

    render() {
        this.__bumble.context.save();
        this.__bumble.context.translate(this.xOffset, this.yOffset);
        this.__bumble.context.strokeStyle = BumbleColor.fromRGB(255, 255, 255);
        for (var x = 1; x < this.__width; ++x) {
            BumbleUtility.line(this.__bumble.context, x * this.__squareSize, 0, x * this.__squareSize, this.__height * this.__squareSize);
        }
        for (var y = 1; y < this.__height; ++y) {
            BumbleUtility.line(this.__bumble.context, 0, y * this.__squareSize, this.__width * this.__squareSize, y * this.__squareSize);
        }
        this.__bumble.context.restore();
    }

    gridToWorld(xGrid, yGrid) {
        return new BumbleVector(xGrid * this.__squareSize + this.xOffset + this.__squareSize / 2.0, yGrid * this.__squareSize + this.yOffset + this.__squareSize / 2.0);
    }

    worldToGrid(xWorld, yWorld) {
        return new BumbleVector(
            BumbleUtility.clamp(Math.floor((xWorld - this.xOffset) / this.__squareSize), 0, this.__width - 1),
            BumbleUtility.clamp(Math.floor((yWorld - this.yOffset) / this.__squareSize), 0, this.__height - 1)
        );
    }
    
    fillSquare(xGrid, yGrid, inColor) {
        this.__bumble.context.save();
        var position = this.gridToWorld(xGrid, yGrid);
        this.__bumble.context.translate(position.x, position.y);
        this.__bumble.context.fillStyle = inColor;
        var dimming = 0;
        this.__bumble.context.fillRect(dimming, dimming, this.__squareSize - dimming*2, this.__squareSize - dimming*2, 5);
        this.__bumble.context.restore();
    }
}