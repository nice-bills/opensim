export interface Position {
  x: number;
  y: number;
}

export interface CharacterNeeds {
  hunger: number;
  energy: number;
  social: number;
  fun: number;
}

export type CharacterAction = 'idle' | 'walk' | 'eat' | 'sleep' | 'talk' | 'work' | 'build' | 'trade';
export type CharacterState = 'idle' | 'walking' | 'acting' | 'sleeping';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface CharacterConfig {
  body: string;
  hair: string;
  clothes: string;
  skin: string;
}

export interface Character {
  id: string;
  name: string;
  
  // Identity
  owner: string;
  ens?: string;
  agentFramework: string;
  erc8004Id?: string;
  
  // Position & Movement
  position: Position;
  target?: Position;
  direction: Direction;
  
  // Needs (0.0 - 1.0)
  needs: CharacterNeeds;
  
  // Status
  action: CharacterAction;
  state: CharacterState;
  
  // Economy
  balance: string;
  reputation: number;
  
  // Memory
  memory: string[];
  
  // Sprite config
  spriteConfig: CharacterConfig;
}

export interface WorldEvent {
  id: string;
  type: string;
  from: string;
  to?: string;
  data?: any;
  timestamp: number;
}

export interface WorldState {
  tick: number;
  characters: Map<string, Character>;
  events: WorldEvent[];
}

export interface ConnectPayload {
  name: string;
  agentId: string;
  framework: string;
  wallet?: string;
  ens?: string;
  characterConfig: CharacterConfig;
}

export interface ActionPayload {
  action: CharacterAction;
  target?: string;
  location?: Position;
}

export interface WorldStateMessage {
  tick: number;
  characters: Character[];
  yourCharacter: Character | null;
  nearbyCharacters: Character[];
  events: WorldEvent[];
}
