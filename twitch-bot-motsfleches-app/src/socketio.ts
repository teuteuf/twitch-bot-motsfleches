import io from "socket.io-client";

const apiUrl = process.env.REACT_APP_API_URL ?? `http://${window.location.hostname || 'localhost'}:4000`;

export const socket = io(apiUrl);
