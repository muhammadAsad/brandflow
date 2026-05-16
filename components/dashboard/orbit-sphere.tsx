'use client';

import { InstagramIcon, LinkedinIcon, TikTokIcon, FacebookIcon, XIcon, YoutubeIcon } from '@/components/ui/platform-icons';
import type { FC } from 'react';

interface IconProps { size?: number; color?: string; }

const SOCIAL_ICONS: { Icon: FC<IconProps>; color: string; bg: string; label: string; animName: string; duration: number }[] = [
  { Icon: InstagramIcon, color: '#e1306c', bg: '#fce4ec', label: 'Instagram', animName: 'orbit1', duration: 8    },
  { Icon: LinkedinIcon,  color: '#0077b5', bg: '#e3f2fd', label: 'LinkedIn',  animName: 'orbit2', duration: 10   },
  { Icon: TikTokIcon,    color: '#010101', bg: '#f3f4f6', label: 'TikTok',    animName: 'orbit3', duration: 9    },
  { Icon: FacebookIcon,  color: '#1877f2', bg: '#e8f0fe', label: 'Facebook',  animName: 'orbit4', duration: 11   },
  { Icon: XIcon,         color: '#000',    bg: '#f3f4f6', label: 'X',         animName: 'orbit5', duration: 7.5  },
  { Icon: YoutubeIcon,   color: '#ff0000', bg: '#ffebee', label: 'YouTube',   animName: 'orbit6', duration: 12   },
];

export function OrbitSphere() {
  return (
    <div style={{ position: 'relative', width: 340, height: 340, margin: '0 auto' }}>
      <style>{`
        @keyframes orbit1{from{transform:rotate(0deg) translateX(140px) rotate(0deg)}to{transform:rotate(360deg) translateX(140px) rotate(-360deg)}}
        @keyframes orbit2{from{transform:rotate(60deg) translateX(140px) rotate(-60deg)}to{transform:rotate(420deg) translateX(140px) rotate(-420deg)}}
        @keyframes orbit3{from{transform:rotate(120deg) translateX(140px) rotate(-120deg)}to{transform:rotate(480deg) translateX(140px) rotate(-480deg)}}
        @keyframes orbit4{from{transform:rotate(180deg) translateX(140px) rotate(-180deg)}to{transform:rotate(540deg) translateX(140px) rotate(-540deg)}}
        @keyframes orbit5{from{transform:rotate(240deg) translateX(140px) rotate(-240deg)}to{transform:rotate(600deg) translateX(140px) rotate(-600deg)}}
        @keyframes orbit6{from{transform:rotate(300deg) translateX(140px) rotate(-300deg)}to{transform:rotate(660deg) translateX(140px) rotate(-660deg)}}
        @keyframes pulse-sphere{0%,100%{box-shadow:0 0 40px rgba(124,58,237,0.3),0 0 80px rgba(124,58,237,0.15)}50%{box-shadow:0 0 60px rgba(124,58,237,0.5),0 0 120px rgba(124,58,237,0.25)}}
        @keyframes ring-spin{from{transform:rotateX(65deg) rotateZ(0deg)}to{transform:rotateX(65deg) rotateZ(360deg)}}
        @keyframes ring-spin2{from{transform:rotateX(75deg) rotateZ(90deg)}to{transform:rotateX(75deg) rotateZ(450deg)}}
        .orbit-icon{position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.12);cursor:pointer;transition:transform 0.2s}
        .orbit-icon:hover{transform:scale(1.15)!important}
      `}</style>

      {/* Orbit rings */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.15)', position: 'absolute' }} />
        <div style={{ width: 220, height: 100, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.2)', position: 'absolute', animation: 'ring-spin 12s linear infinite' }} />
        <div style={{ width: 260, height: 110, borderRadius: '50%', border: '1px solid rgba(14,165,233,0.15)', position: 'absolute', animation: 'ring-spin2 18s linear infinite' }} />
      </div>

      {/* Center sphere */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #4c1d95, #1e1b4b 60%, #0f0a1e)',
        animation: 'pulse-sphere 3s ease-in-out infinite',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 1 }}>Your Brand</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'center', lineHeight: 1.2 }}>360°<br />Overview</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, textAlign: 'center', marginTop: 4, lineHeight: 1.3, maxWidth: 80 }}>All channels &amp; touchpoints</div>
      </div>

      {/* Orbiting icons */}
      {SOCIAL_ICONS.map((s) => (
        <div key={s.label} className="orbit-icon" style={{
          background: s.bg,
          border: `2px solid ${s.color}22`,
          animation: `${s.animName} ${s.duration}s linear infinite`,
        }}>
          <s.Icon size={18} color={s.color} />
        </div>
      ))}
    </div>
  );
}
