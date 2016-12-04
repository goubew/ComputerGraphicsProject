function Voxel(red, green, blue) {
    this.state = false;
    this.red = red;
    this.green = green;
    this.blue = blue;
};

Voxel.prototype.setColor = function(red, green, blue) {
    this.red = red;
    this.green = green;
    this.blue = blue;
};

Voxel.prototype.toggle = function() {
    this.state = !this.state;
};

function VoxelGrid() {
    this.data = new Array();
    this.voxelScale = 10.0;
    this.colorScale = 255;
    this.requiresCacheUpdate = false;

    this.cache = {
        positions: [],
        colors: [],
        pickingColors: []
    };

    //Populate the data with empty voxels
    for (var i = 0; i < 10; i++) {
        this.data.push(new Array());
        for (var j = 0; j < 10; j++) {
            this.data[i].push(new Array());
            for (var k = 0; k < 10; k++) {
                this.data[i][j].push(new Voxel(0, 0, 0));
            }
        }
    }

};

VoxelGrid.prototype.checkVoxelPosition = function(axis) {
    return (axis >= 0 && axis < 10);
};

VoxelGrid.prototype.checkVoxelColor = function(color) {
    return (color >= 0 && color < 256);
};

VoxelGrid.prototype.checkVoxelData = function(x, y, z, r, g, b) {
    return (this.checkVoxelPosition(x) && this.checkVoxelPosition(y) && this.checkVoxelPosition(z) && this.checkVoxelColor(r) && this.checkVoxelColor(g) && this.checkVoxelColor(b));
};

VoxelGrid.prototype.placeVoxel = function(x, y, z, r, g, b) {
    //Check to make sure that the voxel can fit within the data
    if (this.checkVoxelData(x, y, z, r, g, b)) {
        var currentVoxel = this.data[x][y][z];
        currentVoxel.red = r;
        currentVoxel.green = g;
        currentVoxel.blue = b;
        currentVoxel.state = true;

        this.requiresCacheUpdate = true;
    }
};

VoxelGrid.prototype.serialize = function() {
    return "Serialization not yet implemented";
};

VoxelGrid.prototype.quad = function(a, b, c, d, xoff, yoff, zoff) {
    var quadPoints = [];

    var quadVertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ), //up bot-left
        vec4( -0.5,  0.5,  0.5, 1.0 ), //up top-left
        vec4(  0.5,  0.5,  0.5, 1.0 ), //up top-right
        vec4(  0.5, -0.5,  0.5, 1.0 ), //up bot-right
        vec4( -0.5, -0.5, -0.5, 1.0 ), //down bot-left
        vec4( -0.5,  0.5, -0.5, 1.0 ), //down top-left
        vec4(  0.5,  0.5, -0.5, 1.0 ), //down top-right
        vec4(  0.5, -0.5, -0.5, 1.0 )  //down bot-right
    ];

    for (var i = 0; i < quadVertices.length; i++) {
        quadVertices[i][0] += xoff;
        quadVertices[i][1] += yoff;
        quadVertices[i][2] += zoff;
    }

    var indices = [ a, b, c, a, c, d ];

    for (var j = 0; j < indices.length; j++) {
        quadPoints.push( quadVertices[indices[j]] );
    }

    return quadPoints;
};

VoxelGrid.prototype.scalePoint = function(pt) {
    return vec4(pt[0] / this.voxelScale, pt[1] / this.voxelScale, pt[2] / this.voxelScale, 1.0);
};

VoxelGrid.prototype.calcCubeTriangles = function(voxel, x, y, z) {
    var xoff = x;
    var yoff = y;
    var zoff = z;
    var dataPoints = [];

    dataPoints = dataPoints.concat(this.quad( 1, 0, 3, 2, xoff, yoff, zoff));
    dataPoints = dataPoints.concat(this.quad( 2, 3, 7, 6, xoff, yoff, zoff));
    dataPoints = dataPoints.concat(this.quad( 3, 0, 4, 7, xoff, yoff, zoff));
    dataPoints = dataPoints.concat(this.quad( 6, 5, 1, 2, xoff, yoff, zoff));
    dataPoints = dataPoints.concat(this.quad( 4, 5, 6, 7, xoff, yoff, zoff));
    dataPoints = dataPoints.concat(this.quad( 5, 4, 0, 1, xoff, yoff, zoff));

    for (var i = 0; i < dataPoints.length; i++) {
        dataPoints[i] = this.scalePoint(dataPoints[i]);
    }

    return dataPoints;
};

VoxelGrid.prototype.to3DPoints = function() {
    if (this.requiresCacheUpdate) {
        this.cache = {
            positions: [],
            colors: [],
            pickingColors: []
        };

        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                for (var k = 0; k < 10; k++) {
                    var currentVoxel = this.data[i][j][k];
                    if (currentVoxel.state) {
                        //Write out the triangles that make up the voxel at that point
                        this.cache.positions = this.cache.positions.concat(this.calcCubeTriangles(currentVoxel, i, j, k));

                        //Add the actual rgb colors of the pixels
                        var newR = currentVoxel.red / this.colorScale;
                        var newG = currentVoxel.green / this.colorScale;
                        var newB = currentVoxel.blue / this.colorScale;

                        var newColor = vec4(newR, newG, newB, 1.0);

                        for (var times = 0; times < 36; times++) {
                            this.cache.colors.push(newColor);
                        }

                        //Add some rgb values equal to the postion of the center of the voxel
                        //This is used when picking voxels to determine the face to add to
                        newR = i / 10;
                        newG = j / 10;
                        newB = k / 10;

                        for (times = 0; times < 36; times++) {
                            var alphaTest = 0;

                            if (times < 6) {
                                alphaTest = 0.50;
                            }
                            else if (times < 12) {
                                alphaTest = 0.60;
                            }
                            else if (times < 18) {
                                alphaTest = 0.70;
                            }
                            else if (times < 24) {
                                alphaTest = 0.80;
                            }
                            else if (times < 30) {
                                alphaTest = 0.90;
                            }
                            else if (times < 36) {
                                alphaTest = 1.0;
                            }

                            newColor = vec4(newR, newG, newB, alphaTest);
                            this.cache.pickingColors.push(newColor);
                        }
                    }
                }
            }
        }
        this.requiresCacheUpdate = false;
    }
    return this.cache;
};
