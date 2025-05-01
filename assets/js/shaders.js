// https://github.com/GameMakerDiscord/wind-shader
let wind_src = `precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex0;
uniform float _time;
uniform vec2 _size;
uniform int _wave_height;
uniform int _wave_amplitude;

void main() {
	// Shift the texture coordinates
	vec2 uv = vTexCoord;

    vec2 Size = _size; //vec2(256, 128);
    vec2 Wave = vec2(_wave_height, _wave_amplitude); //vec2(48, 5);

    //uv = vTexCoord + vec2(cos(vTexCoord.y * 30.0 + _time * 6.2831) / 30.0, 0) *
    //     (1.0 - vTexCoord.y);
    uv = vTexCoord + vec2(cos((uv.y / Wave.x + _time) * 6.2831) * Wave.y, 0) / Size * (1.0 - vTexCoord.y);

    // Get the texture pixel color
	vec3 pixel_color = texture2D(tex0, uv).rgb;

    

  
	// Fragment shader output
	gl_FragColor = vec4(pixel_color, 1.0);
}
`;