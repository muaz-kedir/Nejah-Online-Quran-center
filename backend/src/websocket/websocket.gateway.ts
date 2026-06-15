import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

type AuthenticatedSocket = Socket & {
  userId?: string;
  userRole?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private configService: ConfigService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'No auth token' });
        client.disconnect();
        return;
      }

      const secret = this.configService.get('JWT_SECRET') || 'nejah-secret-key-2024';
      const decoded = jwt.verify(token as string, secret) as any;

      client.userId = decoded.sub || decoded.id;
      client.userRole = decoded.role;

      client.join(`user:${client.userId}`);

      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      client.emit('connected', { userId: client.userId });
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach((id) => this.emitToUser(id, event, data));
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  @SubscribeMessage('ping')
  handlePing(client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}
