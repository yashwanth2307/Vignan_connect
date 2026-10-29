'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
    MessageCircle, Users, Send, Maximize2, Hand, X, PenTool, VolumeX,
    CircleDot, Download, ShieldAlert, Ban, MessageSquareOff, Trash2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';

interface Props {
    roomName: string;
    userName: string;
    isHost?: boolean | null;
}

const SERVER_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '') || 'http://localhost:4000';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
    ]
};

export function VConnectClassroom({ roomName, userName, isHost = false }: Props) {
    const { user } = useAuth();
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    
    // Participants and their streams
    const [peers, setPeers] = useState<{ [id: string]: { userName: string, isHost: boolean, stream?: MediaStream } }>({});
    const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
    
    // Media & UI state
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [activePresenter, setActivePresenter] = useState<string | null>(null);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [whiteboardColor, setWhiteboardColor] = useState('#3b82f6');
    const [showChat, setShowChat] = useState(false);
    const [chatDisabled, setChatDisabled] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [messages, setMessages] = useState<{ user: string; text: string; time: string; system?: boolean }[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Drawing state
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

    // Stream ref to avoid closure issues
    const streamRef = useRef<MediaStream | null>(null);
    streamRef.current = stream;

    // Track active remote screen sharer
    const remoteScreenPeer = Object.entries(peers).find(([_, p]) => p.isHost && p.stream);

    // Initialize Camera and Socket
    useEffect(() => {
        let localStream: MediaStream | null = null;

        const initMediaAndSocket = async () => {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                });
            } catch (err) {
                console.warn('Could not access video+audio, trying audio only:', err);
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    setVideoEnabled(false);
                } catch (audioErr) {
                    console.error('Microphone and camera permission denied:', audioErr);
                }
            }

            if (localStream) {
                setStream(localStream);
                if (myVideoRef.current) myVideoRef.current.srcObject = localStream;
            }

            const s = io(`${SERVER_URL}/classroom`, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
            });
            setSocket(s);

            s.on('connect', () => {
                s.emit('join-room', { roomName, userName, isHost });
            });

            s.on('room-users', (users: any[]) => {
                const initPeers: any = {};
                users.forEach(u => {
                    initPeers[u.id] = { userName: u.userName, isHost: u.isHost };
                    createPeerConnection(u.id, s, localStream, true); // Caller initiates offer
                });
                setPeers(prev => ({ ...prev, ...initPeers }));
            });

            s.on('user-joined', (u: any) => {
                setPeers(prev => ({ ...prev, [u.id]: { userName: u.userName, isHost: u.isHost } }));
                createPeerConnection(u.id, s, localStream, false); // Wait for offer
            });

            s.on('offer', async ({ caller, sdp }) => {
                let pc = peersRef.current[caller];
                if (!pc) {
                    createPeerConnection(caller, s, streamRef.current, false);
                    pc = peersRef.current[caller];
                }
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    s.emit('answer', { target: caller, caller: s.id, sdp: answer });
                }
            });

            s.on('answer', async ({ caller, sdp }) => {
                const pc = peersRef.current[caller];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                }
            });

            s.on('ice-candidate', async ({ caller, candidate }) => {
                const pc = peersRef.current[caller];
                if (pc && candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('Error adding ICE candidate', e);
                    }
                }
            });

            s.on('user-left', ({ userId }) => {
                setPeers(prev => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });
                if (peersRef.current[userId]) {
                    peersRef.current[userId].close();
                    delete peersRef.current[userId];
                }
            });

            s.on('chat', (m: any) => setMessages(prev => [...prev, m]));

            // Admin Control Listeners
            s.on('admin-mute-all', () => {
                if (!isHost && streamRef.current) {
                    streamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
                    setAudioEnabled(false);
                    setMessages(prev => [...prev, {
                        user: 'SYSTEM',
                        text: 'Faculty has muted all participants.',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        system: true
                    }]);
                }
            });

            s.on('admin-mute-user', () => {
                if (streamRef.current) {
                    streamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
                    setAudioEnabled(false);
                    alert('You have been muted by the Host.');
                }
            });

            s.on('admin-toggle-chat', (disabled: boolean) => {
                setChatDisabled(disabled);
                setMessages(prev => [...prev, {
                    user: 'SYSTEM',
                    text: disabled ? 'Host has disabled student chat.' : 'Host has enabled student chat.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    system: true
                }]);
            });

            s.on('admin-kick-user', () => {
                alert('You have been removed from this class by the Host.');
                window.location.reload();
            });

            s.on('screen-share-state', ({ isSharing, userName: presenterName }) => {
                if (isSharing) {
                    setActivePresenter(presenterName);
                    setShowWhiteboard(false);
                } else {
                    setActivePresenter(null);
                }
            });

            s.on('whiteboard-state', (isOpen: boolean) => {
                setShowWhiteboard(isOpen);
            });

            s.on('draw', ({ x0, y0, x1, y1, color, clear }) => {
                setShowWhiteboard(true);
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (!ctx || !canvas) return;
                
                if (clear) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    return;
                }

                ctx.beginPath();
                ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
                ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
                ctx.strokeStyle = color || '#3b82f6';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.closePath();
            });
        };

        const createPeerConnection = (targetId: string, s: Socket, mediaStream: MediaStream | null, isInitiator: boolean) => {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peersRef.current[targetId] = pc;

            if (mediaStream) {
                mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    s.emit('ice-candidate', { target: targetId, caller: s.id, candidate: event.candidate });
                }
            };

            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                setPeers(prev => ({
                    ...prev,
                    [targetId]: { ...prev[targetId], stream: remoteStream }
                }));
            };

            if (isInitiator) {
                pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                    .then(offer => {
                        pc.setLocalDescription(offer);
                        s.emit('offer', { target: targetId, caller: s.id, sdp: offer });
                    })
                    .catch(e => console.error('Error creating offer:', e));
            }
        };

        initMediaAndSocket();

        return () => {
            localStream?.getTracks().forEach(t => t.stop());
            screenStream?.getTracks().forEach(t => t.stop());
            Object.values(peersRef.current).forEach(pc => pc.close());
            socket?.disconnect();
        };
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setElapsedTime(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                const nextState = !audioTrack.enabled;
                stream.getAudioTracks().forEach(t => (t.enabled = nextState));
                setAudioEnabled(nextState);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const nextState = !videoTrack.enabled;
                stream.getVideoTracks().forEach(t => (t.enabled = nextState));
                setVideoEnabled(nextState);
            }
        }
    };

    // Screen Share Handler (Audio + Video)
    const toggleScreenShare = async () => {
        if (screenSharing) {
            screenStream?.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            setScreenSharing(false);
            socket?.emit('screen-share-state', { roomName, isSharing: false, userName });

            // Switch peer video back to camera
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                Object.values(peersRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && videoTrack) sender.replaceTrack(videoTrack);
                });
            }
        } else {
            try {
                const ss = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true // Transfers system/tab audio
                });
                setScreenStream(ss);
                setScreenSharing(true);
                setShowWhiteboard(false);
                socket?.emit('screen-share-state', { roomName, isSharing: true, userName });

                const screenTrack = ss.getVideoTracks()[0];
                Object.values(peersRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && screenTrack) sender.replaceTrack(screenTrack);
                });

                screenTrack.onended = () => {
                    setScreenStream(null);
                    setScreenSharing(false);
                    socket?.emit('screen-share-state', { roomName, isSharing: false, userName });
                    if (stream) {
                        const videoTrack = stream.getVideoTracks()[0];
                        Object.values(peersRef.current).forEach(pc => {
                            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                            if (sender && videoTrack) sender.replaceTrack(videoTrack);
                        });
                    }
                };
            } catch (err) {
                console.warn('Screen share cancelled or failed:', err);
            }
        }
    };

    // Recording Classroom Handler (Host or Admin)
    const toggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                // Combine audio and screen / camera stream
                const recordStream = screenStream || stream;
                if (!recordStream) {
                    alert('No video/audio stream available to record.');
                    return;
                }

                recordedChunksRef.current = [];
                const options = { mimeType: 'video/webm;codecs=vp9,opus' };
                let recorder: MediaRecorder;
                
                try {
                    recorder = new MediaRecorder(recordStream, options);
                } catch (e) {
                    recorder = new MediaRecorder(recordStream);
                }

                recorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `VConnect-Class-${roomName}-${new Date().toISOString().slice(0, 10)}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 100);
                };

                recorder.start(1000);
                mediaRecorderRef.current = recorder;
                setIsRecording(true);
            } catch (err) {
                console.error('Recording failed to start:', err);
                alert('Could not start recording. Check browser permissions.');
            }
        }
    };

    // Admin Host Controls
    const muteAllStudents = () => {
        if (!isHost || !socket) return;
        socket.emit('admin-mute-all', { roomName });
    };

    const muteSingleStudent = (targetId: string) => {
        if (!isHost || !socket) return;
        socket.emit('admin-mute-user', { roomName, targetId });
    };

    const kickStudent = (targetId: string) => {
        if (!isHost || !socket) return;
        if (confirm('Are you sure you want to remove this participant?')) {
            socket.emit('admin-kick-user', { roomName, targetId });
        }
    };

    const toggleStudentChat = () => {
        if (!isHost || !socket) return;
        const nextState = !chatDisabled;
        setChatDisabled(nextState);
        socket.emit('admin-toggle-chat', { roomName, disabled: nextState });
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) containerRef.current?.requestFullscreen?.();
        else document.exitFullscreen?.();
        setIsFullscreen(!isFullscreen);
    };

    const sendMessage = () => {
        if (!msgInput.trim() || !socket || (chatDisabled && !isHost)) return;
        const msg = {
            roomName,
            user: userName,
            text: msgInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        socket.emit('chat', msg);
        setMessages(prev => [...prev, msg]);
        setMsgInput('');
    };

    // Whiteboard Canvas Drawing
    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    };

    const onDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isHost && !showWhiteboard) return;
        isDrawing.current = true;
        lastPos.current = getPos(e);
    };

    const onDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current || (!isHost && !showWhiteboard)) return;
        
        const pos = getPos(e);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x * canvas.width, lastPos.current.y * canvas.height);
        ctx.lineTo(pos.x * canvas.width, pos.y * canvas.height);
        ctx.strokeStyle = whiteboardColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();

        socket?.emit('draw', {
            roomName,
            x0: lastPos.current.x, y0: lastPos.current.y,
            x1: pos.x, y1: pos.y,
            color: whiteboardColor
        });

        lastPos.current = pos;
    };

    const onDrawEnd = () => isDrawing.current = false;
    
    const clearWhiteboard = () => {
        if (!isHost) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket?.emit('draw', { roomName, clear: true });
    };

    const activeParticipants = Object.entries(peers);

    return (
        <div ref={containerRef} className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-gray-950 relative select-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/90 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-sm font-semibold tracking-wide">V-Connect Classroom</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">LIVE</Badge>
                    {isRecording && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] animate-pulse flex items-center gap-1">
                            <CircleDot className="w-3 h-3 text-red-500" /> REC
                        </Badge>
                    )}
                    {activePresenter && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                            🖥️ {activePresenter} is presenting
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs font-mono">{formatTime(elapsedTime)}</span>
                    <span className="text-gray-500 text-xs truncate max-w-[140px]">Room: {roomName}</span>
                </div>
            </div>

            {/* Main Stage (Video / Screen / Whiteboard) */}
            <div className="relative flex" style={{ minHeight: '520px', height: 'calc(100vh - 280px)' }}>
                <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                    {showWhiteboard ? (
                        /* Interactive Whiteboard */
                        <div className="absolute inset-0 bg-white flex items-center justify-center p-3">
                            <div className="relative w-full h-full border-2 border-gray-200 rounded-xl bg-white shadow-inner overflow-hidden cursor-crosshair">
                                <canvas
                                    ref={canvasRef}
                                    width={1400}
                                    height={900}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onMouseDown={onDrawStart}
                                    onMouseMove={onDrawMove}
                                    onMouseUp={onDrawEnd}
                                    onMouseLeave={onDrawEnd}
                                    onTouchStart={onDrawStart}
                                    onTouchMove={onDrawMove}
                                    onTouchEnd={onDrawEnd}
                                />
                                {isHost ? (
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-lg p-2 rounded-xl border flex items-center gap-2">
                                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 text-xs">
                                            🎨 Whiteboard (Broadcasted to All)
                                        </Badge>
                                        <div className="flex gap-1.5 border-l pl-2">
                                            {['#3b82f6', '#ef4444', '#10b981', '#000000'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setWhiteboardColor(c)}
                                                    className={`w-5 h-5 rounded-full border-2 ${whiteboardColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <Button size="sm" variant="destructive" onClick={clearWhiteboard} className="h-6 text-[10px] ml-2">
                                            <Trash2 className="w-3 h-3 mr-1" /> Clear
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur">
                                        Teacher Whiteboard
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : screenSharing ? (
                        /* Local Screen Share View */
                        <div className="absolute inset-0 bg-black flex flex-col p-2">
                            <video
                                ref={(el) => { if (el && screenStream) el.srcObject = screenStream; }}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        /* Video Mesh Grid */
                        <div className={`w-full h-full p-2 grid gap-2.5 ${activeParticipants.length === 0 ? 'grid-cols-1' : activeParticipants.length === 1 ? 'grid-cols-2' : activeParticipants.length <= 3 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3'}`}>
                            {/* MY VIDEO */}
                            <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800 shadow-md">
                                {videoEnabled ? (
                                    <video
                                        ref={myVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-950">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-gray-400 text-xs mt-3">Camera is Off</p>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur flex items-center gap-1.5">
                                    <span>{userName} (You)</span>
                                    {isHost && <Badge className="text-[9px] h-4 px-1 py-0 bg-blue-500/40 text-blue-200">Host</Badge>}
                                </div>
                                {!audioEnabled && (
                                    <div className="absolute top-2 right-2 bg-red-600/90 p-1.5 rounded-full shadow">
                                        <MicOff className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>
                            
                            {/* PARTICIPANT VIDEOS & AUDIO */}
                            {activeParticipants.map(([peerId, p]) => (
                                <div key={peerId} className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800 shadow-md">
                                    {p.stream ? (
                                        <video 
                                            autoPlay 
                                            playsInline 
                                            className="w-full h-full object-cover" 
                                            ref={(vid) => {
                                                if (vid && p.stream) {
                                                    vid.srcObject = p.stream;
                                                }
                                            }} 
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full bg-gray-900">
                                            <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 text-xl font-bold">
                                                {p.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="text-gray-500 text-[11px] mt-2">Connecting audio & video...</p>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur flex items-center gap-2">
                                        <span>{p.userName}</span>
                                        {p.isHost && <Badge className="text-[9px] h-4 px-1 py-0 bg-blue-500/40 text-blue-200">Host</Badge>}
                                    </div>
                                    {isHost && (
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button
                                                onClick={() => muteSingleStudent(peerId)}
                                                className="bg-black/60 hover:bg-red-600 text-white p-1 rounded-lg transition"
                                                title="Mute student"
                                            >
                                                <VolumeX className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Picture-in-Picture Preview during Whiteboard / Presentation */}
                {(screenSharing || showWhiteboard) && (
                    <div className="absolute bottom-4 right-4 w-52 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 z-10">
                        {videoEnabled ? (
                            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-800"><CameraOff className="w-8 h-8 text-gray-500" /></div>
                        )}
                        <div className="absolute bottom-1 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">{userName}</div>
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900/95 border-t border-gray-800">
                {/* Audio Toggle */}
                <Button
                    size="sm"
                    onClick={toggleAudio}
                    className={`rounded-full w-11 h-11 transition-all ${audioEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                    title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                {/* Video Toggle */}
                <Button
                    size="sm"
                    onClick={toggleVideo}
                    className={`rounded-full w-11 h-11 transition-all ${videoEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                    title={videoEnabled ? 'Stop Video' : 'Start Video'}
                >
                    {videoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </Button>

                {/* Screen Share (Host or Student) */}
                <Button
                    size="sm"
                    onClick={toggleScreenShare}
                    className={`rounded-full w-11 h-11 transition-all ${screenSharing ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    title={screenSharing ? 'Stop Screen Share' : 'Share Screen + Audio'}
                >
                    {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </Button>

                {/* Whiteboard (Host only) */}
                {isHost && (
                    <Button
                        size="sm"
                        onClick={() => { 
                            const newState = !showWhiteboard;
                            if (newState) setScreenSharing(false);
                            setShowWhiteboard(newState); 
                            socket?.emit('whiteboard-state', { roomName, isOpen: newState });
                        }}
                        className={`rounded-full w-11 h-11 transition-all ${showWhiteboard ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        title="Toggle Interactive Whiteboard"
                    >
                        <PenTool className="w-5 h-5" />
                    </Button>
                )}

                {/* Class Recording Button */}
                {isHost && (
                    <Button
                        size="sm"
                        onClick={toggleRecording}
                        className={`rounded-full w-11 h-11 transition-all ${isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        title={isRecording ? 'Stop Recording & Download' : 'Record Class'}
                    >
                        <CircleDot className="w-5 h-5" />
                    </Button>
                )}

                <div className="w-px h-8 bg-gray-800 mx-2" />

                {/* Chat Panel Toggle */}
                <Button
                    size="sm"
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    className={`rounded-full w-11 h-11 transition-all ${showChat ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    title="Classroom Chat"
                >
                    <MessageCircle className="w-5 h-5" />
                </Button>

                {/* Participants Panel Toggle */}
                <Button
                    size="sm"
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    className={`rounded-full w-11 h-11 transition-all ${showParticipants ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    title="Participants & Moderation"
                >
                    <Users className="w-5 h-5" />
                </Button>

                {/* Fullscreen Toggle */}
                <Button
                    size="sm"
                    onClick={toggleFullscreen}
                    className="rounded-full w-11 h-11 bg-gray-800 hover:bg-gray-700 text-white"
                    title="Toggle Fullscreen"
                >
                    <Maximize2 className="w-5 h-5" />
                </Button>
            </div>

            {/* Chat Drawer */}
            {showChat && (
                <div className="absolute top-12 right-0 bottom-16 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Class Chat</span>
                        <div className="flex items-center gap-1">
                            {isHost && (
                                <button
                                    onClick={toggleStudentChat}
                                    className={`p-1 rounded text-xs ${chatDisabled ? 'text-red-400 bg-red-950/40' : 'text-gray-400 hover:text-white'}`}
                                    title={chatDisabled ? 'Enable Chat' : 'Disable Chat for Students'}
                                >
                                    <MessageSquareOff className="w-4 h-4" />
                                </button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setShowChat(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {messages.length === 0 && <p className="text-gray-500 text-xs text-center mt-8">No messages yet. Say hi to your class!</p>}
                        {messages.map((m, i) => (
                            <div key={i} className={`rounded-lg px-3 py-2 ${m.system ? 'bg-amber-950/40 border border-amber-800/40' : 'bg-gray-800/60'}`}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-xs font-semibold ${m.system ? 'text-amber-400' : 'text-blue-400'}`}>{m.user}</span>
                                    <span className="text-gray-500 text-[10px]">{m.time}</span>
                                </div>
                                <p className={`text-xs ${m.system ? 'text-amber-200 font-medium' : 'text-gray-300'}`}>{m.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-800 flex gap-2">
                        <input
                            disabled={chatDisabled && !isHost}
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder={chatDisabled && !isHost ? 'Chat is disabled by host' : 'Type message...'}
                            className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none border focus:border-blue-500 border-gray-700 disabled:opacity-50"
                        />
                        <Button
                            size="sm"
                            disabled={chatDisabled && !isHost}
                            onClick={sendMessage}
                            className="bg-blue-600 hover:bg-blue-500 h-8 w-8 p-0 shrink-0"
                        >
                            <Send className="w-3.5 h-3.5 text-white" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Participants & Admin Moderation Panel */}
            {showParticipants && (
                <div className="absolute top-12 right-0 bottom-16 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Participants ({Object.keys(peers).length + 1})</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setShowParticipants(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Host Global Actions */}
                    {isHost && (
                        <div className="p-2.5 border-b border-gray-800 bg-gray-950/60 flex gap-2">
                            <Button size="sm" variant="destructive" onClick={muteAllStudents} className="flex-1 h-7 text-xs gap-1.5">
                                <VolumeX className="w-3.5 h-3.5" /> Mute All
                            </Button>
                            <Button
                                size="sm"
                                variant={chatDisabled ? 'default' : 'outline'}
                                onClick={toggleStudentChat}
                                className="h-7 text-xs gap-1"
                            >
                                <MessageSquareOff className="w-3.5 h-3.5" /> {chatDisabled ? 'Enable Chat' : 'Lock Chat'}
                            </Button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {/* Current User */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-900/30 border border-blue-800/40">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white text-xs font-medium">{userName} (You)</p>
                                    <p className="text-blue-400 text-[10px]">{isHost ? 'Host / Teacher' : 'Student'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Remote Peers */}
                        {activeParticipants.map(([peerId, p]) => (
                            <div key={peerId} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                                        {p.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-medium">{p.userName}</p>
                                        <p className="text-gray-400 text-[10px]">{p.isHost ? 'Host' : 'Student'}</p>
                                    </div>
                                </div>
                                {isHost && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => muteSingleStudent(peerId)}
                                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-amber-400 transition"
                                            title="Mute student"
                                        >
                                            <MicOff className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => kickStudent(peerId)}
                                            className="p-1.5 rounded-lg hover:bg-red-950 text-gray-400 hover:text-red-400 transition"
                                            title="Remove student from class"
                                        >
                                            <Ban className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
