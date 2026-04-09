'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
    MessageCircle, Users, Send, Maximize2, Hand, X, PenTool, VolumeX
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';

interface Props {
    roomName: string;
    userName: string;
    isHost?: boolean | null;
}

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function VConnectClassroom({ roomName, userName, isHost = false }: Props) {
    const { user } = useAuth();
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    
    // Participants and their streams
    const [peers, setPeers] = useState<{ [id: string]: { userName: string, isHost: boolean, stream?: MediaStream } }>({});
    const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
    
    // UI state
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Drawing state
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

    // Initialize Camera and Socket
    useEffect(() => {
        let localStream: MediaStream;
        const initCamera = async () => {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                    audio: true,
                });
                setStream(localStream);
                if (myVideoRef.current) myVideoRef.current.srcObject = localStream;
                initSocket(localStream);
            } catch (err) {
                console.error('Camera access denied:', err);
                initSocket(null);
            }
        };

        const initSocket = (mediaStream: MediaStream | null) => {
            const s = io(`${SERVER_URL}/classroom`, { transports: ['websocket'] });
            setSocket(s);

            s.on('connect', () => {
                s.emit('join-room', { roomName, userName, isHost });
            });

            s.on('room-users', (users: any[]) => {
                const initPeers: any = {};
                users.forEach(u => {
                    initPeers[u.id] = { userName: u.userName, isHost: u.isHost };
                    createPeerConnection(u.id, s, mediaStream, true); // Create offer
                });
                setPeers(prev => ({ ...prev, ...initPeers }));
            });

            s.on('user-joined', (u: any) => {
                setPeers(prev => ({ ...prev, [u.id]: { userName: u.userName, isHost: u.isHost } }));
                createPeerConnection(u.id, s, mediaStream, false); // Wait for offer
            });

            s.on('offer', async ({ caller, sdp }) => {
                const pc = peersRef.current[caller];
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
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){}
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

            s.on('whiteboard-state', (isOpen: boolean) => {
                setShowWhiteboard(isOpen);
            });

            s.on('draw', ({ x0, y0, x1, y1, color, clear }) => {
                setShowWhiteboard(true); // Auto-open whiteboard for students when host draws
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
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.closePath();
            });
        };

        const createPeerConnection = (targetId: string, s: Socket, mediaStream: MediaStream | null, isInitiator: boolean) => {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
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
                setPeers(prev => ({
                    ...prev,
                    [targetId]: { ...prev[targetId], stream: event.streams[0] }
                }));
            };

            if (isInitiator) {
                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    s.emit('offer', { target: targetId, caller: s.id, sdp: offer });
                });
            }
        };

        initCamera();

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
            const enabled = stream.getAudioTracks()[0]?.enabled;
            stream.getAudioTracks().forEach(t => (t.enabled = !enabled));
            setAudioEnabled(!enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const enabled = stream.getVideoTracks()[0]?.enabled;
            stream.getVideoTracks().forEach(t => (t.enabled = !enabled));
            setVideoEnabled(!enabled);
        }
    };

    const toggleScreenShare = async () => {
        if (screenSharing) {
            screenStream?.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            setScreenSharing(false);
            
            // Revert to camera
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                Object.values(peersRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && videoTrack) sender.replaceTrack(videoTrack);
                });
            }
        } else {
            try {
                const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setScreenStream(ss);
                setScreenSharing(true);
                
                const screenTrack = ss.getVideoTracks()[0];
                Object.values(peersRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && screenTrack) sender.replaceTrack(screenTrack);
                });

                if (screenRef.current) screenRef.current.srcObject = ss;
                
                screenTrack.onended = () => {
                    setScreenStream(null);
                    setScreenSharing(false);
                    if (stream) {
                        const videoTrack = stream.getVideoTracks()[0];
                        Object.values(peersRef.current).forEach(pc => {
                            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                            if (sender && videoTrack) sender.replaceTrack(videoTrack);
                        });
                    }
                };
            } catch { /* user cancelled */ }
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) containerRef.current?.requestFullscreen?.();
        else document.exitFullscreen?.();
        setIsFullscreen(!isFullscreen);
    };

    const sendMessage = () => {
        if (!msgInput.trim() || !socket) return;
        const msg = { roomName, user: userName, text: msgInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        socket.emit('chat', msg);
        setMessages(prev => [...prev, msg]);
        setMsgInput('');
    };

    // Drawing handlers
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
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();

        socket?.emit('draw', {
            roomName,
            x0: lastPos.current.x, y0: lastPos.current.y,
            x1: pos.x, y1: pos.y,
            color: '#3b82f6'
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

    const activeParticipants = Object.values(peers).filter(p => p.stream);

    return (
        <div ref={containerRef} className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-gray-950 relative">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-sm font-semibold">V-Connect Classroom</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">LIVE</Badge>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs font-mono">{formatTime(elapsedTime)}</span>
                    <span className="text-gray-500 text-xs truncate max-w-[150px]">Room: {roomName}</span>
                </div>
            </div>

            {/* Video & Whiteboard area */}
            <div className="relative flex" style={{ minHeight: '500px', height: 'calc(100vh - 280px)' }}>
                {/* Main Content Area */}
                <div className="flex-1 bg-black flex flex-col relative">
                    {showWhiteboard ? (
                        <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
                            <div className="relative w-full h-full border-2 border-gray-200 rounded-xl bg-white shadow-inner overflow-hidden cursor-crosshair">
                                <canvas
                                    ref={canvasRef}
                                    width={1200}
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
                                {isHost && (
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow p-2 rounded-xl border flex gap-2">
                                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Interactive Whiteboard</Badge>
                                        <Button size="sm" variant="destructive" onClick={clearWhiteboard} className="h-6 text-[10px]">Clear Canvas</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : screenSharing ? (
                        <div className="absolute inset-0 bg-black flex flex-col p-2">
                            <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className={`w-full h-full p-2 grid gap-2 ${activeParticipants.length === 0 ? 'grid-cols-1' : activeParticipants.length === 1 ? 'grid-cols-2' : activeParticipants.length <= 3 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3'}`}>
                            {/* MY VIDEO */}
                            <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800">
                                {videoEnabled ? (
                                    <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl">{userName.charAt(0)}</div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur">
                                    {userName} (You)
                                </div>
                                {!audioEnabled && <div className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full"><MicOff className="w-3 h-3 text-white" /></div>}
                            </div>
                            
                            {/* PEER VIDEOS */}
                            {activeParticipants.map((p, i) => (
                                <div key={i} className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800">
                                    <video 
                                        autoPlay 
                                        playsInline 
                                        className="w-full h-full object-cover" 
                                        ref={(vid) => { if (vid && p.stream) vid.srcObject = p.stream; }} 
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur flex items-center gap-2">
                                        {p.userName} {p.isHost && <Badge className="text-[9px] h-4 px-1 py-0 bg-blue-500/30 text-blue-300">Host</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Self camera as PIP during screen share or whiteboard */}
                {(screenSharing || showWhiteboard) && (
                    <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 z-10">
                        {videoEnabled ? (
                            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-800"><CameraOff className="w-8 h-8 text-gray-500" /></div>
                        )}
                        <div className="absolute bottom-1 left-2 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">{userName}</div>
                    </div>
                )}
            </div>

            {/* Bottom controls */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900/90 border-t border-gray-800">
                <Button size="sm" onClick={toggleAudio} className={`rounded-full w-11 h-11 ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
                    {audioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                </Button>
                <Button size="sm" onClick={toggleVideo} className={`rounded-full w-11 h-11 ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
                    {videoEnabled ? <Camera className="w-5 h-5 text-white" /> : <CameraOff className="w-5 h-5 text-white" />}
                </Button>
                <Button size="sm" onClick={toggleScreenShare} className={`rounded-full w-11 h-11 ${screenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
                </Button>

                {isHost && (
                    <Button size="sm" onClick={() => { 
                        const newState = !showWhiteboard;
                        if (newState) setScreenSharing(false);
                        setShowWhiteboard(newState); 
                        socket?.emit('whiteboard-state', { roomName, isOpen: newState });
                    }} className={`rounded-full w-11 h-11 ${showWhiteboard ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`} title="Whiteboard">
                        <PenTool className="w-5 h-5 text-white" />
                    </Button>
                )}

                <div className="w-px h-8 bg-gray-700 mx-2" />

                <Button size="sm" onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} className={`rounded-full w-11 h-11 ${showChat ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <MessageCircle className="w-5 h-5 text-white" />
                </Button>
                <Button size="sm" onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} className={`rounded-full w-11 h-11 ${showParticipants ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <Users className="w-5 h-5 text-white" />
                </Button>
                <Button size="sm" onClick={toggleFullscreen} className="rounded-full w-11 h-11 bg-gray-700 hover:bg-gray-600">
                    <Maximize2 className="w-5 h-5 text-white" />
                </Button>
            </div>

            {/* Chat Panel */}
            {showChat && (
                <div className="absolute top-12 right-0 bottom-16 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Class Chat</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => setShowChat(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {messages.length === 0 && <p className="text-gray-500 text-xs text-center mt-8">No messages yet. Say hi!</p>}
                        {messages.map((m, i) => (
                            <div key={i} className="bg-gray-800/50 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-blue-400 text-xs font-semibold">{m.user}</span>
                                    <span className="text-gray-500 text-[10px]">{m.time}</span>
                                </div>
                                <p className="text-gray-300 text-xs">{m.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-800 flex gap-2">
                        <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type message..." className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none border focus:border-blue-500 border-gray-700" />
                        <Button size="sm" onClick={sendMessage} className="bg-blue-600 hover:bg-blue-500 h-8 w-8 p-0 shrink-0"><Send className="w-3.5 h-3.5 text-white" /></Button>
                    </div>
                </div>
            )}

            {/* Participants Panel */}
            {showParticipants && (
                <div className="absolute top-12 right-0 bottom-16 w-72 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Participants ({Object.keys(peers).length + 1})</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => setShowParticipants(false)}><X className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <div className="flex gap-3 px-3 py-2 rounded-xl bg-blue-900/30 border border-blue-800/30">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{userName.charAt(0)}</div>
                            <div className="flex-1">
                                <p className="text-white text-xs font-medium">{userName} (You)</p>
                                <p className="text-blue-400 text-[10px]">{isHost ? 'Host' : 'Student'} • Connected</p>
                            </div>
                        </div>
                        {Object.values(peers).map((p, i) => (
                            <div key={i} className="flex gap-3 px-3 py-2 rounded-xl bg-gray-800/50">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">{p.userName.charAt(0)}</div>
                                <div className="flex-1">
                                    <p className="text-white text-xs font-medium">{p.userName}</p>
                                    <p className="text-gray-400 text-[10px]">{p.isHost ? 'Host' : 'Student'} • {p.stream ? 'Video ON' : 'Connecting...'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

