import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ERC8004Identity } from '../src/onchain/erc8004.js';
import { Character, CharacterConfig } from '../src/world/types.js';

const TEST_CONFIG: CharacterConfig = {
  body: 'male',
  hair: 'short',
  clothes: 'blue',
  skin: 'light'
};

const TEST_CHAR: Character = {
  id: 'test-1',
  name: 'TestAgent',
  owner: '0x123',
  agentFramework: 'openclaw',
  position: { x: 5, y: 5 },
  direction: 'down',
  needs: { hunger: 0.8, energy: 0.8, social: 0.8, fun: 0.8 },
  action: 'idle',
  state: 'idle',
  balance: '0',
  reputation: 0,
  memory: [],
  spriteConfig: TEST_CONFIG
};

describe('ERC8004Identity', () => {
  let erc8004: ERC8004Identity;
  
  beforeEach(() => {
    erc8004 = new ERC8004Identity();
  });
  
  it('should register an agent', async () => {
    const result = await erc8004.register(TEST_CHAR);
    
    assert.strictEqual(result.tokenId, 'test-1');
    assert.strictEqual(result.owner, '0x123');
  });
  
  it('should get identity by id', async () => {
    await erc8004.register(TEST_CHAR);
    const identity = await erc8004.getIdentity('test-1');
    
    assert.ok(identity);
    assert.strictEqual(identity?.tokenId, 'test-1');
  });
  
  it('should return null for unregistered', async () => {
    const identity = await erc8004.getIdentity('nonexistent');
    assert.strictEqual(identity, null);
  });
  
  it('should check if registered', async () => {
    await erc8004.register(TEST_CHAR);
    
    assert.strictEqual(erc8004.isRegistered('test-1'), true);
    assert.strictEqual(erc8004.isRegistered('nonexistent'), false);
  });
  
  it('should get all identities', async () => {
    await erc8004.register(TEST_CHAR);
    await erc8004.register({ ...TEST_CHAR, id: 'test-2', name: 'Test2' });
    
    const identities = erc8004.getAllIdentities();
    assert.strictEqual(identities.length, 2);
  });
});
