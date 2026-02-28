import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSocket } from '../providers/Socket';
import { useToaster } from '../providers/Toaster';
import { usePeer } from '../providers/Peer';

/* ─────────────────────────────────────────────
   CSS — injected once into <head>
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .gm-room {
    --bg:       #202124;
    --surface:  #2d2e30;
    --surface2: #3c3d40;
    --surface3: #48494c;
    --border:   rgba(255,255,255,0.08);
    --accent:   #8ab4f8;
    --danger:   #f28b82;
    --green:    #81c995;
    --warning:  #fdd663;
    --text:     #e8eaed;
    --text-sub: #9aa0a6;
    --radius:   14px;
    --z:        9999;

    font-family: 'Google Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    user-select: none;
  }

  /* ── Top Bar ── */
  .gm-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    flex-shrink: 0;
    z-index: 10;
  }
  .gm-room-meta { display: flex; flex-direction: column; gap: 3px; }
  .gm-room-meta h2 { font-size: 15px; font-weight: 600; color: var(--text); }
  .gm-roomid-row {
    display: flex; align-items: center; gap: 6px;
    cursor: pointer; width: fit-content;
  }
  .gm-roomid-row code {
    font-family: 'Courier New', monospace;
    font-size: 12px; color: var(--text-sub);
    letter-spacing: .4px;
    background: var(--surface2);
    padding: 2px 8px; border-radius: 6px;
  }
  .gm-copy-btn {
    background: none; border: none; cursor: pointer;
    color: var(--text-sub); font-size: 13px; padding: 0;
    transition: color .15s;
  }
  .gm-copy-btn:hover { color: var(--accent); }
  .gm-participant-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 12px; font-weight: 500; color: var(--text-sub);
  }
  .gm-participant-pill .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--green);
    animation: livePulse 2s infinite;
  }
  @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.35} }
  .gm-topbar-actions { display: flex; gap: 8px; }
  .gm-icon-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 50%;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 17px;
    transition: filter .15s;
  }
  .gm-icon-btn:hover { filter: brightness(1.3); }

  /* ── Video Content ── */
  .gm-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 20px;
    overflow: hidden;
  }
  .gm-grid {
    display: grid; gap: 8px;
    width: 100%; height: 100%;
  }
  .gm-grid.solo { grid-template-columns: 1fr; grid-template-rows: 1fr; }
  .gm-grid.duo  { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }

  /* ── Tile ── */
  .gm-tile {
    position: relative;
    border-radius: var(--radius);
    overflow: hidden;
    background: #1a1b1d;
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    min-height: 140px;
    animation: tileAppear .3s cubic-bezier(.34,1.3,.64,1);
  }
  @keyframes tileAppear {
    from { opacity:0; transform:scale(.94); }
    to   { opacity:1; transform:scale(1); }
  }
  .gm-tile video {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    background: #000;
  }
  /* Mirror local video */
  .gm-tile.local video { transform: scaleX(-1); }

  /* Avatar (camera off) */
  .gm-avatar-wrap {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    width: 100%; height: 100%;
    background: #1a1b1d;
  }
  .gm-avatar-circle {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #4285f4, #34a853);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; font-weight: 700; color: #fff;
    box-shadow: 0 4px 24px rgba(66,133,244,.3);
  }
  .gm-avatar-name {
    font-size: 14px; font-weight: 500;
    color: var(--text-sub);
    max-width: 200px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    text-align: center;
  }

  /* Label overlay */
  .gm-tile-label {
    position: absolute; bottom: 10px; left: 10px;
    display: flex; align-items: center; gap: 6px;
    background: rgba(0,0,0,.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 13px; font-weight: 500; color: #fff;
    pointer-events: none;
    max-width: calc(100% - 20px);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .gm-host-chip {
    background: var(--accent); color: #202124;
    font-size: 10px; font-weight: 700;
    padding: 1px 7px; border-radius: 10px; flex-shrink: 0;
  }

  /* Muted badge */
  .gm-muted-badge {
    position: absolute; bottom: 10px; right: 10px;
    background: rgba(242,139,130,.9);
    border-radius: 50%;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; pointer-events: none;
  }

  /* Connecting spinner */
  .gm-connecting {
    position: absolute; inset: 0;
    background: rgba(26,27,29,.85);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    border-radius: var(--radius); z-index: 2;
  }
  .gm-spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(138,180,248,.18);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .gm-connecting p { font-size: 13px; color: var(--text-sub); }

  /* ── Controls ── */
  .gm-controls {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    padding: 12px 24px 20px; gap: 10px;
  }
  .gm-ctrl-btn {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 5px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 16px;
    width: 76px; height: 66px;
    cursor: pointer; color: var(--text);
    font-family: inherit; font-size: 11px; font-weight: 500;
    transition: background .15s, transform .1s;
  }
  .gm-ctrl-btn .c-icon { font-size: 22px; line-height: 1; }
  .gm-ctrl-btn:hover { background: var(--surface3); }
  .gm-ctrl-btn:active { transform: scale(.94); }
  .gm-ctrl-btn.off {
    background: rgba(242,139,130,.12);
    border-color: rgba(242,139,130,.3);
    color: var(--danger);
  }
  .gm-ctrl-btn.off:hover { background: rgba(242,139,130,.22); }
  .gm-end-btn {
    width: 66px; height: 66px; border-radius: 50%;
    background: var(--danger); border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 24px;
    transition: filter .15s, transform .1s; margin: 0 8px;
  }
  .gm-end-btn:hover  { filter: brightness(1.15); }
  .gm-end-btn:active { transform: scale(.94); }
  .gm-ctrl-divider {
    width: 1px; height: 44px;
    background: var(--border); margin: 0 4px;
  }

  /* ── Admit Cards ── */
  .gm-admit-stack {
    position: fixed; top: 20px; right: 20px;
    z-index: var(--z);
    display: flex; flex-direction: column; gap: 10px;
    max-width: 360px; pointer-events: none;
  }
  .gm-admit-card {
    background: #2d2e30;
    border: 1px solid rgba(138,180,248,.25);
    border-radius: 18px; padding: 18px 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,.6);
    animation: admitIn .35s cubic-bezier(.34,1.4,.64,1);
    pointer-events: all;
    display: flex; flex-direction: column; gap: 14px;
  }
  @keyframes admitIn {
    from { opacity:0; transform:translateX(50px) scale(.92); }
    to   { opacity:1; transform:translateX(0) scale(1); }
  }
  .gm-admit-top { display: flex; align-items: center; gap: 12px; }
  .gm-admit-av {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, #4285f4, #34a853);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .gm-admit-info p {
    font-size: 14px; font-weight: 600; color: #e8eaed;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 230px;
  }
  .gm-admit-info span { font-size: 12px; color: #9aa0a6; }
  .gm-admit-btns { display: flex; gap: 8px; }
  .gm-admit-deny {
    flex: 1; padding: 9px 0;
    background: transparent; border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px; color: #e8eaed;
    font-family: 'Google Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background .15s;
  }
  .gm-admit-deny:hover { background: rgba(255,255,255,.06); }
  .gm-admit-allow {
    flex: 1; padding: 9px 0;
    background: #8ab4f8; border: none; border-radius: 10px; color: #202124;
    font-family: 'Google Sans', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: filter .15s;
  }
  .gm-admit-allow:hover { filter: brightness(1.1); }

  /* ── Toast Stack ── */
  .gm-toast-stack {
    position: fixed; bottom: 96px; left: 50%;
    transform: translateX(-50%);
    z-index: var(--z);
    display: flex; flex-direction: column-reverse; gap: 8px;
    align-items: center; pointer-events: none;
  }
  .gm-toast {
    display: flex; align-items: center; gap: 8px;
    background: #3c3d40; color: #e8eaed;
    border-radius: 26px; padding: 10px 20px;
    font-size: 13px; font-weight: 500;
    box-shadow: 0 4px 24px rgba(0,0,0,.45);
    border-left: 3px solid #8ab4f8;
    animation: toastIn .3s ease, toastOut .4s ease 2.6s forwards;
    white-space: nowrap; max-width: 380px;
  }
  .gm-toast.success { border-color: #81c995; }
  .gm-toast.error   { border-color: #f28b82; }
  .gm-toast.warning { border-color: #fdd663; }
  @keyframes toastIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastOut { to{opacity:0;transform:translateY(-8px)} }

  /* ── Waiting Screen ── */
  .gm-waiting {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
  }
  .gm-waiting-spinner {
    width: 52px; height: 52px;
    border: 4px solid rgba(138,180,248,.15);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .9s linear infinite;
  }
  .gm-waiting h3 { font-size: 18px; font-weight: 600; color: var(--text); }
  .gm-waiting p  { font-size: 14px; color: var(--text-sub); }

  @media (max-width: 640px) {
    .gm-grid.duo { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
    .gm-ctrl-btn { width: 64px; height: 58px; }
    .gm-ctrl-btn .c-icon { font-size: 20px; }
  }
`;

/* ─────────────────────────────────────────────
   Internal toast hook
───────────────────────────────────────────── */
function useToasts() {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setList(p => [...p, { id, msg, type }]);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { list, push };
}

/* ─────────────────────────────────────────────
   Room Component
───────────────────────────────────────────── */
function Room() {
  const { socket } = useSocket();
  const { showToast } = useToaster();                     // kept for compatibility
  const { list: toasts, push: pushToast } = useToasts();
  const { createOffer, createAnswer, peer } = usePeer();

  // ── Media ──
  const [myStream,   setMyStream]   = useState(null);
  const [isMicOn,    setIsMicOn]    = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // ── Room state ──
  // roomId and myEmail are passed via sessionStorage by the Lobby page.
  // Fallback: read from URL /room/:roomId
  const [roomId,    setRoomId]    = useState('');
  const [myEmail,   setMyEmail]   = useState('');
  const [isOwner,   setIsOwner]   = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);   // guest waiting for admit
  const [participantCount, setParticipantCount] = useState(1);

  // ── Remote participant ──
  const [remoteUser,   setRemoteUser]   = useState(null);   // { email }
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  /*
   * THE KEY FIX — dual storage for remote stream:
   *
   * remoteStreamRef is always in sync with the actual MediaStream.
   * It is updated synchronously inside ontrack (no re-render needed).
   *
   * When the remote <video> element mounts (because remoteUser just
   * became non-null and React re-rendered), the callback ref
   * `setRemoteVideoRef` fires immediately and attaches
   * remoteStreamRef.current to the video element — even if ontrack
   * already fired before this render happened.
   *
   * This fixes the host-side "no remote video" bug where:
   *   ontrack fires → remoteRef.current is null (tile not rendered yet)
   *   → stream stored in remoteStreamRef
   *   → setRemoteUser() triggers render → <video> mounts
   *   → setRemoteVideoRef fires → stream attached ✅
   */
  const remoteStreamRef = useRef(null);

  // ── DOM refs ──
  const localRef  = useRef(null);
  const remoteRef = useRef(null);

  // Who we are currently doing WebRTC negotiation with
  const pendingEmailRef = useRef(null);

  /* ── Inject CSS ── */
  useEffect(() => {
    const id = 'gm-room-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = STYLES;
      document.head.appendChild(s);
    }
    return () => { const s = document.getElementById(id); if (s) s.remove(); };
  }, []);

  /* ── Read room info from sessionStorage (set by Lobby) ── */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('meetclone_room');
      if (stored) {
        const { roomId: rid, email } = JSON.parse(stored);
        setRoomId(rid   || getIdFromUrl());
        setMyEmail(email || 'You');
        return;
      }
    } catch { /* ignore */ }
    setRoomId(getIdFromUrl());
    setMyEmail('You');
  }, []);

  function getIdFromUrl() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  /* ── Start local camera/mic ── */
  const startLocalStream = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        pushToast('Camera not supported', 'error'); return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localRef.current) localRef.current.srcObject = stream;
      setMyStream(stream);
      stream.getTracks().forEach(track => {
        try { peer.addTrack(track, stream); } catch (_) {}
      });
    } catch {
      pushToast('Unable to access camera / microphone', 'error');
    }
  }, [peer, pushToast]);

  useEffect(() => { startLocalStream(); }, [startLocalStream]);

  /* ──────────────────────────────────────────────────────────
     REMOTE TRACK — THE CORE FIX
     ──────────────────────────────────────────────────────────
     ontrack can fire BEFORE React renders the remote tile
     (because remoteUser state hasn't been set yet when the
     host receives the answer).

     We solve this by:
     1. Storing the stream in a ref (remoteStreamRef) synchronously.
     2. If <video> already exists → attach immediately.
     3. If not → the callback ref setRemoteVideoRef will attach
        it the moment the element mounts.
  ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onTrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      console.log('[ontrack] stream received, tracks:', stream.getTracks().length);

      // Step 1 — store synchronously
      remoteStreamRef.current = stream;

      // Step 2 — attach if video element already exists
      if (remoteRef.current) {
        remoteRef.current.srcObject = stream;
      }

      // Step 3 — update state (triggers re-render so tile shows video)
      setRemoteStream(stream);
      setIsConnecting(false);
    };

    peer.addEventListener('track', onTrack);
    return () => peer.removeEventListener('track', onTrack);
  }, [peer]);

  /*
   * Callback ref for the remote <video> element.
   * Fires the instant the DOM node is created.
   * We immediately attach remoteStreamRef.current — fixing the race.
   */
  const setRemoteVideoRef = useCallback((el) => {
    remoteRef.current = el;
    if (el && remoteStreamRef.current) {
      console.log('[callbackRef] attaching stream to remote video element');
      el.srcObject = remoteStreamRef.current;
    }
  }, []);

  /* Safety-net useEffect: sync stream → video if both exist */
  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteUser, remoteStream]);

  /* ── ICE candidate sharing ── */
  useEffect(() => {
    const onIce = (e) => {
      if (e.candidate && pendingEmailRef.current) {
        socket.emit('ice_candidate', {
          candidate: e.candidate,
          email: pendingEmailRef.current,
        });
      }
    };
    peer.addEventListener('icecandidate', onIce);
    return () => peer.removeEventListener('icecandidate', onIce);
  }, [peer, socket]);

  /* ── Negotiation needed ── */
  useEffect(() => {
    const onNeg = async () => {
      try {
        if (!pendingEmailRef.current) return;
        const offer = await createOffer();
        setTimeout(() => {
          socket.emit('call_user', { offer, email: pendingEmailRef.current });
        }, 800);
      } catch (err) { console.error('negotiationneeded:', err); }
    };
    peer.addEventListener('negotiationneeded', onNeg);
    return () => peer.removeEventListener('negotiationneeded', onNeg);
  }, [peer, createOffer, socket]);

  /* ──────────────────────────────────────────────────────────
     SOCKET EVENT HANDLERS — matched exactly to your backend
     ──────────────────────────────────────────────────────────
     Backend emits:
       → room_joined      { roomId, isOwner }
       → wait_for_admit   { roomId }
       → admit_request    { roomId, email }
       → user_joined      { email }
       → call_made        { offer, email }
       → answer_made      { answer, email }
       (ice_candidate relay added below — needs backend support)
  ────────────────────────────────────────────────────────── */

  /* room_joined: emitted to BOTH owner and admitted participant */
  const handleRoomJoined = useCallback(({ roomId: rid, isOwner: owner }) => {
    setIsOwner(owner);
    setIsWaiting(false);
    setRoomId(prev => prev || rid);
    if (owner) {
      pushToast('Room created! Waiting for participants…', 'success');
    } else {
      pushToast('You joined the meeting!', 'success');
    }
  }, [pushToast]);

  /* wait_for_admit: guest is waiting in lobby */
  const handleWaitForAdmit = useCallback(() => {
    setIsWaiting(true);
    pushToast('Waiting for the host to admit you…', 'info');
  }, [pushToast]);

  /* admit_request: host receives — someone wants in */
  const handleAdmitRequest = useCallback((data) => {
    setAdmitQueue(q => q.find(r => r.email === data.email) ? q : [...q, data]);
  }, []);

  /* user_joined: broadcast when someone is admitted — both sides receive this */
  const handleUserJoined = useCallback(({ email }) => {
    pushToast(`${email} joined the meeting`, 'success');
    setParticipantCount(c => c + 1);
  }, [pushToast]);

  /* call_made: GUEST receives offer from host */
  const handleCallMade = useCallback(async ({ offer, email }) => {
    console.log('[call_made] offer from host:', email);
    try {
      pendingEmailRef.current = email;
      const answer = await createAnswer(offer);
      socket.emit('make_answer', { answer, email });
      // Guest shows host's tile
      setRemoteUser({ email });
      setIsConnecting(false);
    } catch (err) { console.error('handleCallMade:', err); }
  }, [createAnswer, socket]);

  /* answer_made: HOST receives answer from guest */
  const handleAnswerMade = useCallback(async ({ answer, email }) => {
    console.log('[answer_made] answer from guest:', email);
    try {
      await peer.setRemoteDescription(answer);
      // Host shows guest's tile — this triggers setRemoteVideoRef callback ref
      setRemoteUser({ email });
      setIsConnecting(false);
    } catch (err) { console.error('handleAnswerMade:', err); }
  }, [peer]);

  /* ice_candidate: trickle ICE relay (add this to your backend too — see note) */
  const handleIceCandidate = useCallback(async ({ candidate }) => {
    try {
      if (candidate) await peer.addIceCandidate(candidate);
    } catch (err) { console.error('handleIceCandidate:', err); }
  }, [peer]);

  /* user disconnected */
  const handleUserLeft = useCallback(({ email } = {}) => {
    pushToast(`${email || 'A participant'} left the meeting`, 'warning');
    setRemoteUser(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setIsConnecting(false);
    pendingEmailRef.current = null;
    setParticipantCount(c => Math.max(1, c - 1));
    if (remoteRef.current) remoteRef.current.srcObject = null;
  }, [pushToast]);

  // Admit queue state (moved up for handleAdmitRequest closure)
  const [admitQueue, setAdmitQueue] = useState([]);

  useEffect(() => {
    socket.on('room_joined',    handleRoomJoined);
    socket.on('wait_for_admit', handleWaitForAdmit);
    socket.on('admit_request',  handleAdmitRequest);
    socket.on('user_joined',    handleUserJoined);
    socket.on('call_made',      handleCallMade);
    socket.on('answer_made',    handleAnswerMade);
    socket.on('ice_candidate',  handleIceCandidate);
    socket.on('user_left',      handleUserLeft);
    socket.on('user_disconnected', handleUserLeft);
    socket.on('peer_disconnected', handleUserLeft);
    return () => {
      socket.off('room_joined',    handleRoomJoined);
      socket.off('wait_for_admit', handleWaitForAdmit);
      socket.off('admit_request',  handleAdmitRequest);
      socket.off('user_joined',    handleUserJoined);
      socket.off('call_made',      handleCallMade);
      socket.off('answer_made',    handleAnswerMade);
      socket.off('ice_candidate',  handleIceCandidate);
      socket.off('user_left',      handleUserLeft);
      socket.off('user_disconnected', handleUserLeft);
      socket.off('peer_disconnected', handleUserLeft);
    };
  }, [
    socket,
    handleRoomJoined, handleWaitForAdmit, handleAdmitRequest,
    handleUserJoined, handleCallMade, handleAnswerMade,
    handleIceCandidate, handleUserLeft,
  ]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (myStream) myStream.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line

  /* ── Join room on mount (emit join_room matching your backend) ── */
  useEffect(() => {
    if (!roomId || !myEmail || myEmail === 'You') return;
    // Only emit once we have both roomId and email
    socket.emit('join_room', { roomId, email: myEmail });
  }, [roomId, myEmail, socket]);

  /* ── Admit a user ── */
  const admitUser = async (req) => {
    setAdmitQueue(q => q.filter(r => r.email !== req.email));
    pendingEmailRef.current = req.email;
    try {
      // Tell backend user is admitted
      socket.emit('admitted', { roomId, email: req.email });
      // Create and send offer to guest
      const offer = await createOffer();
      setTimeout(() => {
        socket.emit('call_user', { offer, email: req.email });
      }, 600);
      setIsConnecting(true);
      pushToast(`${req.email} admitted`, 'success');
    } catch (err) { console.error('admitUser:', err); }
  };

  const denyUser = (req) => {
    setAdmitQueue(q => q.filter(r => r.email !== req.email));
    socket.emit('denied', { roomId, email: req.email });
    pushToast(`${req.email} was denied`, 'info');
  };

  /* ── Mic / Camera toggles ── */
  const toggleMic = () => {
    if (!myStream) return;
    const next = !isMicOn;
    myStream.getAudioTracks().forEach(t => (t.enabled = next));
    setIsMicOn(next);
    pushToast(next ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleCamera = () => {
    if (!myStream) return;
    const next = !isCameraOn;
    const tracks = myStream.getVideoTracks();
    if (!tracks.length) { pushToast('No video track', 'error'); return; }
    tracks.forEach(t => (t.enabled = next));
    setIsCameraOn(next);
    pushToast(next ? 'Camera on' : 'Camera off');
  };

  /* ── End call ── */
  const handleEndCall = () => {
    if (myStream) myStream.getTracks().forEach(t => t.stop());
    window.location.href = '/';
  };

  /* ── Copy room ID ── */
  const copyRoomId = () => {
    navigator.clipboard?.writeText(roomId)
      .then(() => pushToast('Room ID copied!', 'success'))
      .catch(() => pushToast('Could not copy', 'error'));
  };

  /* ── Helpers ── */
  const initial   = (email) => (email || 'Y').charAt(0).toUpperCase();
  const gridClass = remoteUser ? 'duo' : 'solo';

  /* ── Waiting screen (guest waiting for admit) ── */
  if (isWaiting) {
    return (
      <div className="gm-room">
        <div className="gm-waiting">
          <div className="gm-waiting-spinner" />
          <h3>Waiting to be admitted</h3>
          <p>The host will let you in shortly</p>
          <button
            className="gm-ctrl-btn"
            style={{ marginTop: 12 }}
            onClick={handleEndCall}
          >
            <span className="c-icon">✕</span>
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gm-room">

      {/* ── Top Bar ── */}
      <div className="gm-topbar">
        <div className="gm-room-meta">
          <h2>Meeting Room</h2>
          <div className="gm-roomid-row" onClick={copyRoomId} title="Click to copy Room ID">
            <code>{roomId || '...'}</code>
            <button className="gm-copy-btn">📋</button>
          </div>
        </div>

        <div className="gm-participant-pill">
          <span className="live-dot" />
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>

        <div className="gm-topbar-actions">
          <button className="gm-icon-btn" title="More options">⋮</button>
          <button className="gm-icon-btn" title="Settings">⚙️</button>
        </div>
      </div>

      {/* ── Video Grid ── */}
      <div className="gm-content">
        <div className={`gm-grid ${gridClass}`}>

          {/* ── Local tile — always visible on BOTH machines ── */}
          <div className="gm-tile local">
            {isCameraOn ? (
              <video ref={localRef} autoPlay playsInline muted />
            ) : (
              <div className="gm-avatar-wrap">
                <div className="gm-avatar-circle">{initial(myEmail)}</div>
                <span className="gm-avatar-name">{myEmail} (camera off)</span>
              </div>
            )}
            <div className="gm-tile-label">
              {myEmail}
              {isOwner && <span className="gm-host-chip">Host</span>}
            </div>
            {!isMicOn && <div className="gm-muted-badge">🔇</div>}
          </div>

          {/* ── Remote tile ──
               Appears on BOTH machines once connection is established.
               Uses callback ref (setRemoteVideoRef) instead of plain ref.
               This fires the instant the DOM element mounts and attaches
               the stream from remoteStreamRef — fixing the race condition
               where ontrack fired before this tile was rendered. ── */}
          {remoteUser && (
            <div className="gm-tile remote">
              <video
                ref={setRemoteVideoRef}
                autoPlay
                playsInline
              />

              {/* Spinner while WebRTC is negotiating */}
              {isConnecting && (
                <div className="gm-connecting">
                  <div className="gm-spinner" />
                  <p>Connecting…</p>
                </div>
              )}

              <div className="gm-tile-label">{remoteUser.email}</div>
            </div>
          )}

        </div>
      </div>

      {/* ── Controls ── */}
      <div className="gm-controls">
        <button
          className={`gm-ctrl-btn ${isMicOn ? '' : 'off'}`}
          onClick={toggleMic}
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          <span className="c-icon">{isMicOn ? '🎤' : '🔇'}</span>
          <span>{isMicOn ? 'Mute' : 'Unmute'}</span>
        </button>

        <button
          className={`gm-ctrl-btn ${isCameraOn ? '' : 'off'}`}
          onClick={toggleCamera}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          <span className="c-icon">{isCameraOn ? '📷' : '🚫'}</span>
          <span>{isCameraOn ? 'Camera' : 'Cam off'}</span>
        </button>

        <div className="gm-ctrl-divider" />

        <button className="gm-end-btn" onClick={handleEndCall} title="Leave call">
          📞
        </button>
      </div>

      {/* ── Admit Request Cards ── */}
      <div className="gm-admit-stack">
        {admitQueue.map((req) => (
          <div key={req.email} className="gm-admit-card">
            <div className="gm-admit-top">
              <div className="gm-admit-av">{initial(req.email)}</div>
              <div className="gm-admit-info">
                <p>{req.email}</p>
                <span>wants to join this meeting</span>
              </div>
            </div>
            <div className="gm-admit-btns">
              <button className="gm-admit-deny"  onClick={() => denyUser(req)}>Deny</button>
              <button className="gm-admit-allow" onClick={() => admitUser(req)}>Admit</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toast Stack ── */}
      <div className="gm-toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`gm-toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>

    </div>
  );
}

export default Room;