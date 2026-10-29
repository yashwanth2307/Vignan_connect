'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
    MessageCircle, Users, Send, Maximize2, X, PenTool, VolumeX,
    CircleDot, Ban, MessageSquareOff, Trash2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Props {
    roomName: string;
    userName: string;
    isHost?: boolean | null;
}

// STUN servers for NAT Traversal
const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
    ]
};

// Hardcoded live Render backend to eliminate any Vercel env-var missing issues
const WS_SERVER = 'https://vignan-connect.onrender.com';

// Subcomponent to reliably attach stream to HTML5 video element with audio playback
function RemoteParticipantTile({
    peerId,
    participant,
    stream,
    isHost,
    onMute,
    onKick
}: {
    peerId: string;
    participant: { userName: string; isHost: boolean };
    stream?: MediaStream;
    isHost: boolean;
    onMute: (id: string) => void;
    onKick: (id: string) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (el && stream) {
            el.srcObject = stream;
            // Explicitly play to avoid autoplay restrictions on audio
            el.play().catch(e => console.warn('Autoplay prevented on peer video:', e));
        }
    }, [stream]);

    return (
        <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800 shadow-md">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-900">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 text-xl font-bold">
                        {participant.userName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Connecting audio & video...</p>
                </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur flex items-center gap-2">
                <span>{participant.userName}</span>
                {participant.isHost && <Badge className="text-[9px] h-4 px-1 py-0 bg-blue-500/40 text-blue-200">Host</Badge>}
            </div>
            {isHost && (
                <div className="absolute top-2 right-2 flex gap-1">
                    <button
                        onClick={() => onMute(peerId)}
                        className="bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-lg transition"
                        title="Mute student"
                    >
                        <MicOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onKick(peerId)}
                        className="bg-black/60 hover:bg-red-700 text-white p-1.5 rounded-lg transition"
                        title="Remove student"
                    >
                        <Ban className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

export function VConnectClassroom({ roomName, userName, isHost = false }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Socket & Streams
    const socketRef = useRef<Socket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    // RTCPeerConnections dictionary: socketId -> RTCPeerConnection
    const pcsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});

    // UI state
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [activePresenter, setActivePresenter] = useState<string | null>(null);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [whiteboardColor, setWhiteboardColor] = useState('#2563eb');
    const [showChat, setShowChat] = useState(false);
    const [chatDisabled, setChatDisabled] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [messages, setMessages] = useState<{ user: string; text: string; time: string; system?: boolean }[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Participants state: socketId -> { userName, isHost, stream }
    const [participants, setParticipants] = useState<{ [id: string]: { userName: string; isHost: boolean; stream?: MediaStream } }>({});

    // Recording
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Drawing state
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Classroom timer
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

    // Helper to start local camera/mic
    const initLocalMedia = async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            localStreamRef.current = stream;
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.warn('Could not get video+audio, trying audio only:', err);
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = audioStream;
                setVideoEnabled(false);
                return audioStream;
            } catch (audioErr) {
                console.error('No microphone or camera permission:', audioErr);
                return null;
            }
        }
    };

    // Main WebRTC & Socket Lifecycle
    useEffect(() => {
        let isMounted = true;

        const startClassroom = async () => {
            const localStream = await initLocalMedia();

            // Connect to Render Socket.io Gateway
            const socket = io(`${WS_SERVER}/classroom`, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 50,
                reconnectionDelay: 1000
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                if (!isMounted) return;
                setConnectionStatus('connected');
                socket.emit('join-room', { roomName, userName, isHost });
            });

            socket.on('disconnect', () => {
                if (isMounted) setConnectionStatus('disconnected');
            });

            // Handle existing participants in the room
            socket.on('room-users', (users: any[]) => {
                if (!isMounted) return;
                const initialMap: any = {};
                users.forEach(u => {
                    initialMap[u.id] = { userName: u.userName, isHost: u.isHost };
                    createPeerConnection(u.id, true, socket, localStreamRef.current);
                });
                setParticipants(prev => ({ ...prev, ...initialMap }));
            });

            // Handle newly joined participant
            socket.on('user-joined', (u: any) => {
                if (!isMounted) return;
                setParticipants(prev => ({
                    ...prev,
                    [u.id]: { userName: u.userName, isHost: u.isHost }
                }));
                createPeerConnection(u.id, false, socket, localStreamRef.current);
            });

            // WebRTC Offer
            socket.on('offer', async ({ caller, sdp }) => {
                let pc = pcsRef.current[caller];
                if (!pc) {
                    pc = createPeerConnection(caller, false, socket, localStreamRef.current);
                }
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('answer', { target: caller, caller: socket.id, sdp: answer });
                } catch (e) {
                    console.error('Error handling WebRTC offer:', e);
                }
            });

            // WebRTC Answer
            socket.on('answer', async ({ caller, sdp }) => {
                const pc = pcsRef.current[caller];
                if (pc) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    } catch (e) {
                        console.error('Error handling WebRTC answer:', e);
                    }
                }
            });

            // WebRTC ICE Candidate
            socket.on('ice-candidate', async ({ caller, candidate }) => {
                const pc = pcsRef.current[caller];
                if (pc && candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('Error adding ICE candidate:', e);
                    }
                }
            });

            // Participant Left
            socket.on('user-left', ({ userId }) => {
                if (pcsRef.current[userId]) {
                    pcsRef.current[userId].close();
                    delete pcsRef.current[userId];
                }
                setParticipants(prev => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });
            });

            // Text Chat
            socket.on('chat', (m: any) => setMessages(prev => [...prev, m]));

            // Admin Controls
            socket.on('admin-mute-all', () => {
                if (!isHost && localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
                    setAudioEnabled(false);
                    setMessages(prev => [...prev, {
                        user: 'SYSTEM',
                        text: 'Faculty has muted all participants.',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        system: true
                    }]);
                }
            });

            socket.on('admin-mute-user', () => {
                if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
                    setAudioEnabled(false);
                    alert('You have been muted by the Host.');
                }
            });

            socket.on('admin-toggle-chat', (disabled: boolean) => {
                setChatDisabled(disabled);
            });

            socket.on('admin-kick-user', () => {
                alert('You have been removed from this class by the Host.');
                window.location.reload();
            });

            socket.on('screen-share-state', ({ isSharing, userName: presenterName }) => {
                if (isSharing) {
                    setActivePresenter(presenterName);
                    setShowWhiteboard(false);
                } else {
                    setActivePresenter(null);
                }
            });

            // Whiteboard Sync
            socket.on('whiteboard-state', (isOpen: boolean) => {
                setShowWhiteboard(isOpen);
            });

            socket.on('draw', ({ x0, y0, x1, y1, color, clear }) => {
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
                ctx.strokeStyle = color || '#2563eb';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.closePath();
            });
        };

        const createPeerConnection = (targetId: string, isInitiator: boolean, s: Socket, mediaStream: MediaStream | null): RTCPeerConnection => {
            const pc = new RTCPeerConnection(RTC_CONFIG);
            pcsRef.current[targetId] = pc;

            // Add local audio and video tracks
            const activeStream = screenStreamRef.current || mediaStream;
            if (activeStream) {
                activeStream.getTracks().forEach(track => {
                    pc.addTrack(track, activeStream);
                });
            }

            // Send ICE candidates to peer through Render socket gateway
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    s.emit('ice-candidate', {
                        target: targetId,
                        caller: s.id,
                        candidate: event.candidate
                    });
                }
            };

            // Receive remote audio/video tracks
            pc.ontrack = (event) => {
                const stream = event.streams[0];
                if (stream) {
                    setParticipants(prev => ({
                        ...prev,
                        [targetId]: { ...prev[targetId], stream }
                    }));
                }
            };

            // If caller, create offer and send to peer
            if (isInitiator) {
                pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                    .then(async (offer) => {
                        await pc.setLocalDescription(offer);
                        s.emit('offer', { target: targetId, caller: s.id, sdp: offer });
                    })
                    .catch(err => console.error('Failed to create offer:', err));
            }

            return pc;
        };

        startClassroom();

        return () => {
            isMounted = false;
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            Object.values(pcsRef.current).forEach(pc => pc.close());
            socketRef.current?.disconnect();
        };
    }, [roomName, userName, isHost]);

    // Mic Toggle
    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const nextState = !audioTrack.enabled;
                localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = nextState));
                setAudioEnabled(nextState);
            }
        }
    };

    // Camera Toggle
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                const nextState = !videoTrack.enabled;
                localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = nextState));
                setVideoEnabled(nextState);
            }
        }
    };

    // Screen Sharing
    const toggleScreenShare = async () => {
        if (screenSharing) {
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
            setScreenSharing(false);
            socketRef.current?.emit('screen-share-state', { roomName, isSharing: false, userName });

            if (localStreamRef.current) {
                const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
                if (camVideoTrack) {
                    Object.values(pcsRef.current).forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(camVideoTrack);
                    });
                }
            }
        } else {
            try {
                const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                screenStreamRef.current = ss;
                setScreenSharing(true);
                setShowWhiteboard(false);
                socketRef.current?.emit('screen-share-state', { roomName, isSharing: true, userName });

                const screenTrack = ss.getVideoTracks()[0];
                Object.values(pcsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && screenTrack) sender.replaceTrack(screenTrack);
                });

                screenTrack.onended = () => {
                    screenStreamRef.current = null;
                    setScreenSharing(false);
                    socketRef.current?.emit('screen-share-state', { roomName, isSharing: false, userName });
                    if (localStreamRef.current) {
                        const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
                        if (camVideoTrack) {
                            Object.values(pcsRef.current).forEach(pc => {
                                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                                if (sender) sender.replaceTrack(camVideoTrack);
                            });
                        }
                    }
                };
            } catch (err) {
                console.warn('Screen share cancelled:', err);
            }
        }
    };

    // Lecture Recording
    const toggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            const streamToRecord = screenStreamRef.current || localStreamRef.current;
            if (!streamToRecord) {
                alert('No active audio or video stream available to record.');
                return;
            }

            try {
                recordedChunksRef.current = [];
                const recorder = new MediaRecorder(streamToRecord);
                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
                };
                recorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `VConnect-Lecture-${roomName}-${new Date().toISOString().slice(0, 10)}.webm`;
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
                console.error('Recording initialization error:', err);
            }
        }
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

        socketRef.current?.emit('draw', {
            roomName,
            x0: lastPos.current.x,
            y0: lastPos.current.y,
            x1: pos.x,
            y1: pos.y,
            color: whiteboardColor
        });

        lastPos.current = pos;
    };

    const onDrawEnd = () => (isDrawing.current = false);

    const clearWhiteboard = () => {
        if (!isHost) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        socketRef.current?.emit('draw', { roomName, clear: true });
    };

    // Admin Controls
    const muteAllStudents = () => {
        if (!isHost || !socketRef.current) return;
        socketRef.current.emit('admin-mute-all', { roomName });
    };

    const muteSingleStudent = (targetId: string) => {
        if (!isHost || !socketRef.current) return;
        socketRef.current.emit('admin-mute-user', { roomName, targetId });
    };

    const kickStudent = (targetId: string) => {
        if (!isHost || !socketRef.current) return;
        if (confirm('Are you sure you want to remove this participant?')) {
            socketRef.current.emit('admin-kick-user', { roomName, targetId });
        }
    };

    const toggleStudentChat = () => {
        if (!isHost || !socketRef.current) return;
        const next = !chatDisabled;
        setChatDisabled(next);
        socketRef.current.emit('admin-toggle-chat', { roomName, disabled: next });
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) containerRef.current?.requestFullscreen?.();
        else document.exitFullscreen?.();
        setIsFullscreen(!isFullscreen);
    };

    const sendMessage = () => {
        if (!msgInput.trim() || !socketRef.current || (chatDisabled && !isHost)) return;
        const msg = {
            roomName,
            user: userName,
            text: msgInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        socketRef.current.emit('chat', msg);
        setMessages(prev => [...prev, msg]);
        setMsgInput('');
    };

    const participantList = Object.entries(participants);

    return (
        <div ref={containerRef} className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-gray-950 relative select-none shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
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
                    <span className="text-gray-400 text-xs truncate max-w-[150px]">Room: {roomName}</span>
                </div>
            </div>

            {/* Video Mesh Stage */}
            <div className="relative flex-1 w-full" style={{ minHeight: '520px', height: 'calc(100vh - 270px)' }}>
                {showWhiteboard ? (
                    /* Interactive Canvas Broadcast */
                    <div className="absolute inset-0 bg-white flex flex-col p-3 z-10">
                        <div className="flex items-center justify-between pb-2 border-b mb-2">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Shared Whiteboard</Badge>
                                {isHost && (
                                    <div className="flex gap-1.5 pl-2">
                                        {['#2563eb', '#dc2626', '#16a34a', '#000000'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setWhiteboardColor(c)}
                                                className={`w-5 h-5 rounded-full border-2 ${whiteboardColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isHost && (
                                    <Button size="sm" variant="destructive" onClick={clearWhiteboard} className="h-7 text-xs">
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => setShowWhiteboard(false)} className="h-7 text-xs">
                                    Close Whiteboard
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 w-full h-full relative border border-gray-200 rounded-xl overflow-hidden cursor-crosshair">
                            <canvas
                                ref={canvasRef}
                                width={1400}
                                height={800}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onMouseDown={onDrawStart}
                                onMouseMove={onDrawMove}
                                onMouseUp={onDrawEnd}
                                onMouseLeave={onDrawEnd}
                                onTouchStart={onDrawStart}
                                onTouchMove={onDrawMove}
                                onTouchEnd={onDrawEnd}
                            />
                        </div>
                    </div>
                ) : screenSharing ? (
                    /* Local Screen Sharing Display */
                    <div className="w-full h-full bg-black flex items-center justify-center p-2">
                        <video
                            autoPlay
                            playsInline
                            muted
                            ref={el => { if (el && screenStreamRef.current) el.srcObject = screenStreamRef.current; }}
                            className="w-full h-full object-contain"
                        />
                    </div>
                ) : (
                    /* Participant Video Grid */
                    <div className={`w-full h-full p-2.5 grid gap-2.5 ${participantList.length === 0 ? 'grid-cols-1' : participantList.length === 1 ? 'grid-cols-2' : participantList.length <= 3 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3'}`}>
                        {/* Self Camera */}
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
                                <div className="flex flex-col items-center justify-center h-full bg-gray-900">
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

                        {/* Remote Peer Feeds */}
                        {participantList.map(([peerId, p]) => (
                            <RemoteParticipantTile
                                key={peerId}
                                peerId={peerId}
                                participant={p}
                                stream={p.stream}
                                isHost={isHost}
                                onMute={muteSingleStudent}
                                onKick={kickStudent}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border-t border-gray-800">
                <Button
                    size="sm"
                    onClick={toggleAudio}
                    className={`rounded-full w-11 h-11 transition-all ${audioEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                    title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                <Button
                    size="sm"
                    onClick={toggleVideo}
                    className={`rounded-full w-11 h-11 transition-all ${videoEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                    title={videoEnabled ? 'Stop Camera' : 'Start Camera'}
                >
                    {videoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </Button>

                <Button
                    size="sm"
                    onClick={toggleScreenShare}
                    className={`rounded-full w-11 h-11 transition-all ${screenSharing ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                    {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </Button>

                {isHost && (
                    <Button
                        size="sm"
                        onClick={() => {
                            const next = !showWhiteboard;
                            setShowWhiteboard(next);
                            socketRef.current?.emit('whiteboard-state', { roomName, isOpen: next });
                        }}
                        className={`rounded-full w-11 h-11 transition-all ${showWhiteboard ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        title="Whiteboard"
                    >
                        <PenTool className="w-5 h-5" />
                    </Button>
                )}

                {isHost && (
                    <Button
                        size="sm"
                        onClick={toggleRecording}
                        className={`rounded-full w-11 h-11 transition-all ${isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        title={isRecording ? 'Stop Recording' : 'Record Class'}
                    >
                        <CircleDot className="w-5 h-5" />
                    </Button>
                )}

                <div className="w-px h-8 bg-gray-800 mx-1" />

                <Button
                    size="sm"
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    className={`rounded-full w-11 h-11 transition-all ${showChat ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    title="Chat"
                >
                    <MessageCircle className="w-5 h-5" />
                </Button>

                <Button
                    size="sm"
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    className={`rounded-full w-11 h-11 transition-all ${showParticipants ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    title="Participants"
                >
                    <Users className="w-5 h-5" />
                </Button>

                <Button
                    size="sm"
                    onClick={toggleFullscreen}
                    className="rounded-full w-11 h-11 bg-gray-800 hover:bg-gray-700 text-white"
                    title="Fullscreen"
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
                        {messages.length === 0 && <p className="text-gray-500 text-xs text-center mt-8">No messages yet. Say hi!</p>}
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

            {/* Participants & Moderation Drawer */}
            {showParticipants && (
                <div className="absolute top-12 right-0 bottom-16 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Participants ({participantList.length + 1})</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setShowParticipants(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

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
                                    <p className="text-blue-400 text-[10px]">{isHost ? 'Host' : 'Student'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Remote Participants */}
                        {participantList.map(([peerId, p]) => (
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
                                            title="Remove student"
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
