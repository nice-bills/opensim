import { Character } from './types.js';

export interface ERC8004Metadata {
  tokenId: string;
  owner: string;
  agentFramework: string;
  ens?: string;
  reputation: number;
  interactionCount: number;
}

export class ERC8004Identity {
  private registeredAgents: Map<string, ERC8004Metadata> = new Map();
  
  async register(character: Character): Promise<ERC8004Metadata> {
    const metadata: ERC8004Metadata = {
      tokenId: character.id,
      owner: character.owner,
      agentFramework: character.agentFramework,
      ens: character.ens,
      reputation: 0,
      interactionCount: 0
    };
    
    this.registeredAgents.set(character.id, metadata);
    console.log(`[ERC8004] Registered: ${character.name}`);
    
    return metadata;
  }
  
  async getIdentity(characterId: string): Promise<ERC8004Metadata | null> {
    return this.registeredAgents.get(characterId) || null;
  }
  
  isRegistered(characterId: string): boolean {
    return this.registeredAgents.has(characterId);
  }
  
  getAllIdentities(): ERC8004Metadata[] {
    return Array.from(this.registeredAgents.values());
  }
}

export const erc8004 = new ERC8004Identity();
