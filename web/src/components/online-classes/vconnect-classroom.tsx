'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
    MessageCircle, Users, Send, Maximize2, Hand, X, PenTool, VolumeX
} from 'lucide-react';

interface Props {
    roomName: string;
    userName: string;
    isHost?: boolean | null;
}

export function VConnectClassroom({ roomName, userName, isHost = false }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
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
    const containerRef = useRef<HTMLDivElement>(null);

    // Start camera on mount
    useEffect(() => {
        (async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, facingMode: 'user' },
                    audio: true,
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error('Camera access denied:', err);
            }
        })();

        return () => {
            stream?.getTracks().forEach(t => t.stop());
            screenStream?.getTracks().forEach(t => t.stop());
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
            stream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
            setAudioEnabled(!audioEnabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
            setVideoEnabled(!videoEnabled);
        }
    };

    const toggleScreenShare = async () => {
        if (screenSharing) {
            screenStream?.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            setScreenSharing(false);
        } else {
            try {
                const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setScreenStream(ss);
                setScreenSharing(true);
                if (screenRef.current) screenRef.current.srcObject = ss;
                ss.getVideoTracks()[0].addEventListener('ended', () => {
                    setScreenStream(null);
                    setScreenSharing(false);
                });
            } catch { /* user cancelled */ }
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    const sendMessage = () => {
        if (!msgInput.trim()) return;
        setMessages(prev => [...prev, { user: userName, text: msgInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setMsgInput('');
    };

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
                    <span className="text-gray-500 text-xs">Room: {roomName}</span>
                </div>
            </div>

            {/* Video area */}
            <div className="relative" style={{ minHeight: '500px', height: 'calc(100vh - 280px)' }}>
                {/* Main video (screen share or camera) */}
                {screenSharing || showWhiteboard ? (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                        {showWhiteboard ? (
                            <div className="w-[95%] h-[95%] bg-white rounded-xl shadow-inner relative overflow-hidden">
                                <div className="absolute top-2 left-2 bg-gray-100 px-3 py-1.5 rounded-lg border text-gray-500 text-xs font-medium flex items-center gap-2">
                                    <PenTool className="w-3.5 h-3.5" /> Interactive Whiteboard (Host)
                                </div>
                                <div className="w-full h-full flex flex-col items-center justify-center opacity-30 pointer-events-none">
                                    <PenTool className="w-24 h-24 text-gray-300 mb-4" />
                                    <p className="text-gray-400 font-semibold">Drawing Canvas</p>
                                </div>
                            </div>
                        ) : (
                            <video
                                ref={screenRef}
                                autoPlay
                                playsInline
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                        {/* Self camera as PIP */}
                        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            <div className="absolute bottom-1 left-2 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">{userName} (You)</div>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
                        {videoEnabled ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="max-w-full max-h-full object-cover rounded-xl"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-gray-400 text-sm">{userName}</p>
                                <p className="text-gray-500 text-xs">Camera is off</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Hand raised indicator */}
                {handRaised && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                        <Hand className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 text-xs font-medium">Hand Raised</span>
                    </div>
                )}

                {/* Muted indicator */}
                {!audioEnabled && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full">
                        <span className="text-red-300 text-xs font-medium">🔇 Muted</span>
                    </div>
                )}
            </div>

            {/* Bottom controls */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900/90 border-t border-gray-800">
                <Button
                    size="sm"
                    onClick={toggleAudio}
                    className={`rounded-full w-11 h-11 ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}
                >
                    {audioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                </Button>
                <Button
                    size="sm"
                    onClick={toggleVideo}
                    className={`rounded-full w-11 h-11 ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}
                >
                    {videoEnabled ? <Camera className="w-5 h-5 text-white" /> : <CameraOff className="w-5 h-5 text-white" />}
                </Button>
                <Button
                    size="sm"
                    onClick={toggleScreenShare}
                    className={`rounded-full w-11 h-11 ${screenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
                </Button>

                {isHost && (
                    <Button
                        size="sm"
                        onClick={() => {
                            if (!showWhiteboard) { setScreenSharing(false); setShowWhiteboard(true); }
                            else { setShowWhiteboard(false); }
                        }}
                        className={`rounded-full w-11 h-11 ${showWhiteboard ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                        title="Whiteboard"
                    >
                        <PenTool className="w-5 h-5 text-white" />
                    </Button>
                )}

                <div className="w-px h-8 bg-gray-700" />

                <Button
                    size="sm"
                    onClick={() => setHandRaised(!handRaised)}
                    className={`rounded-full w-11 h-11 ${handRaised ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <Hand className="w-5 h-5 text-white" />
                </Button>
                <Button
                    size="sm"
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    className={`rounded-full w-11 h-11 ${showChat ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <MessageCircle className="w-5 h-5 text-white" />
                </Button>
                <Button
                    size="sm"
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    className={`rounded-full w-11 h-11 ${showParticipants ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <Users className="w-5 h-5 text-white" />
                </Button>
                <Button
                    size="sm"
                    onClick={toggleFullscreen}
                    className="rounded-full w-11 h-11 bg-gray-700 hover:bg-gray-600"
                >
                    <Maximize2 className="w-5 h-5 text-white" />
                </Button>
            </div>

            {/* Chat Panel */}
            {showChat && (
                <div className="absolute top-12 right-0 bottom-14 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-10">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Chat</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => setShowChat(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {messages.length === 0 && (
                            <p className="text-gray-500 text-xs text-center mt-8">No messages yet</p>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className="bg-gray-800/50 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-blue-400 text-xs font-semibold">{m.user}</span>
                                    <span className="text-gray-600 text-[10px]">{m.time}</span>
                                </div>
                                <p className="text-gray-300 text-xs">{m.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-gray-800 flex gap-2">
                        <input
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                        />
                        <Button size="sm" onClick={sendMessage} className="bg-blue-600 hover:bg-blue-500 rounded-lg h-8 w-8 p-0">
                            <Send className="w-3.5 h-3.5 text-white" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Participants Panel */}
            {showParticipants && (
                <div className="absolute top-12 right-0 bottom-14 w-72 bg-gray-900 border-l border-gray-800 flex flex-col z-10">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-white text-sm font-semibold">Participants (1)</span>
                        <div className="flex gap-1">
                            {isHost && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-400" title="Mute All">
                                    <VolumeX className="w-4 h-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => setShowParticipants(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-xs font-medium">{userName} (You)</p>
                                <p className="text-gray-500 text-[10px]">{isHost ? 'Host' : 'Student'}</p>
                            </div>
                            <div className="flex gap-1">
                                {audioEnabled ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                                {videoEnabled ? <Camera className="w-3 h-3 text-green-400" /> : <CameraOff className="w-3 h-3 text-red-400" />}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
