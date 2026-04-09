import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/classroom',
})
export class ClassroomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map room -> Map<socketId, { userName: string, role: string }>
  private rooms = new Map<string, Map<string, any>>();

  handleConnection(client: Socket) {
    console.log(`Classroom client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Classroom client disconnected: ${client.id}`);
    this.rooms.forEach((users, roomName) => {
      if (users.has(client.id)) {
        users.delete(client.id);
        if (users.size === 0) {
          this.rooms.delete(roomName);
        } else {
          // Notify others in room
          this.server.to(roomName).emit('user-left', { userId: client.id });
        }
      }
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, payload: { roomName: string; userName: string; isHost: boolean }) {
    client.join(payload.roomName);
    
    if (!this.rooms.has(payload.roomName)) {
      this.rooms.set(payload.roomName, new Map());
    }
    const roomUsers = this.rooms.get(payload.roomName)!;
    
    // Get existing users in room
    const existingUsers = Array.from(roomUsers.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));

    // Add new user
    roomUsers.set(client.id, { userName: payload.userName, isHost: payload.isHost });

    // Tell the new user about existing users
    client.emit('room-users', existingUsers);

    // Tell existing users about the new user
    client.to(payload.roomName).emit('user-joined', {
      id: client.id,
      userName: payload.userName,
      isHost: payload.isHost,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, payload: { target: string; caller: string; sdp: any }) {
    client.to(payload.target).emit('offer', {
      caller: payload.caller,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, payload: { target: string; caller: string; sdp: any }) {
    client.to(payload.target).emit('answer', {
      caller: payload.caller,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: Socket, payload: { target: string; caller: string; candidate: any }) {
    client.to(payload.target).emit('ice-candidate', {
      caller: payload.caller,
      candidate: payload.candidate,
    });
  }

  @SubscribeMessage('chat')
  handleChat(client: Socket, payload: { roomName: string; text: string; userName: string; time: string }) {
    client.to(payload.roomName).emit('chat', payload);
  }

  @SubscribeMessage('draw')
  handleDraw(client: Socket, payload: { roomName: string; x0: number; y0: number; x1: number; y1: number; color: string; clear?: boolean }) {
    client.to(payload.roomName).emit('draw', payload);
  }

  @SubscribeMessage('whiteboard-state')
  handleWhiteboardState(client: Socket, payload: { roomName: string; isOpen: boolean }) {
    client.to(payload.roomName).emit('whiteboard-state', payload.isOpen);
  }
}
