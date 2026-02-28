import React, { useCallback, useEffect } from 'react';
import { useSocket } from '../providers/Socket';
import { useToaster } from '../providers/Toaster';
import { useNavigate } from 'react-router-dom';

function Wait() {
  const { socket } = useSocket();
  const { showToast } = useToaster();
  const navigate = useNavigate();

  const handleWaitForAdmit = useCallback(
    (data) => {
      showToast(`Waiting for host to admit you to room ${data.roomId}`, 'info');
      navigate(`/wait/${data.roomId}`);
    },
    [showToast, navigate]
  );

  const handleRoomJoined = useCallback(
    ({ roomId }) => {
      showToast(`You have been admitted to room ${roomId}`, 'success');
      navigate(`/room/${roomId}`);
    },
    [showToast, navigate]
  );

  useEffect(() => {
    socket.on('wait_for_admit', handleWaitForAdmit);
    socket.on('room_joined', handleRoomJoined);

    return () => {
      socket.off('wait_for_admit', handleWaitForAdmit);
      socket.off('room_joined', handleRoomJoined);
    };
  }, [socket, handleWaitForAdmit, handleRoomJoined]);

  return (
    <div style={styles.container}>
      {/* Waves Background */}
      <div style={styles.wavesContainer}>
        <div style={{ ...styles.wave, ...styles.wave1 }}></div>
        <div style={{ ...styles.wave, ...styles.wave2 }}></div>
        <div style={{ ...styles.wave, ...styles.wave3 }}></div>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <div style={styles.avatar}>👋</div>
        <h2 style={styles.title}>Almost There!</h2>
        <p style={styles.subtitle}>The host will admit you shortly.</p>

        <div style={styles.status}>
          <span style={styles.dot}></span>
          <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
          <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
        </div>

        <button style={styles.cancelBtn} onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>

      {/* Keyframes */}
      <style>
        {`
        @keyframes waveMove {
          0% { transform: translateX(-50%) translateY(0) rotate(0deg); }
          50% { transform: translateX(0) translateY(-10px) rotate(0deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Poppins', sans-serif",
    background: '#1e1e2f',
    overflow: 'hidden',
  },
  wavesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    bottom: 0,
    left: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    width: '200%',
    height: '100%',
    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 20%, transparent 70%)',
    borderRadius: '43%',
    animation: 'waveMove 10s linear infinite',
  },
  wave1: { animationDelay: '0s', opacity: 0.4 },
  wave2: { animationDelay: '2s', opacity: 0.3 },
  wave3: { animationDelay: '4s', opacity: 0.2 },

  card: {
    position: 'relative',
    zIndex: 1,
    width: '360px',
    padding: '40px 30px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    color: '#fff',
    backdropFilter: 'blur(10px)',
  },
  avatar: {
    width: '100px',
    height: '100px',
    fontSize: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 20px',
    background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
    borderRadius: '50%',
    boxShadow: '0 0 20px #6a11cb, 0 0 40px #2575fc',
  },
  title: { fontSize: '26px', fontWeight: 700, marginBottom: '10px' },
  subtitle: { fontSize: '14px', marginBottom: '30px', color: '#ccc' },
  status: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' },
  dot: {
    width: '14px',
    height: '14px',
    background: '#ffd700',
    borderRadius: '50%',
    animation: 'bounce 1.2s infinite',
    boxShadow: '0 0 10px #ffd700',
  },
  cancelBtn: {
    padding: '12px 28px',
    borderRadius: '30px',
    border: 'none',
    background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  },
};

export default Wait;