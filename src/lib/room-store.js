import { v4 as uuidv4 } from 'uuid';

const USER_COLORS = [
  'hsl(207, 90%, 54%)',
  'hsl(140, 60%, 48%)',
  'hsl(35, 90%, 54%)',
  'hsl(330, 80%, 60%)',
  'hsl(270, 70%, 60%)',
  'hsl(180, 70%, 45%)',
];

const rooms = new Map();

export function createRoom(username) {
  const roomId = uuidv4().slice(0, 8);
  const user = {
    id: uuidv4(),
    username,
    color: USER_COLORS[0],
  };
  const room = {
    id: roomId,
    code: '// Welcome to CodeSync!\n// Start coding collaboratively.\n\nconsole.log("Hello, CodeSync!");\n',
    language: 'javascript',
    users: [user],
    messages: [],
    snapshots: [],
    isLocked: false,
    ownerId: user.id,
  };
  rooms.set(roomId, room);
  return { room, user };
}

export function joinRoom(roomId, username) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.isLocked) return null;
  const user = {
    id: uuidv4(),
    username,
    color: USER_COLORS[room.users.length % USER_COLORS.length],
  };
  room.users.push(user);
  room.messages.push({
    id: uuidv4(),
    userId: 'system',
    username: 'System',
    content: `${username} joined the room`,
    timestamp: new Date(),
  });
  return { room, user };
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function updateCode(roomId, code) {
  const room = rooms.get(roomId);
  if (room) room.code = code;
}

export function updateLanguage(roomId, language) {
  const room = rooms.get(roomId);
  if (room) room.language = language;
}

export function addMessage(roomId, userId, username, content) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const msg = {
    id: uuidv4(),
    userId,
    username,
    content,
    timestamp: new Date(),
  };
  room.messages.push(msg);
  return msg;
}

export function saveSnapshot(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const snapshot = {
    id: uuidv4(),
    code: room.code,
    language: room.language,
    timestamp: new Date(),
    label: `Snapshot ${room.snapshots.length + 1}`,
  };
  room.snapshots.push(snapshot);
  return snapshot;
}

export function toggleLock(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room || room.ownerId !== userId) return null;
  room.isLocked = !room.isLocked;
  return room.isLocked;
}

export function leaveRoom(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const user = room.users.find(u => u.id === userId);
  room.users = room.users.filter(u => u.id !== userId);
  if (user) {
    room.messages.push({
      id: uuidv4(),
      userId: 'system',
      username: 'System',
      content: `${user.username} left the room`,
      timestamp: new Date(),
    });
  }
}