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

// https://webgl-shaders.com/shaders/frag-badtv.glsl
let tv_noise_src = `precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex0;
uniform float _noise;

/*
 * Random number generator with a float seed
 *
 * Credits:
 * http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0
 */
highp float random1d(float dt) {
    highp float c = 43758.5453;
    highp float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}

/*
 * Pseudo-noise generator
 *
 * Credits:
 * https://thebookofshaders.com/11/
 */
highp float noise1d(float value) {
	highp float i = floor(value);
	highp float f = fract(value);
	return mix(random1d(i), random1d(i + 1.0), smoothstep(0.0, 1.0, f));
}

/*
 * Random number generator with a vec2 seed
 *
 * Credits:
 * http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0
 * https://github.com/mattdesl/glsl-random
 */
highp float random2d(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt = dot(co.xy, vec2(a, b));
    highp float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}


//https://iquilezles.org/articles/distfunctions2d/
float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

/*
 * The main program
 */
void main() {
	// Calculate the effect relative strength
	float strength = (0.3 + 0.7 * noise1d(0.3 * 1.)) * _noise;// 0.5; //u_mouse.x / u_resolution.x;

	// Calculate the effect jump at the current time interval
	float jump = 500.0 * floor(0.3 * (0.5) * (1. + noise1d(1.))); //(u_mouse.x / u_resolution.x) * (u_time + noise1d(u_time)));

	// Shift the texture coordinates
	vec2 uv = vTexCoord;

// Get the texture pixel color
	vec3 pixel_color = texture2D(tex0, uv).rgb;

  pixel_color.r = texture2D(tex0, uv-vec2(_noise,_noise)).r;
  pixel_color.g = texture2D(tex0, uv+vec2(_noise,_noise)).g;
  pixel_color.b = texture2D(tex0, uv-vec2(_noise,_noise)).b;


//if (sdBox(uv, vec2(0.15,0.15)) > 0.5) {
	uv.y += _noise*5.*0.2 * strength * (noise1d(5.0 * vTexCoord.y + 2.0 * 1. + jump) - 0.5);
	uv.x += 0.1 * strength * (noise1d(100.0 * strength * uv.y + 3.0 * 1. + jump) - 0.5);

	// Get the texture pixel color
	 pixel_color = texture2D(tex0, uv).rgb;


	// Add some white noise
	pixel_color += vec3(5.0 * strength * (random2d(vTexCoord + 1.133001 * vec2(1., 1.13)) - 0.5));
//} else {

//}
	// Fragment shader output
	gl_FragColor = vec4(pixel_color, 1.0);
}
`;

// rgb - based on https://editor.p5js.org/BarneyCodes/sketches/XUer03ShM
let rgb_src = `precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex0;
uniform float _noise;
uniform float _g_noise;
uniform bool fractalize;


//https://iquilezles.org/articles/distfunctions2d/
float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

void main() {
  vec2 uv = vTexCoord;
  vec3 col;
  vec4 _col = texture2D(tex0, uv);
  col = _col.rgb;

  float noise = 0.25;

  // if (sdBox(uv, vec2(1.0,sin(_g_noise*0.15))) > (2.2 * sin(_g_noise*0.5))) {//0.5) {

  //if ((sdBox(uv, vec2(0.15,0.31)) > 0.75) || (1./sdBox(uv, vec2(0.85,0.71)) < 0.25)) {
  // glitch rgb components
  // vec2 offset = vec2(noise * 0.05, 0.0);
  vec2 offset = vec2(noise * _noise, noise *_noise);
  col.r = texture2D(tex0, uv-offset).r;
  col.g = texture2D(tex0, uv+offset).g;
  col.b = texture2D(tex0, uv-offset).b;

  
   if (fractalize) col = fract(5.*cos(2.0/col));
   //col.g *= tan(4.0*_g_noise);
   //col.r = cos(2.8 * _g_noise);
   //col.g = pow(step(0.5,col.g),_g_noise);


//}

  float alpha = 1.0;
 //float alpha = clamp(pow(noise, 2.0),0.0, 0.5);
  gl_FragColor = vec4(col, alpha);
}`;

// dither - https://medium.com/the-bkpt/dithered-shading-tutorial-29f57d06ac39
// http://alex-charlton.com/posts/Dithering_on_the_GPU/
// https://github.com/hughsk/glsl-dither/blob/master/example/index.frag
let dither_src = `precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex0;
uniform float _noise;
uniform float indexMatrix4x4[16];

mat4 bayer = mat4(
  -0.5, 0.0, -0.375, 0.125,
  0.25, -0.25, 0.375, -0.125,
  -0.3125, 0.1875, -0.4375, 0.0625,
  0.4375, -0.0625, 0.3125, -0.1875
); 

// https://github.com/hughsk/glsl-luma/blob/master/index.glsl
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}
// https://github.com/hughsk/glsl-luma/blob/master/index.glsl
float luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

float dither4x4(vec2 position, float brightness) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.0625;
    if (index == 1) limit = 0.5625;
    if (index == 2) limit = 0.1875;
    if (index == 3) limit = 0.6875;
    if (index == 4) limit = 0.8125;
    if (index == 5) limit = 0.3125;
    if (index == 6) limit = 0.9375;
    if (index == 7) limit = 0.4375;
    if (index == 8) limit = 0.25;
    if (index == 9) limit = 0.75;
    if (index == 10) limit = 0.125;
    if (index == 11) limit = 0.625;
    if (index == 12) limit = 1.0;
    if (index == 13) limit = 0.5;
    if (index == 14) limit = 0.875;
    if (index == 15) limit = 0.375;
  }

  return brightness < limit ? 0.0 : 1.0;
}

vec3 dither4x4(vec2 position, vec3 color) {
  return color * dither4x4(position, luma(color));
}

vec4 dither4x4(vec2 position, vec4 color) {
  return vec4(color.rgb * dither4x4(position, luma(color)), 1.0);
}

float dither8x8(vec2 position, float brightness) {
  int x = int(mod(position.x, 8.0));
  int y = int(mod(position.y, 8.0));
  int index = x + y * 8;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.015625;
    if (index == 1) limit = 0.515625;
    if (index == 2) limit = 0.140625;
    if (index == 3) limit = 0.640625;
    if (index == 4) limit = 0.046875;
    if (index == 5) limit = 0.546875;
    if (index == 6) limit = 0.171875;
    if (index == 7) limit = 0.671875;
    if (index == 8) limit = 0.765625;
    if (index == 9) limit = 0.265625;
    if (index == 10) limit = 0.890625;
    if (index == 11) limit = 0.390625;
    if (index == 12) limit = 0.796875;
    if (index == 13) limit = 0.296875;
    if (index == 14) limit = 0.921875;
    if (index == 15) limit = 0.421875;
    if (index == 16) limit = 0.203125;
    if (index == 17) limit = 0.703125;
    if (index == 18) limit = 0.078125;
    if (index == 19) limit = 0.578125;
    if (index == 20) limit = 0.234375;
    if (index == 21) limit = 0.734375;
    if (index == 22) limit = 0.109375;
    if (index == 23) limit = 0.609375;
    if (index == 24) limit = 0.953125;
    if (index == 25) limit = 0.453125;
    if (index == 26) limit = 0.828125;
    if (index == 27) limit = 0.328125;
    if (index == 28) limit = 0.984375;
    if (index == 29) limit = 0.484375;
    if (index == 30) limit = 0.859375;
    if (index == 31) limit = 0.359375;
    if (index == 32) limit = 0.0625;
    if (index == 33) limit = 0.5625;
    if (index == 34) limit = 0.1875;
    if (index == 35) limit = 0.6875;
    if (index == 36) limit = 0.03125;
    if (index == 37) limit = 0.53125;
    if (index == 38) limit = 0.15625;
    if (index == 39) limit = 0.65625;
    if (index == 40) limit = 0.8125;
    if (index == 41) limit = 0.3125;
    if (index == 42) limit = 0.9375;
    if (index == 43) limit = 0.4375;
    if (index == 44) limit = 0.78125;
    if (index == 45) limit = 0.28125;
    if (index == 46) limit = 0.90625;
    if (index == 47) limit = 0.40625;
    if (index == 48) limit = 0.25;
    if (index == 49) limit = 0.75;
    if (index == 50) limit = 0.125;
    if (index == 51) limit = 0.625;
    if (index == 52) limit = 0.21875;
    if (index == 53) limit = 0.71875;
    if (index == 54) limit = 0.09375;
    if (index == 55) limit = 0.59375;
    if (index == 56) limit = 1.0;
    if (index == 57) limit = 0.5;
    if (index == 58) limit = 0.875;
    if (index == 59) limit = 0.375;
    if (index == 60) limit = 0.96875;
    if (index == 61) limit = 0.46875;
    if (index == 62) limit = 0.84375;
    if (index == 63) limit = 0.34375;
  }

  return brightness < limit ? 0.0 : 1.0;
}

vec3 dither8x8(vec2 position, vec3 color) {
  return color * dither8x8(position, luma(color));
}

vec4 dither8x8(vec2 position, vec4 color) {
  return vec4(color.rgb * dither8x8(position, luma(color)), 1.0);
}

float dither2x2(vec2 position, float brightness) {
  int x = int(mod(position.x, 2.0));
  int y = int(mod(position.y, 2.0));
  int index = x + y * 2;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.25;
    if (index == 1) limit = 0.75;
    if (index == 2) limit = 1.00;
    if (index == 3) limit = 0.50;
  }

  return brightness < limit ? 0.0 : 1.0;
}

vec3 dither2x2(vec2 position, vec3 color) {
  return color * dither2x2(position, luma(color));
}

vec4 dither2x2(vec2 position, vec4 color) {
  return vec4(color.rgb * dither2x2(position, luma(color)), 1.0);
}

uniform int which;

void main() {
  vec2 uv = vTexCoord;
  //vec3 col;
  //vec4 _col = texture2D(tex0, uv);
  //col = _col.rgb;

  //col = dither(col);
  
  //gl_FragColor = vec4(col, 1.0);

  if (which == 0)
    gl_FragColor = dither2x2(gl_FragCoord.xy, texture2D(tex0, uv));
  else if (which == 1)
    gl_FragColor = dither4x4(gl_FragCoord.xy, texture2D(tex0, uv));
  else 
    gl_FragColor = dither8x8(gl_FragCoord.xy, texture2D(tex0, uv));

}`;