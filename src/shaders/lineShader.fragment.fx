#ifdef GL_ES
    precision highp float;
#endif

// Uniforms
uniform int drawRange;
uniform vec3 color3;
uniform float time;

// Receive gl_VertexID from vertex shader
flat in int i;

void main(void) {
    // Discard pixels when the index is out of draw range
    if (i >= drawRange) discard;
    
    // Animate line color alpha over time
    float alpha = 1.0 - 0.9 * abs( sin( 4.0 * time ) );

    // Set the final color
    gl_FragColor = vec4(color3, alpha);
}