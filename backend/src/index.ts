import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { worldState } from './world/WorldState.js';
import { AgentConnection } from './agents/Connection.js';
import { erc8004 } from './onchain/erc8004.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

worldState.start();
const agentConnection = new AgentConnection(io);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    tick: worldState.getTick(),
    agents: agentConnection.getConnectedCount()
  });
});

app.get('/world', (req, res) => {
  res.json(worldState.getWorldState());
});

app.get('/characters', (req, res) => {
  res.json(worldState.getAllCharacters());
});

app.get('/character/:id', (req, res) => {
  const char = worldState.getCharacter(req.params.id);
  if (!char) return res.status(404).json({ error: 'Not found' });
  res.json(char);
});

app.post('/register-identity', async (req, res) => {
  const { characterId } = req.body;
  const char = worldState.getCharacter(characterId);
  if (!char) return res.status(404).json({ error: 'Character not found' });
  
  const identity = await erc8004.register(char);
  res.json({ success: true, identity });
});

app.get('/identity/:characterId', async (req, res) => {
  const identity = await erc8004.getIdentity(req.params.characterId);
  if (!identity) return res.status(404).json({ error: 'Not registered' });
  res.json(identity);
});

app.get('/identities', (req, res) => {
  res.json({ identities: erc8004.getAllIdentities() });
});

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     OpenSim - Agent World            ║
║  http://localhost:${PORT}                ║
║  ws://localhost:${PORT}                ║
╚═══════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  worldState.stop();
  httpServer.close(() => process.exit(0));
});
