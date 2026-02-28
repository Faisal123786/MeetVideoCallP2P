import React, { useMemo } from "react";
import io from "socket.io-client";
const SocketContext = React.createContext();

export const useSocket = () => React.useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    return io("meet-video-call-p2-p.vercel.app", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
