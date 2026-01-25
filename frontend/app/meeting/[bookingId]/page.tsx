'use client';

import { useAuth } from '@/contexts/auth-context';
import { MeetingService } from '@/lib/services/meeting-service';
import {
  CallControls,
  CallParticipantsList,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Circle,
  CircleStop,
  Loader2,
  Lock,
  MessageSquare,
  Shield,
  UserPlus,
  Users
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

// Recording Controls Component (Professional only)
const RecordingControls = () => {
  const call = useCall();
  const { useIsCallRecordingInProgress, useLocalParticipant } = useCallStateHooks();
  const isRecording = useIsCallRecordingInProgress();
  const localParticipant = useLocalParticipant();

  const canRecord = localParticipant?.roles?.includes('admin') || localParticipant?.roles?.includes('host');

  if (!canRecord || !call) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isRecording ? (
        <button
          onClick={() => call.stopRecording()}
          className="bg-red-600 hover:bg-red-700 px-4 sm:px-6 py-3 sm:py-3 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-[10px] uppercase tracking-widest flex items-center gap-2 sm:gap-2 transition-all shadow-lg active:scale-95 min-h-[44px]"
        >
          <CircleStop className="w-4 h-4 sm:w-4 sm:h-4 animate-pulse" />
          <span className="hidden sm:inline">Stop Recording</span>
          <span className="sm:hidden">Stop</span>
        </button>
      ) : (
        <button
          onClick={() => call.startRecording()}
          className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 sm:px-6 py-3 sm:py-3 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-[10px] uppercase tracking-widest flex items-center gap-2 sm:gap-2 transition-all active:scale-95 min-h-[44px]"
        >
          <Circle className="w-4 h-4 sm:w-4 sm:h-4 text-red-500 fill-red-500" />
          <span className="hidden sm:inline">Start Recording</span>
          <span className="sm:hidden">Record</span>
        </button>
      )}
    </div>
  );
};

// Invite Button
const InviteButton = () => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 sm:gap-2 px-4 sm:px-6 py-3 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg min-h-[44px] ${
        copied 
          ? 'bg-green-600 text-white' 
          : 'bg-primary-600 hover:bg-primary-500 text-white'
      }`}
    >
      {copied ? <Check className="w-4 h-4 sm:w-4 sm:h-4" /> : <UserPlus className="w-4 h-4 sm:w-4 sm:h-4" />}
      <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Invite Guest'}</span>
      <span className="sm:hidden">{copied ? 'Copied' : 'Invite'}</span>
    </button>
  );
};

function MeetingContent() {
  const { bookingId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const guestMode = searchParams?.get('guest') === 'true';
  const guestName = searchParams?.get('name') || '';

  const [status, setStatus] = useState<'idle' | 'joining' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [showControls, setShowControls] = useState(true);
  const hasJoinedRef = useRef(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);


  const startSession = async () => {
    if (!bookingId) return;
    setStatus('joining');
    setErrorMessage('');

    try {
      let tokenData;
      
      console.log('Joining meeting with bookingId:', bookingId);
      console.log('User:', user, 'Guest mode:', guestMode, 'Guest name:', guestName);
      
      if (guestMode && guestName) {
        // Guest joining ad-hoc meeting
        console.log('Fetching guest token for:', bookingId);
        tokenData = await MeetingService.getGuestToken(bookingId as string, guestName);
      } else if (user) {
        // Check if this is an ad-hoc meeting (created by admin/moderator) or booking-based
        // Ad-hoc meetings typically have a different ID format or we can try ad-hoc first
        try {
          // Try ad-hoc meeting token first (for admin/moderator created meetings)
          console.log('Trying ad-hoc token for:', bookingId);
          tokenData = await MeetingService.getAdHocJoinToken(bookingId as string);
          console.log('Ad-hoc token received:', tokenData);
        } catch (error) {
          // If ad-hoc fails, try regular booking token
          console.log('Ad-hoc failed, trying booking token:', error);
          tokenData = await MeetingService.getJoinToken(bookingId as string);
          console.log('Booking token received:', tokenData);
        }
      } else {
        throw new Error('Authentication required');
      }

      const client = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user: {
          id: tokenData.data.userId || tokenData.data.user?.id || user?.id || `guest_${Date.now()}`,
          name: user?.name || tokenData.data.user?.name || guestName || 'Guest',
          image: user?.avatar || undefined, // Add user avatar if logged in
        },
        token: tokenData.data.token,
      });

      const call = client.call(tokenData.data.callType, tokenData.data.callId);
      
      // Use BroadcastChannel to notify other tabs to close
      const channel = new BroadcastChannel(`meeting_${bookingId}`);
      
      // Send message to close any existing tabs with this meeting
      channel.postMessage({ type: 'NEW_SESSION', timestamp: Date.now() });
      
      // Listen for new sessions (to close THIS tab if another one opens)
      channel.onmessage = (event) => {
        if (event.data.type === 'NEW_SESSION') {
          console.log('Another tab opened this meeting, closing this session...');
          // Clean up and redirect
          if (activeCall) activeCall.leave().catch(() => {});
          if (videoClient) videoClient.disconnectUser().catch(() => {});
          setStatus('idle');
          setErrorMessage('This meeting was opened in another tab.');
          router.push('/dashboard');
        }
      };
      
      // Store channel reference for cleanup
      (window as any).__meetingChannel = channel;
      

      // Get call info to check if user is already in it (from different browser/device)
      const callInfo = await call.get();
      const currentUserId = tokenData.data.userId || tokenData.data.user?.id || user?.id;
      
      // Check if user is already a participant (from another browser/device)
      const existingParticipant = callInfo.members.find((m: any) => m.user_id === currentUserId);
      const meetingKey = `meeting_active_${bookingId}`;
      const existingSession = localStorage.getItem(meetingKey);
      
      if (existingParticipant && !existingSession) {
        console.log('User already in call from another device/browser');
        const shouldContinue = window.confirm(
          'You are already in this call from another device or browser. Do you want to continue here? (This will disconnect your other session)'
        );
        
        if (!shouldContinue) {
          setStatus('idle');
          setErrorMessage('You chose not to join. Please use your existing session.');
          localStorage.removeItem(meetingKey);
          client.disconnectUser();
          return;
        }
      }
      
      // Join the call (don't create, just join)
      await call.join({ create: false });

      
      console.log('Successfully joined call');
      
      // Listen for call ended event (when host ends or user is kicked)
      call.on('call.ended', () => {
        console.log('Call ended by host or session kicked');
        // Close broadcast channel
        if ((window as any).__meetingChannel) {
          (window as any).__meetingChannel.close();
        }
        setStatus('idle');
        setErrorMessage('The call has ended.');
        setActiveCall(null);
        setVideoClient(null);
        hasJoinedRef.current = false;
        client.disconnectUser();
        router.push('/dashboard');
      });


      setVideoClient(client);
      setActiveCall(call);
      setStatus('connected');
    } catch (err: any) {
      console.error('Meeting Connection Error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to join meeting');
      setStatus('error');
    }
  };

  const handleGuestJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameInput.trim()) return;
    
    // Redirect with guest parameters
    router.push(`/meeting/${bookingId}?guest=true&name=${encodeURIComponent(guestNameInput.trim())}`);
  };

  useEffect(() => {
  const initialize = async () => {
    if (hasJoinedRef.current) {
      console.log('Already joined, skipping...');
      return;
    }

    if ((user || (guestMode && guestName)) && bookingId) {
      console.log('Joining call...');
      hasJoinedRef.current = true;
      await startSession();
    }
  };

  initialize();

  return () => {
    console.log('Cleaning up...');
    if (activeCall) {
      activeCall.leave().catch((err: any) => console.error('Error leaving:', err));
    }
    if (videoClient) {
  videoClient.disconnectUser().catch((err: any) => console.error('Error disconnecting:', err));
    }
  };
}, [bookingId, user, guestMode, guestName]);

  // Auto-hide controls on mouse inactivity
  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    if (status === 'connected') {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      handleActivity();
    }

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [status]);

  // Guest Name Input Screen
  if (!user && !guestMode) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-950 flex items-center justify-center p-4 sm:p-6 z-[300]">
        <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-600/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-primary-500/20">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500" />
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white mb-3 sm:mb-4 uppercase tracking-tighter">Private Session</h1>
          <p className="text-slate-500 text-xs sm:text-xs font-bold uppercase tracking-widest mb-6 sm:mb-10">Enter your name to join</p>
          <form onSubmit={handleGuestJoin} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={guestNameInput}
              onChange={(e) => setGuestNameInput(e.target.value)}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white font-bold placeholder:text-slate-600 outline-none focus:border-primary-500 transition-all text-base sm:text-base min-h-[48px]"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full py-4 sm:py-5 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-xl sm:rounded-2xl text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 min-h-[52px]"
            >
              Join Meeting <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Error Screen
  if (status === 'error') {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 z-[300]">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white mb-3 sm:mb-4 uppercase tracking-tighter">Connection Failed</h2>
          <p className="text-slate-400 text-sm sm:text-base mb-6 sm:mb-12 leading-relaxed">{errorMessage}</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 sm:py-5 bg-white text-slate-900 font-black rounded-xl sm:rounded-2xl uppercase text-sm tracking-widest active:scale-95 shadow-2xl min-h-[52px]"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em] hover:text-white transition-colors min-h-[44px] flex items-center justify-center"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLeaveCall = async () => {
    try {
      if (activeCall) {
        const localParticipant = activeCall.state.localParticipant;
        const isHost = localParticipant?.roles?.includes('host') || localParticipant?.roles?.includes('admin');
        
        // Stop all media tracks properly
try {
  const camera = activeCall.camera;
  const microphone = activeCall.microphone;
  
  if (camera) {
    if (camera.state?.status === 'enabled') await camera.disable();
    camera.mediaStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  }
  
  if (microphone) {
    if (microphone.state?.status === 'enabled') await microphone.disable();
    microphone.mediaStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  }
} catch (err) {
  console.error('Error stopping media:', err);
}
        
        // If user is host, end the call for everyone
        if (isHost) {
          console.log('Host leaving - ending call for everyone');
          await activeCall.endCall();
        } else {
          // Regular participant just leaves
          await activeCall.leave();
        }
      }
      
      // Disconnect the client
      if (videoClient) {
        await videoClient.disconnectUser();
      }
      
      // Close broadcast channel
      if ((window as any).__meetingChannel) {
        (window as any).__meetingChannel.close();
      }
      
      // Clear state
      setActiveCall(null);
      setVideoClient(null);
      hasJoinedRef.current = false;
      
      // Navigate back
      router.push('/dashboard');

    } catch (error) {
      console.error('Error leaving call:', error);
      hasJoinedRef.current = false;
      // Force navigation even if cleanup fails
      router.push('/dashboard');
    }
  };

  return (
    <div className="dark fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden z-[100]">

      {videoClient && activeCall ? (
        <StreamVideo client={videoClient}>
          <StreamCall call={activeCall}>
            <StreamTheme className="flex flex-col w-full h-full overflow-hidden">
              {/* Header - Always visible at top */}
              <header className="shrink-0 h-14 sm:h-16 lg:h-20 px-2 sm:px-4 lg:px-8 flex items-center justify-between backdrop-blur-xl bg-slate-950/80 border-b border-white/5 z-50">
                <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-primary-600/10 rounded-lg lg:rounded-xl flex items-center justify-center border border-primary-500/20">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-500" />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xs sm:text-xs font-black uppercase tracking-wider">
                      Professionals BD
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5 opacity-50">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] font-bold uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                  <div className="hidden xs:block">
                    <RecordingControls />
                  </div>
                  <InviteButton />
                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={`p-3 sm:p-2.5 rounded-lg border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      showChat 
                        ? 'bg-primary-600 text-white border-primary-500' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    onClick={() => setShowParticipants(!showParticipants)}
                    className={`p-3 sm:p-2.5 rounded-lg border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      showParticipants 
                        ? 'bg-primary-600 text-white border-primary-500' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </header>

              {/* Main Content - Video + Optional Sidebar */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Video Area with SpeakerLayout and CallControls inside */}
                <div className={`flex-1 relative bg-black ${(showParticipants || showChat) ? 'hidden sm:block' : 'block'}`}>
                  <div className="absolute inset-0">
                    <SpeakerLayout participantsBarPosition="bottom" />
                  </div>
                  {/* Call Controls - auto-hiding */}
                  <div className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 w-full max-w-[calc(100vw-2rem)] sm:w-auto px-4 sm:px-0 ${
                    showControls ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
                  }`}>
                    <div className="flex justify-center">
                      <CallControls onLeave={handleLeaveCall} />
                    </div>
                  </div>

                </div>



                {/* Participants Sidebar */}
                {showParticipants && !showChat && (
                  <div className="fixed sm:relative inset-0 sm:inset-auto w-full sm:w-80 xl:w-96 border-l border-white/5 bg-slate-950/98 sm:bg-slate-950/95 backdrop-blur-3xl p-4 sm:p-6 z-40 overflow-y-auto no-scrollbar">

                    <div className="flex items-center justify-between mb-6 sm:mb-10">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 sm:w-5 sm:h-5 text-primary-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Participants</h3>
                      </div>
                      <button 
                        onClick={() => setShowParticipants(false)} 
                        className="text-slate-500 hover:text-white sm:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                    </div>
                    <CallParticipantsList onClose={() => setShowParticipants(false)} />
                </div>
                )}

                {/* Chat Sidebar */}
                {showChat && (
                  <div className="fixed sm:relative inset-0 sm:inset-auto w-full sm:w-80 xl:w-96 border-l border-white/5 bg-slate-950/98 sm:bg-slate-950/95 backdrop-blur-3xl p-4 sm:p-6 z-40 overflow-y-auto no-scrollbar flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Chat</h3>
                      </div>
                      <button
                        onClick={() => setShowChat(false)}
                        className="text-slate-500 hover:text-white sm:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-center">
                      <div>
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                        <h4 className="text-sm font-bold text-slate-400 mb-2">Chat During Call</h4>
                        <p className="text-xs text-slate-600">
                          Coming soon.<br/>Use audio/video for now.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </StreamTheme>

          </StreamCall>
        </StreamVideo>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] bg-slate-950 z-50">
          <div className="relative mb-6 sm:mb-8">
            <Loader2 className="w-20 h-20 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-primary-500 animate-spin" />
            <Activity className="absolute inset-0 m-auto w-8 h-8 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-400 animate-pulse" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-white uppercase tracking-[0.4em] mb-2 sm:mb-3">Connecting</p>
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Initializing secure session</p>
        </div>
      )}

    </div>
  );
}

export default function MeetingRoom() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-slate-950">
        <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
      </div>
    }>
      <MeetingContent />
    </Suspense>
  );
}
