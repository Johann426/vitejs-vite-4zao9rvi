#ifdef GL_ES
    precision highp float;
#endif

// Attributes
attribute vec3 position;

// Uniforms
uniform float pointSize;
uniform mat4 worldViewProjection;

// Send gl_VertexID to the fragment shader as a flat(to avoid interpolation) integer
flat out int i;

void main(void) {
    gl_PointSize = pointSize;
    gl_Position = worldViewProjection * vec4(position, 1.0);
    i = gl_VertexID;
}