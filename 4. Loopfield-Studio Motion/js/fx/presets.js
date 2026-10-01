/* Loopfield Studio presets: GLSL source and palettes copied verbatim from the Loopfield Studio repository
   (js/presets.js, js/presets-extra.js · MIT · JTech Co.). Order follows dataset §5 (v1.0.0 = 1–12, v1.1.0 adds 13–32).
   Generated from the repository; fix shaders there, not here. */
(function (SX) {
  'use strict';
  SX.presets = {
    palettes: [["#65fbd5", "#ac76ff", "#ffb86c"], ["#ff543e", "#ffc879", "#a63cff"], ["#b7fbff", "#409eff", "#6862ef"], ["#fce5b4", "#e6a065", "#647b73"], ["#ff64bc", "#6fe8ff", "#fff1a3"], ["#f7f4ed", "#8a929d", "#dbe6ed"]],
    list: [
      {
        id: 'prism', name: "Prism Bloom", category: 'geometry', palette: 0, zoom: 1.0,
        code: `// @slider uPetals 3 16 1 7 | 대칭 수
// @slider uBands 3 18 1 9 | 빛의 겹
// @slider uTwist 0 3 0.05 1.2 | 꼬임
vec3 pattern(vec2 p) {
  float r=length(p), a=atan(p.y,p.x);
  float wave=sin(a*uPetals + uTwist*sin(r*4.0-uAngle));
  float field=r*(uBands+1.6*wave) - 0.6*sin(uAngle);
  float line=pow(0.5+0.5*cos(field*TAU), 18.0);
  float halo=0.16/(0.15+abs(sin(field*PI)));
  vec3 col=palette(r*0.55+wave*0.13+0.12*sin(uAngle));
  return col*(line*0.75+halo*0.35)*exp(-r*0.65);
}`,
      },
      {
        id: 'mandelbrot', name: "Mandelbrot", category: 'fractal', palette: 2, zoom: 1.05,
        code: `// @slider uIterations 48 384 16 160 | 반복 정밀도
// @slider uBreath 0 0.8 0.01 0.28 | 줌 호흡
// @slider uContour 0.01 0.15 0.005 0.045 | 등고선 밀도
vec3 pattern(vec2 p) {
  float scale=1.3*exp(uBreath*cos(uAngle));
  vec2 c=p*scale+vec2(-0.55,0.02);
  vec2 z=vec2(0.0); float n=0.0;
  for(int i=0;i<384;i++) {
    if(i>=int(uIterations)) break;
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;
    n=float(i)+1.0;
    if(dot(z,z)>256.0) break;
  }
  if(n>=uIterations) return vec3(0.005,0.008,0.018);
  float smoothN=n+1.0-log2(max(0.001,log2(max(length(z),1.0001))));
  vec3 col=palette(smoothN*uContour+0.1*sin(uAngle));
  return col*(0.35+0.65*(1.0-exp(-smoothN*.12)));
}`,
      },
      {
        id: 'julia', name: "Julia orbit", category: 'fractal', palette: 1, zoom: 1.0,
        code: `// @slider uIterations 48 384 16 144 | 반복 정밀도
// @slider uReal -1 0.5 0.005 -0.745 | c 실수부
// @slider uImag -0.5 0.5 0.005 0.185 | c 허수부
// @slider uOrbit 0 0.18 0.002 0.028 | 궤도 반경
vec3 pattern(vec2 p) {
  vec2 z=p*1.3;
  vec2 c=vec2(uReal,uImag)+uOrbit*uCycle;
  float n=0.0, trap=100.0;
  for(int i=0;i<384;i++) {
    if(i>=int(uIterations)) break;
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;
    trap=min(trap,abs(length(z)-.65)); n=float(i)+1.0;
    if(dot(z,z)>256.0) break;
  }
  if(n>=uIterations) return palette(trap)*.03;
  float sn=n+1.0-log2(max(.001,log2(max(length(z),1.0001))));
  return palette(sn*.037+trap*.3)*(0.4+0.6*exp(-trap*3.0));
}`,
      },
      {
        id: 'kaleido', name: "Kaleido tiles", category: 'geometry', palette: 4, zoom: 1.0,
        code: `// @slider uSymmetry 3 16 1 8 | 접힘 수
// @slider uDensity 1 5 0.1 2.2 | 타일 밀도
// @slider uLayers 2 5 1 3 | 반복 깊이
vec3 pattern(vec2 p) {
  float a=atan(p.y,p.x)+0.15*sin(uAngle), r=length(p);
  a=abs(mod(a,TAU/uSymmetry)-PI/uSymmetry);
  vec2 q=vec2(cos(a),sin(a))*r; vec3 col=vec3(0.0);
  for(int i=0;i<5;i++) {
    if(i>=int(uLayers)) break;
    q=fract(q*uDensity+0.11*uCycle)-.5;
    float d=abs(length(q)-(.18+.06*sin(uAngle+float(i))));
    col+=palette(r*.3+float(i)*.21)*.018/(.025+d);
  }
  return col*exp(-r*.4)*.7;
}`,
      },
      {
        id: 'ribbons', name: "Silk contours", category: 'organic', palette: 3, zoom: 1.0,
        code: `// @slider uDensity 3 24 1 12 | 선 밀도
// @slider uFlow 0 2 0.05 0.85 | 물결 강도
// @slider uWidth 0.01 0.2 0.005 0.055 | 선 두께
vec3 pattern(vec2 p) {
  vec2 q=rotate(.35*sin(uAngle))*p;
  float f=q.y+uFlow*.3*sin(q.x*2.7+uAngle)+.13*sin(q.x*5.0-uAngle);
  float d=sin(f*uDensity);
  float line=1.0-smoothstep(uWidth,uWidth+max(fwidth(d),.008),abs(d));
  float shade=.5+.5*sin(f*3.0+q.x);
  return palette(shade*.7)*(line*.8+.055)*exp(-length(p)*.2);
}`,
      },
      {
        id: 'moire', name: "Moiré study", category: 'geometry', palette: 5, zoom: 1.0,
        code: `// @slider uDensity 8 80 1 34 | 격자 밀도
// @slider uAngleRange 0.02 0.8 0.01 0.24 | 교차 각도
vec3 pattern(vec2 p) {
  vec2 q=rotate(uAngleRange*sin(uAngle))*p;
  float a=sin(p.x*uDensity), b=sin(q.x*uDensity+cos(uAngle)*2.0);
  float f=.5+.5*a*b;
  float aa=max(fwidth(f),.015);
  float band=smoothstep(.48-aa,.48+aa,f);
  return palette(length(p)*.22)*band*.85;
}`,
      },
      {
        id: 'interference', name: "Wave interference", category: 'geometry', palette: 2, zoom: 1.0,
        code: `// @slider uFrequency 4 30 1 14 | 파동 주파수
// @slider uOrbit 0.1 1.1 0.02 0.6 | 파동원 거리
vec3 pattern(vec2 p) {
  vec2 c=uOrbit*uCycle;
  float d1=length(p-c),d2=length(p+c);
  float v=sin(d1*uFrequency-uAngle)+sin(d2*uFrequency+uAngle);
  float glow=pow(.5+.25*v,3.0);
  return palette(v*.16+length(p)*.2)*glow;
}`,
      },
      {
        id: 'voronoi', name: "Cellular glass", category: 'organic', palette: 0, zoom: 1.0,
        code: `// @slider uCells 2 8 0.25 3.5 | 셀 밀도
// @slider uMotion 0 0.45 0.01 0.3 | 움직임
vec3 pattern(vec2 p) {
  p=p*uCells; vec2 cell=floor(p), f=fract(p);
  float d1=10.0,d2=10.0,id=0.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++) {
    vec2 g=vec2(float(x),float(y));
    float h=hash21(cell+g+uSeed);
    vec2 o=.5+uMotion*vec2(cos(uAngle+h*TAU),sin(uAngle+h*TAU));
    float d=length(g+o-f);
    if(d<d1){d2=d1;d1=d;id=h;}else{d2=min(d2,d);}
  }
  float edge=exp(-(d2-d1)*32.0);
  return palette(id+0.06*sin(uAngle))*(.12+edge*.78+exp(-d1*5.0)*.3);
}`,
      },
      {
        id: 'domain', name: "Liquid topography", category: 'organic', palette: 1, zoom: 1.0,
        code: `// @slider uScale 1 5 0.1 2.4 | 지형 크기
// @slider uWarp 0 4 0.1 2.0 | 왜곡 강도
// @slider uContours 2 16 1 8 | 등고선 수
vec3 pattern(vec2 p) {
  vec2 q=p*uScale;
  vec2 w=vec2(fbm(q+uCycle*.6),fbm(q+vec2(4.7,1.3)-uCycle*.6));
  float v=fbm(q+uWarp*w+uSeed*.07);
  float line=pow(.5+.5*cos(v*TAU*uContours),14.0);
  return palette(v*.85)*(.2+.72*line);
}`,
      },
      {
        id: 'orbital', name: "Orbital rings", category: 'geometry', palette: 4, zoom: 1.0,
        code: `// @slider uRings 3 14 1 8 | 궤도 수
// @slider uTilt 0.15 1 0.01 0.5 | 궤도 기울기
vec3 pattern(vec2 p) {
  vec3 col=vec3(0.0);
  for(int i=0;i<14;i++) {
    if(i>=int(uRings))break;
    float fi=float(i); vec2 q=rotate(fi*PI/uRings+.2*sin(uAngle))*p;
    q.y/=uTilt+.1*sin(uAngle+fi);
    float radius=.4+fi*.055+.04*cos(uAngle+fi);
    float d=abs(length(q)-radius);
    float light=.015/(d+.018);
    col+=palette(fi/uRings+.1*sin(uAngle))*light;
  }
  return col*.32;
}`,
      },
      {
        id: 'gyroid', name: "Gyroid sculpture", category: 'volume', palette: 0, zoom: 1.0,
        code: `// @slider uFrequency 2 8 0.2 4.0 | 곡면 주파수
// @slider uThickness 0.06 0.4 0.01 0.16 | 곡면 두께
float shape(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;
  vec3 q=p*uFrequency;
  float gy=dot(sin(q),cos(q.yzx));
  return max((abs(gy)-uThickness)/uFrequency*.55,length(p)-1.1);
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3.4),rd=normalize(vec3(p,-2.2));
  float t=0.0,d=0.0; bool hit=false;
  for(int i=0;i<96;i++) {
    d=shape(ro+rd*t); if(d<.0015){hit=true;break;}
    t+=max(d,.001); if(t>5.0)break;
  }
  if(!hit)return vec3(.008,.01,.018);
  vec3 pos=ro+rd*t; vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(shape(pos+e.xyy)-shape(pos-e.xyy),shape(pos+e.yxy)-shape(pos-e.yxy),shape(pos+e.yyx)-shape(pos-e.yyx)));
  vec3 light=normalize(vec3(-.7,.9,1.0));
  float diff=max(dot(n,light),0.0), rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  return palette(pos.y*.28+pos.x*.17)*(.18+.75*diff)+palette(.7)*rim*.4;
}`,
      },
      {
        id: 'starter', name: "Your first loop", category: 'code', palette: 0, zoom: 1.0,
        code: `// @slider uDensity 2 20 1 8 | 원의 밀도
vec3 pattern(vec2 p) {
  float wave = sin(length(p) * uDensity - uAngle);
  vec3 color = palette(length(p) * 0.4);
  return color * (0.5 + 0.5 * wave);
}`,
      },
      {
        id: 'spiral', name: "Logarithmic spiral", category: 'geometry', palette: 1, zoom: 1.0,
        code: `// @slider uArms 2 12 1 5 | 나선 가지 수
// @slider uTightness 1 8 0.1 3.8 | 감김 밀도
vec3 pattern(vec2 p) {
  float r=max(length(p),0.003), a=atan(p.y,p.x);
  float v=a*uArms+log(r)*uTightness-uAngle;
  float band=pow(.5+.5*cos(v),10.0);
  float aa=1.0-smoothstep(.5,2.0,fwidth(v));
  return palette(log(r)*.1+.12*sin(uAngle))*(band*aa*.9+.035)*smoothstep(.01,.08,r);
}`,
      },
      {
        id: 'truchet', name: "Truchet circuit", category: 'geometry', palette: 2, zoom: 1.0,
        code: `// @slider uTiles 2 12 1 5 | 타일 밀도
// @slider uLineWidth 0.01 0.16 0.005 0.05 | 회로 두께
vec3 pattern(vec2 p) {
  vec2 q=p*uTiles+.18*uCycle, cell=floor(q), f=fract(q);
  if(hash21(cell+uSeed)>.5) f.x=1.0-f.x;
  float d=min(abs(length(f)-.5),abs(length(f-1.0)-.5));
  float line=stroke(d,uLineWidth);
  float light=.35+.65*pow(.5+.5*cos((f.x+f.y)*5.0+uAngle),2.0);
  return palette((cell.x+cell.y)*.09)*(.035+line*light);
}`,
      },
      {
        id: 'hex-pulse', name: "Hexagonal pulse", category: 'geometry', palette: 0, zoom: 1.0,
        code: `// @slider uCells 2 10 0.5 5 | 벌집 밀도
// @slider uPulse 0.5 5 0.1 2 | 파동 밀도
vec3 pattern(vec2 p) {
  vec2 q=p*uCells, tile=vec2(1.0,1.7320508);
  vec2 a=mod(q,tile)-tile*.5, b=mod(q-tile*.5,tile)-tile*.5;
  vec2 f=dot(a,a)<dot(b,b)?a:b, id=q-f;
  float boundary=max(abs(f.x),dot(abs(f),vec2(.5,.8660254)));
  float phase=length(id)*uPulse-uAngle;
  float glow=pow(.5+.5*cos(phase),4.0);
  float edge=stroke(boundary-.46,.02);
  return palette(length(id)*.04)*(.025+glow*(.25+.65*edge));
}`,
      },
      {
        id: 'polar-lattice', name: "Polar lattice", category: 'geometry', palette: 4, zoom: 1.0,
        code: `// @slider uSpokes 8 48 2 24 | 방사선 수
// @slider uCircles 2 12 1 6 | 원 밀도
vec3 pattern(vec2 p) {
  float r=length(p),a=atan(p.y,p.x)+.08*sin(uAngle);
  float rings=stroke(sin(r*uCircles*PI-.3*sin(uAngle)),.055);
  float spokes=stroke(sin(a*uSpokes*.5+.25*cos(r*5.0-uAngle)),.05);
  float fade=smoothstep(.03,.14,r)*exp(-r*.35);
  return palette(r*.25+.08*cos(uAngle))*(rings*.6+spokes*.6)*fade;
}`,
      },
      {
        id: 'rose', name: "Rhodonea garden", category: 'geometry', palette: 1, zoom: 1.0,
        code: `// @slider uPetals 2 12 1 5 | 꽃잎 수
// @slider uRoses 2 8 1 5 | 겹 수
vec3 pattern(vec2 p) {
  float r=length(p),a=atan(p.y,p.x);vec3 c=vec3(0);
  for(int i=0;i<8;i++) {
    if(i>=int(uRoses))break;float k=float(i);
    float radius=(.85-k*.07)*abs(cos(a*uPetals+.16*sin(uAngle+k*.5)));
    float d=abs(r-radius);
    c+=palette(k/uRoses)*.006/(d+.015);
  }
  return c*.75;
}`,
      },
      {
        id: 'lissajous', name: "Lissajous signal", category: 'geometry', palette: 4, zoom: 1.0,
        code: `// @slider uFreqX 1 7 1 3 | 가로 진동 수
// @slider uFreqY 1 7 1 4 | 세로 진동 수
// @slider uWidth 0.004 0.04 0.002 0.012 | 궤적 두께
float segmentDistance(vec2 p,vec2 a,vec2 b) {
  vec2 ab=b-a;float h=clamp(dot(p-a,ab)/max(dot(ab,ab),.000001),0.0,1.0);
  return length(p-a-h*ab);
}
vec3 pattern(vec2 p) {
  float d=10.0,nearest=0.0;
  vec2 prev=.78*vec2(sin(uAngle),0.0);
  for(int i=1;i<=128;i++) {
    float t=TAU*float(i)/128.0;
    vec2 curr=.78*vec2(sin(uFreqX*t+uAngle),sin(uFreqY*t));
    float nd=segmentDistance(p,prev,curr);
    if(nd<d){d=nd;nearest=t/TAU;}prev=curr;
  }
  return palette(nearest)*(.01/(d+uWidth)+.35*stroke(d,uWidth));
}`,
      },
      {
        id: 'concentric-grid', name: "Concentric grid", category: 'geometry', palette: 3, zoom: 1.0,
        code: `// @slider uGrid 1 8 0.5 3 | 격자 밀도
// @slider uBands 2 12 1 5 | 동심원 수
vec3 pattern(vec2 p) {
  vec2 q=p*uGrid,id=floor(q),f=fract(q)-.5;
  float phase=hash21(id+uSeed)*TAU;
  float d=sin(length(f)*uBands*TAU-uAngle+phase);
  float line=stroke(d,.18);
  return palette(hash21(id+3.2))*(.035+.78*line)*(1.0-smoothstep(.35,.76,length(f)));
}`,
      },
      {
        id: 'quasicrystal', name: "Quasicrystal interference", category: 'geometry', palette: 2, zoom: 1.0,
        code: `// @slider uDirections 3 9 1 5 | 파동 방향 수
// @slider uFrequency 4 30 1 15 | 공간 주파수
vec3 pattern(vec2 p) {
  float v=0.0;
  for(int i=0;i<9;i++) {
    if(i>=int(uDirections))break;float a=PI*float(i)/uDirections;
    v+=cos(dot(p,vec2(cos(a),sin(a)))*uFrequency+.8*sin(uAngle+a));
  }
  v/=uDirections;
  float band=pow(.5+.5*cos(v*TAU*2.0),5.0);
  return palette(v*.5+.3)*(.09+.82*band);
}`,
      },
      {
        id: 'burning-ship', name: "Burning Ship", category: 'fractal', palette: 1, zoom: 1.0,
        code: `// @slider uIterations 48 256 16 144 | 반복 정밀도
// @slider uBreath 0 0.4 0.01 0.12 | 줌 호흡
vec3 pattern(vec2 p) {
  vec2 c=vec2(p.x,-p.y)*1.1*exp(uBreath*cos(uAngle))+vec2(-.45,-.45);
  vec2 z=vec2(0);float n=0.0;
  for(int i=0;i<256;i++) {
    if(i>=int(uIterations))break;z=abs(z);
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;n=float(i)+1.0;
    if(dot(z,z)>256.0)break;
  }
  if(n>=uIterations)return vec3(.007,.004,.009);
  float sn=n+1.0-log2(max(.001,log2(max(length(z),1.0001))));
  return palette(sn*.045+.08*sin(uAngle))*(.25+.7*(1.0-exp(-sn*.15)));
}`,
      },
      {
        id: 'multibrot', name: "Cubic Multibrot", category: 'fractal', palette: 0, zoom: 1.0,
        code: `// @slider uIterations 48 256 16 128 | 반복 정밀도
// @slider uBreath 0 0.5 0.01 0.2 | 줌 호흡
vec3 pattern(vec2 p) {
  vec2 c=rotate(.12*sin(uAngle))*p*1.2*exp(uBreath*cos(uAngle));
  vec2 z=vec2(0);float n=0.0;
  for(int i=0;i<256;i++) {
    if(i>=int(uIterations))break;vec2 s=z*z;
    z=vec2(z.x*(s.x-3.0*s.y),z.y*(3.0*s.x-s.y))+c;n=float(i)+1.0;
    if(dot(z,z)>256.0)break;
  }
  if(n>=uIterations)return vec3(.005,.008,.015);
  float sn=n+1.0-log(max(.001,log(max(length(z),1.0001))))/log(3.0);
  return palette(sn*.045+.09*sin(uAngle))*(.35+.6*(1.0-exp(-sn*.18)));
}`,
      },
      {
        id: 'newton', name: "Newton basins", category: 'fractal', palette: 4, zoom: 1.0,
        code: `// @slider uIterations 12 64 1 36 | 반복 정밀도
// @slider uOrbit 0 0.5 0.01 0.18 | 시점 궤도
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 cdiv(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),.0000001);}
vec3 pattern(vec2 p) {
  vec2 z=p*1.4+uOrbit*uCycle;float n=0.0;
  for(int i=0;i<64;i++) {
    if(i>=int(uIterations))break;vec2 z2=cmul(z,z),f=cmul(z2,z)-vec2(1,0);
    if(dot(f,f)<.000001)break;z-=cdiv(f,3.0*z2);n+=1.0;
  }
  float d0=length(z-vec2(1,0)),d1=length(z-vec2(-.5,.8660254)),d2=length(z-vec2(-.5,-.8660254));
  vec3 c=d0<d1&&d0<d2?uColorA:(d1<d2?uColorB:uColorC);
  return c*(.18+.72*exp(-n*.065))*(.8+.2*cos(n*1.5));
}`,
      },
      {
        id: 'sierpinski', name: "Sierpinski fold", category: 'fractal', palette: 3, zoom: 1.0,
        code: `// @slider uDepth 3 9 1 6 | 재귀 깊이
vec3 pattern(vec2 p) {
  p=rotate(.12*sin(uAngle))*p*exp(.08*cos(uAngle));
  vec2 q=vec2((p.x+1.0)*.5,(p.y+.72)/1.7320508);
  q.x-=q.y*.5;
  if(q.x<0.0||q.y<0.0||q.x+q.y>1.0)return vec3(.015,.018,.022);
  float shade=1.0;
  for(int i=0;i<9;i++) {
    if(i>=int(uDepth))break;
    q*=2.0;
    if(q.x<1.0&&q.y<1.0&&q.x+q.y>1.0){shade=.04;break;}
    q=fract(q);
  }
  float edge=min(min(q.x,q.y),abs(1.0-q.x-q.y));
  return palette(p.y*.25+.08*sin(uAngle))*shade*(.48+.45*exp(-edge*14.0));
}`,
      },
      {
        id: 'aurora', name: "Aurora curtains", category: 'organic', palette: 0, zoom: 1.0,
        code: `// @slider uCurtains 2 8 1 5 | 커튼 층 수
// @slider uFlow 0.2 2 0.1 0.8 | 흐름 강도
vec3 pattern(vec2 p) {
  vec3 c=vec3(.005,.008,.016);
  for(int i=0;i<8;i++) {
    if(i>=int(uCurtains))break;float f=float(i);
    float y=-.55+f*.16+.15*sin(p.x*2.0+uAngle+f)+.08*sin(p.x*5.0-uAngle);
    float tex=fbm(vec2(p.x*3.0+f+uFlow*sin(uAngle),f+uFlow*cos(uAngle)));
    float d=p.y-y,curtain=exp(-abs(d)*5.0)*smoothstep(-.04,.08,d);
    c+=palette(f/uCurtains+tex*.18)*curtain*tex*.6;
  }
  return c;
}`,
      },
      {
        id: 'caustics', name: "Water caustics", category: 'organic', palette: 2, zoom: 1.0,
        code: `// @slider uScale 1 6 0.1 2.8 | 파면 밀도
// @slider uSharpness 1 8 0.2 4 | 빛 집중도
vec3 pattern(vec2 p) {
  vec2 q=p*uScale;float field=0.0;
  for(int i=0;i<4;i++) {
    float k=float(i)+1.0;
    q=rotate(.85)*q+vec2(sin(q.y+uAngle+k),cos(q.x-uAngle+k))*.45;
    field+=sin(q.x*k*.6+uAngle)*cos(q.y*k*.6-uAngle)/k;
  }
  float light=exp(-abs(field)*uSharpness*3.0);
  return palette(field*.1+.28)*(.07+light*.92);
}`,
      },
      {
        id: 'metaballs', name: "Metaball islands", category: 'organic', palette: 1, zoom: 1.0,
        code: `// @slider uBalls 3 10 1 6 | 액체 입자 수
// @slider uRadius 0.015 0.09 0.005 0.045 | 입자 크기
vec3 pattern(vec2 p) {
  float field=0.0;
  for(int i=0;i<10;i++) {
    if(i>=int(uBalls))break;float fi=float(i),a=fi*TAU/uBalls;
    vec2 pos=.64*vec2(cos(a+uAngle),sin(a-uAngle))+.16*vec2(sin(uAngle*2.0+fi),cos(uAngle*2.0-fi));
    field+=uRadius/max(dot(p-pos,p-pos),.002);
  }
  float inside=smoothstep(.9,1.1,field),edge=exp(-abs(field-1.0)*10.0);
  return palette(field*.08+.08*sin(uAngle))*(inside*.48+edge*.52);
}`,
      },
      {
        id: 'contour-waves', name: "Topographic dunes", category: 'organic', palette: 3, zoom: 1.0,
        code: `// @slider uContours 4 24 1 14 | 등고선 수
// @slider uRelief 0.1 1.2 0.05 0.6 | 지형 굴곡
vec3 pattern(vec2 p) {
  float h=p.y+uRelief*(fbm(p*2.0+uCycle*.4)-.5)+.16*sin(p.x*2.0+uAngle);
  float wave=sin(h*uContours*PI);
  float line=stroke(wave,.09);
  return palette(h*.22+.2)*(.08+.75*line);
}`,
      },
      {
        id: 'plasma', name: "Harmonic plasma", category: 'organic', palette: 4, zoom: 1.0,
        code: `// @slider uFrequency 1 10 0.2 4 | 파동 밀도
// @slider uBands 1 6 0.25 2 | 색 띠 수
vec3 pattern(vec2 p) {
  float v=sin(p.x*uFrequency+uAngle)+sin(p.y*uFrequency-uAngle);
  v+=sin((p.x+p.y)*uFrequency*.7+uAngle);
  v+=sin(length(p-.4*uCycle)*uFrequency*1.4);
  return palette(v*uBands*.12+.5)*(.62+.28*cos(v));
}`,
      },
      {
        id: 'torus', name: "Twisted torus", category: 'volume', palette: 4, zoom: 1.0,
        code: `// @slider uTube 0.08 0.35 0.01 0.2 | 고리 두께
// @slider uTwist 0 3 0.1 1.2 | 표면 꼬임
float torusField(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;p.yz=rotate(.5)*p.yz;
  float a=atan(p.z,p.x),r=.63+.07*sin(a*3.0+uTwist*sin(uAngle));
  return length(vec2(length(p.xz)-r,p.y))-uTube;
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3),rd=normalize(vec3(p,-2.1));float t=0.0;bool hit=false;
  for(int i=0;i<80;i++){float d=torusField(ro+rd*t);if(d<.0015){hit=true;break;}t+=max(.001,d*.7);if(t>5.0)break;}
  if(!hit)return vec3(.008,.01,.018);
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(torusField(q+e.xyy)-torusField(q-e.xyy),torusField(q+e.yxy)-torusField(q-e.yxy),torusField(q+e.yyx)-torusField(q-e.yyx)));
  float diff=max(dot(n,normalize(vec3(-.6,1,1))),0.0),rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  return palette(q.y*.5+q.x*.2)*(.18+.75*diff)+palette(.7)*rim*.4;
}`,
      },
      {
        id: 'superquadric', name: "Morphing superellipsoid", category: 'volume', palette: 2, zoom: 1.0,
        code: `// @slider uPower 2 7 0.2 4 | 곡면 지수
// @slider uMorph 0 1 0.05 0.7 | 형태 변화
float solidField(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;p.yz=rotate(.35*sin(uAngle))*p.yz;
  float k=max(2.0,uPower+uMorph*sin(uAngle));vec3 q=pow(abs(p),vec3(k));
  return pow(q.x+q.y+q.z,1.0/k)-.65;
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3),rd=normalize(vec3(p,-2.2));float t=0.0;bool hit=false;
  for(int i=0;i<80;i++){float d=solidField(ro+rd*t);if(d<.0015){hit=true;break;}t+=max(.001,d*.65);if(t>5.0)break;}
  if(!hit)return vec3(.008,.01,.018);
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(solidField(q+e.xyy)-solidField(q-e.xyy),solidField(q+e.yxy)-solidField(q-e.yxy),solidField(q+e.yyx)-solidField(q-e.yyx)));
  float diff=max(dot(n,normalize(vec3(-.6,.9,1))),0.0);
  float lines=pow(.5+.5*cos((q.y+.1*sin(q.x*8.0))*45.0),8.0);
  return palette(q.y*.4+.2)*(.2+.65*diff)*(0.7+.3*lines)+vec3(pow(max(dot(reflect(rd,n),normalize(vec3(-.6,.9,1))),0.0),24.0))*.3;
}`,
      },
      {
        id: 'schwarz', name: "Schwarz P surface", category: 'volume', palette: 0, zoom: 1.0,
        code: `// @slider uFrequency 3 7 0.2 4.2 | 곡면 주파수
// @slider uThickness 0.05 0.4 0.01 0.14 | 벽 두께
float porousField(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;p.yz=rotate(.2*sin(uAngle))*p.yz;
  vec3 q=cos(p*uFrequency);float surface=(abs(q.x+q.y+q.z)-uThickness)/(uFrequency*1.8);
  return max(surface,length(p)-1.05);
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3.3),rd=normalize(vec3(p,-2.2));float t=0.0;bool hit=false;
  for(int i=0;i<110;i++){float d=porousField(ro+rd*t);if(d<.0015){hit=true;break;}t+=max(d,.001);if(t>5.0)break;}
  if(!hit)return vec3(.008,.01,.018);
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(porousField(q+e.xyy)-porousField(q-e.xyy),porousField(q+e.yxy)-porousField(q-e.yxy),porousField(q+e.yyx)-porousField(q-e.yyx)));
  float diff=max(dot(n,normalize(vec3(-.8,.9,1))),0.0),rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  return palette(q.y*.25+q.z*.18)*(.14+.8*diff)+palette(.65)*rim*.35;
}`,
      },
    ],
  };
  SX.presets.byId = (id) => SX.presets.list.find((p) => p.id === id);
})((window.SX = window.SX || {}));
