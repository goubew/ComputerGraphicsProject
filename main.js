var gl;

var d, p, r;

var dragging = false;
var dragCount = 0;

var deg_to_rad = Math.PI/180;
var canvas;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var model = new VoxelGrid();
    model.placeVoxel(0, 0, 0, 250, 50, 50);
    model.placeVoxel(1, 0, 0, 200, 200, 200);

    var voxelData = model.to3DPoints();
    //console.log(JSON.stringify(voxelData));

    //
    //  Configure WebGL
    //

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
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
        if (evt.shiftKey) {
            pickRender(voxelData.positions.length, rMatrixLoc, picking, evt.clientX, evt.clientY);
        }
        dragging = true;
        document.addEventListener("mousemove", doMouseDrag, false);
        var box = canvas.getBoundingClientRect();
        prevx = window.pageXOffset + evt.clientX - box.left;
        prevy = window.pageYOffset + evt.clientY - box.top;
        dragCount = 0;
    }
    function doMouseDrag(evt) {
        if (!dragging)
           return;
        var box = canvas.getBoundingClientRect();
        var x = window.pageXOffset + evt.clientX - box.left;
        var y = window.pageYOffset + evt.clientY - box.top;

        d += (((x- prevx) * -1) * deg_to_rad);
        p += (((y- prevy) * 1) * deg_to_rad);

        p = Math.max(10*deg_to_rad, Math.min(p, 40* deg_to_rad));


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

    console.log("render");
}

function pickRender(size, rMatrixLoc, picking, mouseX, mouseY) {
    sendRotationMatrix(rMatrixLoc);

    gl.uniform1i(picking, 1);

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, size);

    var color = new Uint8Array(4);
    gl.readPixels(mouseX, mouseY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
    console.log(color);

    console.log("Pick Render");

}
