var gl;

var d, p, r;

var dragging = false;

var deg_to_rad = Math.PI/180;
var canvas;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var model = new VoxelGrid();
    model.placeVoxel(0, 0, 0, 50, 50, 50);
    model.placeVoxel(1, 0, 0, 200, 200, 200);

    var vertices = [];
    vertices = model.to3DPoints();

    //
    //  Configure WebGL
    //

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0 );
    gl.enableVertexAttribArray( vPosition );

    var voxelPos = gl.getAttribLocation( program, "voxelPos" );
    gl.vertexAttribPointer( voxelPos, 4, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 4 );
    gl.enableVertexAttribArray( voxelPos );

    gl.enable(gl.DEPTH_TEST);


    d = 0;
    p = 10 * deg_to_rad;
    r = 0;

    var rMatrixLoc = gl.getUniformLocation( program, "rMatrix" );
    var picking = gl.getUniformLocation( program, "picking");

    gl.uniform1i(picking, 1);

    canvas.addEventListener("mousedown", doMouseDown, false);

    sendRotationMatrix(rMatrixLoc);
    render(vertices.length);


    /* Event Declarations */
    function doMouseDown(evt) {
        if (dragging)
           return;
        dragging = true;
        document.addEventListener("mousemove", doMouseDrag, false);
        document.addEventListener("mouseup", doMouseUp, false);
        var box = canvas.getBoundingClientRect();
        prevx = window.pageXOffset + evt.clientX - box.left;
        prevy = window.pageYOffset + evt.clientY - box.top;

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
        if (render) {
            sendRotationMatrix(rMatrixLoc);
            render(vertices.length);
        }
    }
    function doMouseUp(evt) {
        if (dragging) {
            document.removeEventListener("mousemove", doMouseDrag, false);
            document.removeEventListener("mouseup", doMouseUp, false);
        dragging = false;
        }
        sendRotationMatrix(rMatrixLoc);
        render(vertices.length);
    }
};

function sendRotationMatrix(rMatrixLoc) {

    var r_matrix = [ Math.cos(d)*Math.cos(r),Math.cos(d)*Math.sin(r), -1*Math.sin(d),0,
                    (Math.sin(p)*Math.sin(d)*Math.cos(r) - Math.cos(p)*Math.sin(r)), (Math.sin(p)*Math.sin(d)*Math.sin(r) + Math.cos(p)*Math.cos(r)), Math.sin(p)*Math.cos(d), 0,
                    (Math.cos(p)*Math.sin(d)*Math.cos(r) + Math.sin(p)*Math.sin(r)), (Math.cos(p)*Math.sin(d)*Math.sin(r) - Math.sin(p)*Math.cos(r)), Math.cos(p)*Math.cos(d), 0,
                    0,0,0,1];

    gl.uniformMatrix4fv(rMatrixLoc, false, r_matrix);
}

function render(size) {

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, size);

    var color = new Uint8Array(4);

    gl.readPixels(256, 256, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

    console.log(color);

}
