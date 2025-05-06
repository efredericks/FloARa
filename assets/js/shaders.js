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
	// vec3 pixel_color = texture2D(tex0, uv).rgb;
	// Fragment shader output
	// gl_FragColor = vec4(pixel_color, 1.0);

    gl_FragColor = texture2D(tex0, uv);
}
`;


/*
https://editor.p5js.org/davepagurek/sketches/5KHql-wWB
let grass
let windMaterial

function preload() {
  grass = loadImage('https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Cirsium_arvense_-_p%C3%B5ldohakas.jpg/640px-Cirsium_arvense_-_p%C3%B5ldohakas.jpg')
}

function setup() {
  createCanvas(600, 400, WEBGL)
  windMaterial = baseMaterialShader().modify({
    uniforms: {
      'float time': null // You can put a value here if you want a default
      // ...or a function returning a value if you want a dynamically set default
    },
    'Inputs getPixelInputs': `(Inputs inputs) {
      vec2 coord = inputs.texCoord;
      coord.x += 0.1 * sin(time * 0.001 + coord.y * 10.0);
      inputs.color = texture(uSampler, coord);
      return inputs;
    }`
  })
}

function draw() {
  background(220);
  
  imageMode(CENTER)
  
  for (let i = 0; i < 10; i++) {
    push()
    shader(windMaterial)
    windMaterial.setUniform('time', millis() + i * 1000)
    imageMode(CENTER)
    image(grass, map(i, 0, 9, -width/2, width/2), 0, 50, 75)
    pop()
  }
}
*/