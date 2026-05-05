'use client';

import { useEffect, useRef, useState } from 'react';

// Brand teal `#7ec8d0` ≈ vec3(0.495, 0.784, 0.815) for the GLSL palette.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Aurora — wavy teal bands warped toward the cursor; click pumps them brighter.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uMouse;   // normalized [0..1], y-flipped to GL space
uniform float uTime;   // seconds
uniform float uClick;  // 0..1, decays after each click
out vec4 fragColor;
const vec3 BRAND = vec3(0.495, 0.784, 0.815);
const vec3 BG    = vec3(0.027, 0.043, 0.067);
void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  float t = uTime * 0.25;
  vec3 col = BG;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float band = sin(uv.y * (5.0 + fi*0.7) + t*1.2 + fi*1.7 + sin(uv.x*3.0 + t)*1.6);
    band = smoothstep(0.55, 0.97, abs(band));
    float warp = exp(-length(uv - uMouse) * 3.5) * 0.7;
    band *= 0.35 + warp + uClick * 0.6;
    col += BRAND * band * (0.22 + 0.12*sin(fi*1.3 + t));
  }
  col = mix(col, BRAND * 1.05, uClick * 0.18);
  fragColor = vec4(col, 1.0);
}
`;

export function LoginShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) {
      setSupported(false);
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('shader compile error:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setSupported(false);
      return;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('link error:', gl.getProgramInfoLog(program));
      setSupported(false);
      return;
    }
    gl.useProgram(program);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uClick = gl.getUniformLocation(program, 'uClick');

    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let click = 0;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - r.left) / r.width;
      targetMouseY = 1 - (e.clientY - r.top) / r.height;
    };
    const onClick = () => {
      click = 1;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('click', onClick);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();
    let raf = 0;
    let running = true;
    const tick = (now: number) => {
      if (!running) return;
      // Ease the mouse so motion feels fluid even at low frame rates.
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform1f(uClick, click);
      click *= 0.92;
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program);
      gl.deleteBuffer(vbo);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  if (!supported) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: 'none' }}
    />
  );
}
