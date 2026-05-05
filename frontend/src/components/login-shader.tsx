'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Brand teal `#7ec8d0` ≈ vec3(0.495, 0.784, 0.815) for the GLSL palette.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Aurora — wavy teal bands warped toward the cursor; click pumps them brighter.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uMouse;     // normalized [0..1], y-flipped to GL space
uniform float uTime;     // seconds
uniform float uClick;    // 0..1, decays after each click
uniform float uBandScale; // band frequency multiplier — small = fatter bands
out vec4 fragColor;
const vec3 BRAND = vec3(0.495, 0.784, 0.815);
const vec3 BG    = vec3(0.027, 0.043, 0.067);
void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  float t = uTime * 0.25;
  vec3 col = BG;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float band = sin(uv.y * (5.0 + fi*0.7) * uBandScale + t*1.2 + fi*1.7 + sin(uv.x*3.0 + t)*1.6);
    band = smoothstep(0.55, 0.97, abs(band));
    float warp = exp(-length(uv - uMouse) * 3.5) * 0.7;
    band *= 0.35 + warp + uClick * 0.6;
    col += BRAND * band * (0.22 + 0.12*sin(fi*1.3 + t));
  }
  col = mix(col, BRAND * 1.05, uClick * 0.18);
  fragColor = vec4(col, 1.0);
}
`;

/**
 * Generic aurora canvas — fills its parent. Tracks mouse + click relative to
 * its own bounds. Used both as the login panel wallpaper and as the login
 * button background.
 */
function AuroraCanvas({ className, bandScale = 1 }: { className?: string; bandScale?: number }) {
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
    const uBandScale = gl.getUniformLocation(program, 'uBandScale');

    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let click = 0;

    // Track motion globally — for the button, the cursor often hovers over the
    // text overlay (which has pointer-events) rather than the canvas itself,
    // so a window-level listener feels more responsive.
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - r.left) / r.width;
      targetMouseY = 1 - (e.clientY - r.top) / r.height;
    };
    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      // Only register clicks that landed on/inside the canvas's bounds
      if (
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom
      ) {
        click = 1;
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('click', onClick);

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
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform1f(uClick, click);
      gl.uniform1f(uBandScale, bandScale);
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
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick);
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
      className={cn('h-full w-full', className)}
      style={{ touchAction: 'none' }}
    />
  );
}

/** Aurora wallpaper for the login panel — absolutely positioned, fills parent. */
export function LoginShader() {
  return (
    <div className="absolute inset-0">
      <AuroraCanvas />
    </div>
  );
}

interface AuroraButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Submit-style button with the aurora shader running underneath. The text
 * sits in a layer above the canvas; mouse + click drive the same shader the
 * panel uses, so the button picks up the same character.
 */
export function AuroraButton({
  type = 'button',
  onClick,
  disabled,
  className,
  children,
}: AuroraButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative h-12 w-full cursor-pointer overflow-hidden rounded-xl text-stone-50 text-[15px] font-medium',
        'shadow-[0_8px_24px_-12px_rgba(126,200,208,0.6)]',
        'transition-transform active:scale-[0.99]',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0">
        <AuroraCanvas bandScale={0.32} />
      </span>
      {/* Subtle hairline highlight at the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-50/40 to-transparent"
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
