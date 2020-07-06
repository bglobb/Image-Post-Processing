'use strict'

onload = () => {
  let canvas = document.querySelector("#canvas");
  let gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});

  let vertexShader =
`precision highp float;
attribute vec2 vert;
varying vec2 texPos;
void main() {
  texPos = 0.5*(vec2(1, -1)*vert+1.0);
  gl_Position = vec4(vert, 0, 1);
}`;
  let fragmentShader =
`precision highp float;
varying vec2 texPos;
uniform sampler2D img0;
uniform sampler2D img1;
uniform sampler2D img2;
uniform sampler2D img3;
uniform sampler2D img4;
uniform sampler2D img5;
uniform sampler2D img6;
uniform sampler2D img7;
uniform sampler2D img8;
uniform sampler2D img9;
uniform sampler2D img10;
uniform sampler2D img11;
uniform sampler2D img12;
uniform sampler2D img13;
uniform sampler2D img14;
uniform sampler2D img15;
uniform float w;
uniform float h;

vec4 replace(vec4 initial, vec4 replaced, bool condition) {
  if (condition) {
    return replaced;
  } else {
    return initial;
  }
}

vec4 grayscale(vec4 col) {
  return vec4(vec3(dot(vec3(0.2989, 0.5870, 0.1140), col.rgb)), 1);
}

void main() {
  vec2 dim = vec2(w, h);
  gl_FragColor = texture2D(img0, texPos);
}`;

  let textures = [];

  let txtArea = document.querySelector("textarea");
  let wIn = document.querySelector("#w-in");
  let hIn = document.querySelector("#h-in");

  txtArea.value = fragmentShader;

  let editor = CodeMirror.fromTextArea(txtArea, {
    lineNumbers: true,
    autoCloseBrackets: true,
    tabSize: 2
  });
  editor.setSize(null, 500);

  document.addEventListener("keydown", () => {
    setTimeout(() => {
      program = loadProgram(gl, vertexShader, editor.getValue());
      addVertices(gl, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), program, "vert");

      for (var i = 0; i < 16; i++) {
        gl.uniform1i(gl.getUniformLocation(program, "img"+i), i);
      }

      let [w, h] = [wIn, hIn].map(e => Math.abs(eval(e.value)));
      if (w < 10000 && h < 10000) {
        changeDim(gl, canvas, program, w, h, wIn, hIn, false);
      }

      draw(gl, program, textures);
    }, 1);
  });

  let program = loadProgram(gl, vertexShader, fragmentShader);
  addVertices(gl, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), program, "vert");

  for (var i = 0; i < 16; i++) {
    gl.uniform1i(gl.getUniformLocation(program, "img"+i), i);
  }

  document.querySelector("#image-file").addEventListener("change", (event) => {
    for (let i = 0; i < textures.length; i++) {
      gl.deleteTexture(textures[i]);
    }
    textures = [];
    let i = 0;
    for (let file of event.target.files) {
      let fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = (e) => {
        let img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          textures.push(imgTex(gl, img));
          if (i === event.target.files.length-1) {
            changeDim(gl, canvas, program, img.width, img.height, wIn, hIn);
            draw(gl, program, textures);
          }
          i++;
        }
      }
    }
  });

  canvas.onmousemove = (e) => {
    let boundingClientRect = canvas.getBoundingClientRect();
    let x = e.clientX - boundingClientRect.x - 1;
    let y = e.clientY - boundingClientRect.y - 1;
    if (x >= 0 && y >= 0 && x < boundingClientRect.width - 2 && y < boundingClientRect.height - 2) {
      document.querySelector("#coor").innerHTML = "Coordinate: " + x + "," + y;

      let color = new Uint8Array(4);
      gl.readPixels(x, boundingClientRect.height - 3 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
      document.querySelector("#col").innerHTML = "RGB: " + (color[3] !== 0 ? color.slice(0, 3):"255,255,255");
    }
  }
}

let changeDim = (gl, canvas, program, w, h, wIn, hIn, updIn=true) => {
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);
  gl.uniform1f(gl.getUniformLocation(program, "w"), w);
  gl.uniform1f(gl.getUniformLocation(program, "h"), h);
  if (updIn) {
    wIn.value = w;
    hIn.value = h;
  }
}

let draw = (gl, program, textures) => {
  for (let i = 0; i < textures.length; i++) {
    gl.activeTexture(eval("gl.TEXTURE"+i));
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
  }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
