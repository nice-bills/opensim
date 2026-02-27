import { Character, WorldEvent, Position, CharacterAction, Direction, CharacterConfig } from './types.js';
import { v4 as uuidv4 } from 'uuid';

const WORLD_WIDTH = 25;
const WORLD_HEIGHT = 18;
const MAX_EVENTS = 100;
const MAX_MEMORY = 20;

export class WorldStateManager {
  private tick: number = 0;
  private characters: Map<string, Character> = new Map();
  private events: WorldEvent[] = [];
  private tickInterval: NodeJS.Timeout | null = null;
  private actionTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private readonly TICK_RATE = 100;
  private readonly NEEDS_DECAY = 0.0002;
  
  start() {
    if (this.tickInterval) return;
    
    this.tickInterval = setInterval(() => {
      this.tick++;
      this.decayNeeds();
      this.processMovement();
    }, this.TICK_RATE);
    
    console.log(`[World] Started`);
  }
  
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  
  addCharacter(
    id: string,
    name: string,
    framework: string,
    wallet: string,
    config: CharacterConfig,
    ens?: string
  ): Character {
    const character: Character = {
      id,
      name,
      owner: wallet,
      ens,
      agentFramework: framework,
      position: this.getRandomPosition(),
      direction: 'down',
      needs: { hunger: 0.8, energy: 0.8, social: 0.8, fun: 0.8 },
      action: 'idle',
      state: 'idle',
      balance: '0',
      reputation: 0,
      memory: [],
      spriteConfig: config
    };
    
    this.characters.set(id, character);
    this.addEvent('join', id);
    
    return character;
  }
  
  removeCharacter(id: string) {
    const char = this.characters.get(id);
    if (char) {
      this.addEvent('leave', id);
      this.characters.delete(id);
    }
  }
  
  getCharacter(id: string): Character | undefined {
    return this.characters.get(id);
  }
  
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
  
  getNearbyCharacters(id: string, radius: number = 3): Character[] {
    const char = this.characters.get(id);
    if (!char) return [];
    
    return Array.from(this.characters.values()).filter(c => {
      if (c.id === id) return false;
      const dx = c.position.x - char.position.x;
      const dy = c.position.y - char.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }
  
  setAction(id: string, action: CharacterAction, target?: string, location?: Position): { success: boolean; message?: string } {
    const char = this.characters.get(id);
    if (!char) return { success: false, message: 'Character not found' };
    
    if (char.state !== 'idle' && action !== 'idle') {
      return { success: false, message: 'Character is busy' };
    }
    
    if (action === 'idle') {
      char.action = 'idle';
      char.state = 'idle';
      char.target = undefined;
      return { success: true };
    }
    
    if (action === 'walk' && location) {
      char.target = location;
      char.state = 'walking';
      char.direction = this.getDirection(char.position, location);
      char.action = 'walk';
      return { success: true };
    }
    
    if (action === 'talk' && target) {
      const targetChar = this.characters.get(target);
      if (!targetChar) return { success: false, message: 'Target not found' };
      char.state = 'acting';
      char.action = 'talk';
      this.addEvent('talk', id, target);
      return { success: true };
    }
    
    char.action = action;
    char.state = 'acting';
    return { success: true };
  }
  
  private decayNeeds() {
    for (const char of this.characters.values()) {
      if (char.state !== 'sleeping') {
        char.needs.hunger = Math.max(0, char.needs.hunger - this.NEEDS_DECAY);
        char.needs.energy = Math.max(0, char.needs.energy - this.NEEDS_DECAY);
        char.needs.social = Math.max(0, char.needs.social - this.NEEDS_DECAY);
        char.needs.fun = Math.max(0, char.needs.fun - this.NEEDS_DECAY);
      }
    }
  }
  
  private processMovement() {
    for (const char of this.characters.values()) {
      if (char.state === 'walking' && char.target) {
        const dx = char.target.x - char.position.x;
        const dy = char.target.y - char.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.5) {
          char.position = { ...char.target };
          char.target = undefined;
          char.state = 'idle';
          char.action = 'idle';
        } else {
          const speed = 0.1;
          char.position.x += (dx / dist) * speed;
          char.position.y += (dy / dist) * speed;
          char.direction = this.getDirection(char.position, char.target);
        }
      }
    }
  }
  
  private addEvent(type: string, from: string, to?: string) {
    const event: WorldEvent = {
      id: uuidv4(),
      type,
      from,
      to,
      timestamp: Date.now()
    };
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }
  }
  
  private getRandomPosition(): Position {
    return {
      x: Math.floor(Math.random() * WORLD_WIDTH),
      y: Math.floor(Math.random() * WORLD_HEIGHT)
    };
  }
  
  private getDirection(from: Position, to: Position): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }
  
  getWorldState(forCharacterId?: string) {
    return {
      tick: this.tick,
      characters: this.getAllCharacters(),
      yourCharacter: forCharacterId ? this.characters.get(forCharacterId) || null : null,
      nearbyCharacters: forCharacterId ? this.getNearbyCharacters(forCharacterId) : [],
      events: this.events.slice(-20)
    };
  }
  
  getTick(): number {
    return this.tick;
  }
  
  getCharacterCount(): number {
    return this.characters.size;
  }
}

export const worldState = new WorldStateManager();
