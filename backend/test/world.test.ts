import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { WorldStateManager } from '../src/world/WorldState.js';
import { CharacterConfig } from '../src/world/types.js';

const TEST_CONFIG: CharacterConfig = {
  body: 'male',
  hair: 'short',
  clothes: 'blue',
  skin: 'light'
};

describe('WorldState', () => {
  let world: WorldStateManager;
  
  beforeEach(() => {
    world = new WorldStateManager();
    world.start();
  });
  
  afterEach(() => {
    world.stop();
  });
  
  it('should add and remove characters', () => {
    const char = world.addCharacter('test-1', 'TestAgent', 'openclaw', '0x123', TEST_CONFIG);
    assert.strictEqual(world.getCharacterCount(), 1);
    assert.strictEqual(char.name, 'TestAgent');
    
    world.removeCharacter('test-1');
    assert.strictEqual(world.getCharacterCount(), 0);
  });
  
  it('should handle walk action', () => {
    world.addCharacter('test-1', 'TestAgent', 'openclaw', '0x123', TEST_CONFIG);
    
    const result = world.setAction('test-1', 'walk', undefined, { x: 10, y: 5 });
    assert.strictEqual(result.success, true);
    
    const char = world.getCharacter('test-1');
    assert.strictEqual(char?.action, 'walk');
  });
  
  it('should reject action on busy character', () => {
    world.addCharacter('test-1', 'TestAgent', 'openclaw', '0x123', TEST_CONFIG);
    
    world.setAction('test-1', 'walk', undefined, { x: 5, y: 5 });
    const result = world.setAction('test-1', 'talk', 'other');
    
    assert.strictEqual(result.success, false);
  });
  
  it('should get nearby characters', () => {
    world.addCharacter('test-1', 'Alice', 'openclaw', '0x123', TEST_CONFIG);
    world.addCharacter('test-2', 'Bob', 'openclaw', '0x456', TEST_CONFIG);
    
    const char1 = world.getCharacter('test-1')!;
    char1.position = { x: 5, y: 5 };
    
    const char2 = world.getCharacter('test-2')!;
    char2.position = { x: 6, y: 6 };
    
    const nearby = world.getNearbyCharacters('test-1', 3);
    assert.strictEqual(nearby.length, 1);
  });
});
