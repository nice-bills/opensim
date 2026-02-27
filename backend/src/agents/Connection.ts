import { Server, Socket } from 'socket.io';
import { worldState } from '../world/WorldState.js';
import { ConnectPayload, ActionPayload } from '../world/types.js';

interface ConnectedAgent {
  socketId: string;
  agentId: string;
  characterId: string;
}

export class AgentConnection {
  private io: Server;
  private agents: Map<string, ConnectedAgent> = new Map();
  
  constructor(io: Server) {
    this.io = io;
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Agent] Connected: ${socket.id}`);
      
      socket.on('connect_agent', (payload: ConnectPayload) => {
        this.handleConnect(socket, payload);
      });
      
      socket.on('action', (payload: ActionPayload) => {
        this.handleAction(socket, payload);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
    
    setInterval(() => {
      this.broadcastWorldState();
    }, 100);
  }
  
  private handleConnect(socket: Socket, payload: ConnectPayload) {
    const { name, agentId, framework, wallet, ens, characterConfig } = payload;
    
    const character = worldState.addCharacter(
      agentId,
      name,
      framework,
      wallet || `anon_${agentId.slice(0, 8)}`,
      characterConfig,
      ens
    );
    
    this.agents.set(socket.id, {
      socketId: socket.id,
      agentId,
      characterId: character.id
    });
    
    socket.emit('connected', {
      success: true,
      characterId: character.id,
      worldState: worldState.getWorldState(character.id)
    });
    
    console.log(`[Agent] ${name} joined as ${character.id}`);
  }
  
  private handleAction(socket: Socket, payload: ActionPayload) {
    const agent = this.agents.get(socket.id);
    if (!agent) {
      socket.emit('error', { message: 'Not connected' });
      return;
    }
    
    const { action, target, location } = payload;
    const result = worldState.setAction(agent.characterId, action, target, location);
    socket.emit('action_result', { ...result, characterId: agent.characterId });
  }
  
  private handleDisconnect(socket: Socket) {
    const agent = this.agents.get(socket.id);
    if (agent) {
      worldState.removeCharacter(agent.characterId);
      this.agents.delete(socket.id);
      console.log(`[Agent] Disconnected: ${agent.agentId}`);
    }
  }
  
  private broadcastWorldState() {
    for (const [socketId, agent] of this.agents.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('world_state', worldState.getWorldState(agent.characterId));
      }
    }
  }
  
  getConnectedCount(): number {
    return this.agents.size;
  }
  
  getAgents(): ConnectedAgent[] {
    return Array.from(this.agents.values());
  }
}
