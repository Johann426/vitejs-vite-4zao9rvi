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
    
    // Calculate the relative position vector from the point center(0.5, 0.5)
    vec2 diff = gl_PointCoord - vec2(0.5, 0.5);
    
    // Compute the distance from the center
    float dist = length(diff);
    
    // Discard pixels if distance exceeds 0.5
    if (dist > 0.5) discard;
    
    // Animate line color alpha over time
    float alpha = 1.0 - 0.9 * abs( sin( 2.5 * time ) );

    // Smooth edge handling for anti-aliasing (optional)
    alpha -= smoothstep(0.45, 0.5, dist);
    
    // Set the final color
    gl_FragColor = vec4(color3, alpha);
}