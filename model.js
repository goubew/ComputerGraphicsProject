function Voxel(red, green, blue) {
    this.state = false;
    this.red = red;
    this.green = green;
    this.blue = blue;

    this.setColor = function(red, green, blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    };

    this.toggle = function() {
        this.state = !this.state;
    };
};

function VoxelGrid() {
    this.data = new Array();

    //Populate the data with empty voxels
    for (var i = 0; i < 10; i++) {
        this.data.push(new Array());
        for (var j = 0; j < 10; j++) {
            this.data[i].push(new Array());
            for (var k = 0; k < 10; k++) {
                this.data[i][j][k].push(new Voxel(0, 0, 0));
            }
        }
    }

    this.placevoxel = function(x, y, z, r, g, b) {
        var currentVoxel = this.data[x][y][z];
        currentVoxel.red = r;
        currentVoxel.green = g;
        currentVoxel.blue = b;
        currentVoxel.state = true;
    };

    this.serialize = function() {
        return "Serialization not yet implemented";
    };

    this.to3DPoints = function() {
        var points = [];
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                for (var k = 0; k < 10; k++) {
                    var currentVoxel = this.data[x][y][z];
                    if (currentVoxel.state) {
                        //TODO: convert the voxel into Vec3 points and add them to the points array
                    }
                }
            }
        }
        return points;
    };
};

