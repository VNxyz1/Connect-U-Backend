import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface ActiveRoom {
  eventId: string;
  users: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Set<string>();

  private activeRooms: Map<number, ActiveRoom> = new Map();

  /**
   * First string is the userid, the second one the clientId
   * @private
   */
  private users: Map<string, string> = new Map();

  constructor() {}

  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }
}
