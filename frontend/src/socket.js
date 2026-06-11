import { io } from 'socket.io-client';
import { API_URL } from './api';

// アプリ全体で1つのソケット接続を共有する
export const socket = io(API_URL, { autoConnect: true });
