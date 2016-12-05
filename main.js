var gl;

var d, p, r;

var voxelData;
var model = new VoxelGrid();

var dragging = false;
var dragCount = 0;

var deg_to_rad = Math.PI/180;
var canvas;

var bufferIds;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //Place a floor of voxels
    for (var i1 = 0; i1 < 10; i1++) {
        for (var j1 = 0; j1 < 10; j1++) {
            model.placeVoxel(i1, j1, 0, i1/10 * 255, j1/10 * 255, 255);
        }
    }

    voxelData = model.to3DPoints();

    //
    //  Configure WebGL
    //

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var positionBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.positions), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var pickColorBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, pickColorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.pickingColors), gl.STATIC_DRAW );

    var vPickColor = gl.getAttribLocation( program, "vPickColor" );
    gl.vertexAttribPointer( vPickColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPickColor );

    bufferIds = {
        positionBufferId: positionBufferId,
        colorBufferId: colorBufferId,
        pickColorBufferId: pickColorBufferId
    };

    //Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    d = 0;
    p = 10 * deg_to_rad;
    r = 0;

    var rMatrixLoc = gl.getUniformLocation( program, "rMatrix" );
    var picking = gl.getUniformLocation( program, "picking");

    canvas.addEventListener("mousedown", doMouseDown, false);

    render(voxelData.positions.length, rMatrixLoc, picking);

    /* Event Declarations */
    function doMouseDown(evt) {
        if (dragging)
           return;
        document.addEventListener("mouseup", doMouseUp, false);

        var box = canvas.getBoundingClientRect();
        prevx = window.pageXOffset + evt.clientX - box.left;
        prevy = window.pageYOffset + evt.clientY - box.top;

        var colx = prevx;
        var coly = canvas.height - prevy;

        if (evt.shiftKey) {
            pickRender(voxelData.positions.length, rMatrixLoc, picking, colx, coly, bufferIds);
        }
        dragging = true;
        document.addEventListener("mousemove", doMouseDrag, false);
    }
    function doMouseDrag(evt) {
        if (!dragging)
           return;
        var box = canvas.getBoundingClientRect();
        var x = window.pageXOffset + evt.clientX - box.left;
        var y = window.pageYOffset + evt.clientY - box.top;

        d += (((x- prevx) * -1) * deg_to_rad);
        p += (((y- prevy) * 1) * deg_to_rad);

        //p = Math.max(10*deg_to_rad, Math.min(p, 40* deg_to_rad));

        prevx = x;
        prevy = y;
        if (render && dragCount % 5 == 0) {
            render(voxelData.positions.length, rMatrixLoc, picking);
        }
        dragCount += 1;
    }
    function doMouseUp(evt) {
        if (dragging) {
            document.removeEventListener("mousemove", doMouseDrag, false);
            document.removeEventListener("mouseup", doMouseUp, false);
        dragging = false;
        }
        render(voxelData.positions.length, rMatrixLoc, picking);
    }

    fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0];
        var textType = /text.*/;

        if (file.type.match(textType)) {
            var reader = new FileReader();

            reader.onload = function(e) {
                loadModel(reader.result, rMatrixLoc, picking);
            };

            reader.readAsText(file);
        } else {
            fileDisplayArea.innerText = "File not supported!";
        }
    });
};

function sendRotationMatrix(rMatrixLoc) {

    var r_matrix = [ Math.cos(d)*Math.cos(r),Math.cos(d)*Math.sin(r), -1*Math.sin(d),0,
                    (Math.sin(p)*Math.sin(d)*Math.cos(r) - Math.cos(p)*Math.sin(r)), (Math.sin(p)*Math.sin(d)*Math.sin(r) + Math.cos(p)*Math.cos(r)), Math.sin(p)*Math.cos(d), 0,
                    (Math.cos(p)*Math.sin(d)*Math.cos(r) + Math.sin(p)*Math.sin(r)), (Math.cos(p)*Math.sin(d)*Math.sin(r) - Math.sin(p)*Math.cos(r)), Math.cos(p)*Math.cos(d), 0,
                    0,0,0,1];

    gl.uniformMatrix4fv(rMatrixLoc, false, r_matrix);
}

function render(size, rMatrixLoc, picking) {
    sendRotationMatrix(rMatrixLoc);

    gl.uniform1i(picking, 0);

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, size);

}

function reCalcIndex(color) {
    return Math.round( (color * 10) / 255 );
}

function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function pickRender(size, rMatrixLoc, picking, mouseX, mouseY, bufferIds) {
    sendRotationMatrix(rMatrixLoc);

    gl.uniform1i(picking, 1);

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, size);

    var color = new Uint8Array(4);
    gl.readPixels(mouseX, mouseY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

    var reX = reCalcIndex(color[0]);
    var reY = reCalcIndex(color[1]);
    var reZ = reCalcIndex(color[2]);
    var reFace = reCalcIndex(color[3]);

    console.log(reX);
    console.log(reY);
    console.log(reZ);
    console.log(reFace);
    console.log("-------");

    //Calculate the location for the next voxel

    var newX = reX;
    var newY = reY;
    var newZ = reZ;

    if (reFace < 6) {
        newZ += 1;
    }
    else if (reFace < 7) {
        newX += 1;
    }
    else if (reFace < 8) {
        newY -= 1;
    }
    else if (reFace < 9) {
        newY += 1;
    }
    else if (reFace < 10) {
        newZ -= 1;
    }
    else if (reFace < 11) {
        newX -= 1;
    }

    var colorChoice = document.getElementById("colorChoice").value;
    convertedColorChoice = hexToRgb(colorChoice);

    //Place the voxel in the world and rebuffer all of the vertices
    model.placeVoxel(newX, newY, newZ, convertedColorChoice.r, convertedColorChoice.g, convertedColorChoice.b);

    voxelData = model.to3DPoints();

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIds.positionBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.positions), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIds.colorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.colors), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIds.pickColorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.pickingColors), gl.STATIC_DRAW );
}

function loadModel(modelInput, rMatrixLoc, picking) {

    model.clear();

    var lines = modelInput.split('\n');

    for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        line = line.replace(" ", "");
        inputs = line.split(",");

        if (inputs.length == 6) {

            for (var j = 0; j<inputs.length; j++) {
                inputs[j] = parseFloat(inputs[j]);
            }
            model.placeVoxel(inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5])
        }
    }

    voxelData = model.to3DPoints();


    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIds.positionBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.positions), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIds.colorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.colors), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIds.pickColorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(voxelData.pickingColors), gl.STATIC_DRAW );

    render(voxelData.positions.length, rMatrixLoc, picking);
}

function SaveClick() {
    var text = model.SaveModel();
    download(text, "myModel.txt", "text/plain");
}

function download(text, name, type) {
  var a = document.getElementById("a");
  var file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
}
