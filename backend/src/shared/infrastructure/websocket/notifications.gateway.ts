// shared/infrastructure/websocket/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Gateway global para actualizaciones en tiempo real.
// Los clientes frontend escuchan estos eventos:
//  - lot.updated        -> actualiza color del polígono SMS, tabla y contadores
//  - payment.created    -> actualiza ingresos, saldo, gráficos y movimientos
//  - expense.created    -> actualiza egresos, flujo de caja y gráficos
//  - sale.created       -> actualiza ventas, comisiones, ranking y progreso
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Permitir unirse a salas por proyecto: client.join(`project-${id}`)
    const projectId = client.handshake.query.projectId as string;
    if (projectId) client.join(`project-${projectId}`);
  }

  emitToAll(event: string, payload: unknown): void {
    this.server.emit(event, payload);
  }

  emitToProject(event: string, payload: unknown, projectId: number): void {
    this.server.to(`project-${projectId}`).emit(event, payload);
  }
}