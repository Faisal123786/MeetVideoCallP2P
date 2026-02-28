import React from "react";
const PeerContext = React.createContext();

export const usePeer = () => {
  return React.useContext(PeerContext);
};
export const PeerProvider = ({ children }) => {
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  const peer = new RTCPeerConnection(configuration);
  const createOffer = async () => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  };

  const createAnswer = async (offer) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  };




  return (
    <PeerContext.Provider
      value={{ peer, createOffer, createAnswer }}
    >
      {children}
    </PeerContext.Provider>
  );
};
