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
    this.voxelScale = 2.0;
    this.colorScale = 255;
    this.requiresCacheUpdate = false;

    this.cache = {
        positions: [],
        colors:[]
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

VoxelGrid.prototype.placeVoxel = function(x, y, z, r, g, b) {
    var currentVoxel = this.data[x][y][z];
    currentVoxel.red = r;
    currentVoxel.green = g;
    currentVoxel.blue = b;
    currentVoxel.state = true;

    this.requiresCacheUpdate = true;
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
            colors:[]
        };

        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                for (var k = 0; k < 10; k++) {
                    var currentVoxel = this.data[i][j][k];
                    if (currentVoxel.state) {
                        //Write out the triangles that make up the voxel at that point
                        this.cache.positions = this.cache.positions.concat(this.calcCubeTriangles(currentVoxel, i, j, k));

                        var newR = currentVoxel.red / this.colorScale;
                        var newG = currentVoxel.green / this.colorScale;
                        var newB = currentVoxel.blue / this.colorScale;

                        var newColor = vec4(newR, newG, newB);
                        console.log(JSON.stringify(newColor));

                        for (var times = 0; times < 36; times++) {
                            this.cache.colors.push(newColor);
                        }
                    }
                }
            }
        }
        this.requiresCacheUpdate = false;
    }
    return this.cache;
};
