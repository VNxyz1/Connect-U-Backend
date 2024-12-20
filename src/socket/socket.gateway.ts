import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventService } from '../event/event.service';

interface ActiveRoom {
  eventId: string;
  users: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Set<string>();

  private activeRooms: Map<string, ActiveRoom> = new Map();

  /**
   * First string is the clientId, the second one the userId
   * @private
   */
  private users: Map<string, string> = new Map();

  constructor(private readonly eventService: EventService) {}

  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.users.delete(client.id);
  }

  @SubscribeMessage('handleConnect')
  async handleConnectUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    this.users.set(client.id, userId);
    client.join(`user_${userId}`);

    const hostingEvents = await this.eventService.getHostingEvents(userId);
    const participatingEvents =
      await this.eventService.getParticipatingEvents(userId);

    [...hostingEvents, ...participatingEvents].forEach((event) => {
      const roomName = `event_${event.id}`;
      client.join(roomName);
      this.addUserToRoom(userId, event.id);
    });
  }

  private addUserToRoom(userId: string, eventId: string): void {
    let room: ActiveRoom;

    if (this.activeRooms.has(eventId)) {
      room = this.activeRooms.get(eventId);
      room.users.add(userId);
    } else {
      room = { eventId: eventId, users: new Set([userId]) };
      this.activeRooms.set(eventId, room);
    }
  }

  emitNewList(eventId: string): void {
    this.server.to(`event_${eventId}`).emit('updateListOverview');
  }

  emitListDetail(eventId: string): void {
    this.server.to(`event_${eventId}`).emit('updateListDetail');
  }

  emitUpdateSurveys(eventId: string): void {
    this.server.to(`event_${eventId}`).emit('updateSurveyOverview');
  }

  emitSurveyDetail(eventId: string, surveyId: number): void {
    this.server.to(`event_${eventId}`).emit('updateSurveyDetail', { surveyId });
  }

  emitUpdateChat(eventId: string) {
    this.server.to(`event_${eventId}`).emit('updateSChatMessages');
  }
}
