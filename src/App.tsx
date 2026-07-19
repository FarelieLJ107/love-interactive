import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Sparkles, 
  MailOpen, 
  Volume2, 
  VolumeX, 
  X, 
  GraduationCap, 
  HeartHandshake, 
  Smile,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Check,
  Calendar,
  PartyPopper,
  Camera,
  Download,
  Moon,
  Sun,
  Trash2,
  Plus,
  HeartCrack,
  TrendingUp,
  Sparkle,
  CameraOff,
  Image,
  Briefcase,
  Music,
  BookOpen,
  MessageCircle,
  RotateCcw,
  Calculator,
  CheckSquare,
  Square,
  PieChart,
  PlusCircle,
  Gamepad2,
  Flame,
  Video,
  VideoOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell } from 'recharts';
import { LOVE_MESSAGES, SPECIAL_LETTERS, LOVE_LEVELS, SpecialLetter, formatText, DAILY_AFFIRMATIONS } from './data';
import { db, isFirebaseEnabled } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';


interface HeartParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: 'float' | 'pop';
  life: number;
  decay: number;
  swaySpeed?: number;
  swayAmplitude?: number;
  swayOffset?: number;
  emoji?: string;
  isSparkle?: boolean;
}

const heartRainPositions = [
  { id: 1, left: '5%', delay: 0, duration: 12, size: 24, emoji: '❤️' },
  { id: 2, left: '15%', delay: 2, duration: 15, size: 16, emoji: '💖' },
  { id: 3, left: '25%', delay: 4, duration: 10, size: 20, emoji: '💝' },
  { id: 4, left: '35%', delay: 1, duration: 14, size: 28, emoji: '💕' },
  { id: 5, left: '45%', delay: 5, duration: 11, size: 18, emoji: '💗' },
  { id: 6, left: '55%', delay: 3, duration: 16, size: 22, emoji: '🌸' },
  { id: 7, left: '65%', delay: 6, duration: 13, size: 20, emoji: '💖' },
  { id: 8, left: '75%', delay: 2, duration: 12, size: 26, emoji: '❤️' },
  { id: 9, left: '85%', delay: 4, duration: 14, size: 16, emoji: '💝' },
  { id: 10, left: '95%', delay: 1, duration: 11, size: 24, emoji: '💕' },
  { id: 11, left: '10%', delay: 7, duration: 15, size: 20, emoji: '💗' },
  { id: 12, left: '30%', delay: 3, duration: 13, size: 22, emoji: '🌸' },
  { id: 13, left: '50%', delay: 5, duration: 12, size: 18, emoji: '💖' },
  { id: 14, left: '70%', delay: 8, duration: 14, size: 24, emoji: '❤️' },
  { id: 15, left: '90%', delay: 2, duration: 11, size: 16, emoji: '💝' },
];

export default function App() {
  // --- States ---
  const [clickCount, setClickCount] = useState<number>(() => {
    const saved = localStorage.getItem('love_clicks');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [partnerName, setPartnerName] = useState<string>(() => {
    return localStorage.getItem('love_partner_name') || '';
  });
  
  const [senderName, setSenderName] = useState<string>(() => {
    return localStorage.getItem('love_sender_name') || '';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(() => {
    const savedPartner = localStorage.getItem('love_partner_name');
    const savedSender = localStorage.getItem('love_sender_name');
    return !savedPartner || !savedSender;
  });
  
  const [currentMessage, setCurrentMessage] = useState<string>(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      return "Selamat Pagi ☀️! Semoga harimu menyenangkan dan penuh semangat seperti cintaku padamu. Ketuk hati di bawah untuk menerima pesan kejutan manis dari {sender}! 🥰❤️";
    } else if (hour >= 11 && hour < 16) {
      return "Selamat Siang 🌸! Jangan lupa istirahat dan makan siang yang enak ya manis. Aku selalu memikirkanmu! Ketuk hati untuk kejutan penyemangat dari {sender}! 🥰✨";
    } else if (hour >= 16 && hour < 20) {
      return "Selamat Sore 🌇! Senja ini sangat indah, tapi tidak seindah senyumanmu. Terima kasih sudah berjuang hari ini! Ketuk hati untuk pelukan hangat dari {sender}! 💞";
    } else {
      return "Selamat Istirahat/Malam 🌌! Tidur yang nyenyak ya sayang, semoga mimpi indah tentang kita. Ketuk hati di bawah untuk kecupan hangat malam ini dari {sender}! 😴💖";
    }
  });
  
  const [activeLetter, setActiveLetter] = useState<SpecialLetter | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [isHeartBeatingFast, setIsHeartBeatingFast] = useState<boolean>(false);

  // --- MASTER SOUND & PARTICLE THEME & DAILY STREAK STATES ---
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('love_muted') === 'true';
  });
  const [particleTheme, setParticleTheme] = useState<'Default' | 'Fire' | 'Frozen' | 'Galaxy' | 'Golden'>(() => {
    return (localStorage.getItem('love_particle_theme') as any) || 'Default';
  });
  const [dailyStreak, setDailyStreak] = useState<number>(0);

  // --- NEW FEATURE STATES ---
  // Jurnal Cinta
  const [loveJournal, setLoveJournal] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('love_journal');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [journalDate, setJournalDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [journalText, setJournalText] = useState<string>('');
  const [currentJournalYear, setCurrentJournalYear] = useState<number>(new Date().getFullYear());
  const [currentJournalMonth, setCurrentJournalMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Genre Musik Synth-Box
  const [musicGenre, setMusicGenre] = useState<'Romantic' | 'Playful' | 'Calm'>(() => {
    return (localStorage.getItem('love_music_genre') as any) || 'Romantic';
  });

  // Kalkulator Kecocokan Nama
  const [calcName1, setCalcName1] = useState<string>('');
  const [calcName2, setCalcName2] = useState<string>('');
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcMessage, setCalcMessage] = useState<string>('');

  // Heartbeat Shake
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showShakeOverlay, setShowShakeOverlay] = useState<boolean>(false);

  // Full Screen Memory Photo Modal
  const [selectedMemoryPhoto, setSelectedMemoryPhoto] = useState<string | null>(null);

  // Harapan Masa Depan / Bucket List
  const [bucketList, setBucketList] = useState<Array<{ id: string; text: string; completed: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('love_bucket_list');
      return saved ? JSON.parse(saved) : [
        { id: '1', text: 'Liburan romantis ke Bali 🏖️', completed: false },
        { id: '2', text: 'Makan malam romantis pas hujan 🕯️', completed: false },
        { id: '3', text: 'Nonton konser musisi favorit bareng 🎵', completed: false }
      ];
    } catch (e) {
      return [];
    }
  });
  const [newBucketText, setNewBucketText] = useState<string>('');

  // Lagu Tema Hubungan
  const [relationshipSong, setRelationshipSong] = useState<string>(() => {
    return localStorage.getItem('love_relationship_song') || '';
  });

  // Mood/Interaction History for Pie Chart
  const [moodStats, setMoodStats] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('love_mood_stats');
      return saved ? JSON.parse(saved) : {
        'Romantis 💖': 15,
        'Salting 🥰': 12,
        'Kangen 🥺': 8,
        'Happy 🌸': 14,
        'Sedih 🫂': 4
      };
    } catch (e) {
      return {
        'Romantis 💖': 15,
        'Salting 🥰': 12,
        'Kangen 🥺': 8,
        'Happy 🌸': 14,
        'Sedih 🫂': 4
      };
    }
  });

  // New features states
  const [anniversaryDate, setAnniversaryDate] = useState<string>(() => {
    return localStorage.getItem('love_anniversary_date') || '2025-01-01';
  });

  const [countdownTargetDate, setCountdownTargetDate] = useState<string>(() => {
    return localStorage.getItem('love_countdown_target_date') || '';
  });
  const [countdownTargetLabel, setCountdownTargetLabel] = useState<string>(() => {
    return localStorage.getItem('love_countdown_target_label') || 'Anniversary Berikutnya 👑';
  });
  const [countdownTime, setCountdownTime] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    label: string;
  } | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showResetPoinConfirm, setShowResetPoinConfirm] = useState<boolean>(false);

  // Love Letter States
  const [loveLetterMilestone, setLoveLetterMilestone] = useState<string>("Hari Jadi ke-1");
  const [loveLetterStyle, setLoveLetterStyle] = useState<string>("Sangat Romantis & Mendalam");
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [isGeneratingLetter, setIsGeneratingLetter] = useState<boolean>(false);
  const [letterError, setLetterError] = useState<string>("");
  const [copiedLetter, setCopiedLetter] = useState<boolean>(false);

  // Love Quiz States
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    question: string;
    options: Array<string>;
    answerIndex: number;
    explanation: string;
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizError, setQuizError] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);
  const [surpriseMessages, setSurpriseMessages] = useState<Array<{ id: string; date: string; message: string }>>(() => {
    try {
      const saved = localStorage.getItem('love_surprise_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newSurpriseDate, setNewSurpriseDate] = useState<string>('');
  const [newSurpriseText, setNewSurpriseText] = useState<string>('');
  const [activeSurpriseMessage, setActiveSurpriseMessage] = useState<string | null>(null);

  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const [sharedMsgData, setSharedMsgData] = useState<{
    msg: string;
    from: string;
    to: string;
  } | null>(null);

  // New features states for favorites, target, and pool
  const [favoriteMessages, setFavoriteMessages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('love_favorite_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [dailyTargetCelebrated, setDailyTargetCelebrated] = useState<boolean>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`love_daily_target_celebrated_${todayStr}`) === 'true';
  });

  const [showDailyTargetReached, setShowDailyTargetReached] = useState<boolean>(false);

  // --- Target Ciuman States ---
  const [kissTarget, setKissTarget] = useState<number>(() => {
    const saved = localStorage.getItem('love_kiss_target');
    return saved ? parseInt(saved, 10) : 20;
  });

  const [dailyKisses, setDailyKisses] = useState<number>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`love_daily_kisses_${todayStr}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [kissTargetCelebrated, setKissTargetCelebrated] = useState<boolean>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`love_kiss_target_celebrated_${todayStr}`) === 'true';
  });

  const [showKissCelebration, setShowKissCelebration] = useState<boolean>(false);

  // --- Scheduled Time Messages States ---
  const [scheduledTimeMessages, setScheduledTimeMessages] = useState<Array<{ id: string; time: string; message: string }>>(() => {
    try {
      const saved = localStorage.getItem('love_scheduled_time_messages');
      return saved ? JSON.parse(saved) : [
        { id: 's1', time: '08:00', message: 'Selamat pagi sayang! Semoga hari indahmu diawali senyuman manis. ☀️🥰' },
        { id: 's2', time: '13:00', message: 'Selamat siang cintaku! Jangan lupa makan siang ya sayang. 🍱💝' },
        { id: 's3', time: '21:00', message: 'Malam sayang, selamat tidur nyenyak & semoga mimpi indah tentang kita. 🌌😴' }
      ];
    } catch (e) {
      return [];
    }
  });

  const [newSchedTime, setNewSchedTime] = useState<string>('12:00');
  const [newSchedText, setNewSchedText] = useState<string>('');

  const [messagePool, setMessagePool] = useState<string[]>([]);

  // Tema Malam (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('love_dark_mode') === 'true';
  });

  // Hujan Hati (Falling Hearts)
  const [isHeartRainActive, setIsHeartRainActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('love_heart_rain');
    return saved === null ? true : saved === 'true';
  });

  // Statistik Penggunaan (Clicks per day)
  const [dailyStats, setDailyStats] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('love_daily_stats');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Galeri Kenangan
  const [memories, setMemories] = useState<Array<{ id: string; image: string; emoji: string; date: string; type?: 'image' | 'video' }>>(() => {
    try {
      const saved = localStorage.getItem('love_memories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Kamera & Upload Kenangan States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('💖');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [rainType, setRainType] = useState<'Heart' | 'Snow' | 'Leaf'>(() => {
    return (localStorage.getItem('love_rain_type') as any) || 'Heart';
  });
  const [themeChangeTrigger, setThemeChangeTrigger] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<HeartParticle[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicIntervalRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const spawnCounterRef = useRef<number>(0);

  // Calculate and update consecutive days streak
  useEffect(() => {
    const updateStreak = () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const lastDateStr = localStorage.getItem('love_last_interaction_date');
      const currentStreakSaved = localStorage.getItem('love_daily_streak');
      let streak = currentStreakSaved ? parseInt(currentStreakSaved, 10) : 0;

      if (!lastDateStr) {
        // First interaction ever
        streak = 1;
        localStorage.setItem('love_last_interaction_date', todayStr);
        localStorage.setItem('love_daily_streak', '1');
        setDailyStreak(1);
      } else if (lastDateStr !== todayStr) {
        // Check if yesterday was the last interaction
        const lastDate = new Date(lastDateStr);
        const currentDate = new Date(todayStr);
        
        // Difference in milliseconds
        const diffTime = currentDate.getTime() - lastDate.getTime();
        // Convert to days
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Increment streak
          streak += 1;
        } else if (diffDays > 1) {
          // Broken streak, reset to 1
          streak = 1;
        }
        
        localStorage.setItem('love_last_interaction_date', todayStr);
        localStorage.setItem('love_daily_streak', streak.toString());
        setDailyStreak(streak);
      } else {
        // Already interacted today, but if streak is 0, initialize it to 1
        if (streak === 0) {
          streak = 1;
          localStorage.setItem('love_daily_streak', '1');
          setDailyStreak(1);
        } else {
          setDailyStreak(streak);
        }
      }
    };
    
    updateStreak();
  }, []);

  // Load and sync Jurnal Cinta from Firestore if enabled
  useEffect(() => {
    if (isFirebaseEnabled && db) {
      try {
        const colRef = collection(db, "love_journal");
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const journalData: Record<string, string> = {};
          snapshot.forEach((doc) => {
            journalData[doc.id] = doc.data().text || "";
          });
          setLoveJournal(prev => {
            const merged = { ...prev, ...journalData };
            localStorage.setItem('love_journal', JSON.stringify(merged));
            return merged;
          });
        }, (error) => {
          console.error("Firestore sync error:", error);
        });
        return () => unsubscribe();
      } catch (err) {
        console.error("Firestore loading error:", err);
      }
    }
  }, []);

  // Sync rain type preference to localStorage
  useEffect(() => {
    localStorage.setItem('love_rain_type', rainType);
  }, [rainType]);

  // Sync click count to local storage
  useEffect(() => {
    localStorage.setItem('love_clicks', clickCount.toString());
  }, [clickCount]);

  // Sync names to local storage
  useEffect(() => {
    localStorage.setItem('love_partner_name', partnerName);
  }, [partnerName]);

  useEffect(() => {
    localStorage.setItem('love_sender_name', senderName);
  }, [senderName]);

  // Sync anniversary date
  useEffect(() => {
    localStorage.setItem('love_anniversary_date', anniversaryDate);
  }, [anniversaryDate]);

  // Sync clickCount points
  useEffect(() => {
    localStorage.setItem('love_clicks', clickCount.toString());
  }, [clickCount]);

  // Sync Dark Mode state
  useEffect(() => {
    localStorage.setItem('love_dark_mode', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  // Sync Heart Rain state
  useEffect(() => {
    localStorage.setItem('love_heart_rain', isHeartRainActive ? 'true' : 'false');
  }, [isHeartRainActive]);

  // Sync Memories state
  useEffect(() => {
    localStorage.setItem('love_memories', JSON.stringify(memories));
  }, [memories]);

  // Sync Surprise Messages
  useEffect(() => {
    localStorage.setItem('love_surprise_messages', JSON.stringify(surpriseMessages));
  }, [surpriseMessages]);

  // Live Anniversary & Target Countdown Timer
  useEffect(() => {
    const updateCountdown = () => {
      let targetDate: Date;
      let label = countdownTargetLabel || "Anniversary Berikutnya 👑";
      
      if (countdownTargetDate) {
        targetDate = new Date(countdownTargetDate);
      } else {
        // Compute next annual anniversary automatically
        const startDate = new Date(anniversaryDate || '2025-01-01');
        const now = new Date();
        targetDate = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
        if (targetDate.getTime() <= now.getTime()) {
          targetDate.setFullYear(now.getFullYear() + 1);
        }
      }
      
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdownTime({ days: 0, hours: 0, minutes: 0, seconds: 0, label });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setCountdownTime({ days, hours, minutes, seconds, label });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [anniversaryDate, countdownTargetDate, countdownTargetLabel]);

  // Check scheduled surprise messages for today
  useEffect(() => {
    if (surpriseMessages.length === 0) return;
    
    // Get local date key formatted as YYYY-MM-DD
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const match = surpriseMessages.find(m => m.date === todayStr);
    if (match) {
      // Let's check if we already shown this matched surprise message in the current session
      const lastShownId = sessionStorage.getItem(`love_surprise_shown_${match.id}`);
      if (lastShownId !== 'true') {
        setActiveSurpriseMessage(match.message);
        sessionStorage.setItem(`love_surprise_shown_${match.id}`, 'true');
      }
    }
  }, [surpriseMessages]);

  // Load / generate daily affirmation
  useEffect(() => {
    const savedAffirmation = localStorage.getItem('love_daily_affirmation');
    const savedDate = localStorage.getItem('love_daily_affirmation_date');
    const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });

    if (savedAffirmation && savedDate === todayStr) {
      setDailyAffirmation(savedAffirmation);
    } else {
      const randomIndex = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
      const newAffirmation = DAILY_AFFIRMATIONS[randomIndex];
      localStorage.setItem('love_daily_affirmation', newAffirmation);
      localStorage.setItem('love_daily_affirmation_date', todayStr);
      setDailyAffirmation(newAffirmation);
    }
  }, []);

  // Sync new features to local storage
  useEffect(() => {
    localStorage.setItem('love_journal', JSON.stringify(loveJournal));
  }, [loveJournal]);

  useEffect(() => {
    localStorage.setItem('love_music_genre', musicGenre);
  }, [musicGenre]);

  useEffect(() => {
    localStorage.setItem('love_bucket_list', JSON.stringify(bucketList));
  }, [bucketList]);

  useEffect(() => {
    localStorage.setItem('love_relationship_song', relationshipSong);
  }, [relationshipSong]);

  useEffect(() => {
    localStorage.setItem('love_mood_stats', JSON.stringify(moodStats));
  }, [moodStats]);

  useEffect(() => {
    localStorage.setItem('love_favorite_messages', JSON.stringify(favoriteMessages));
  }, [favoriteMessages]);

  // Sync kiss target to local storage
  useEffect(() => {
    localStorage.setItem('love_kiss_target', kissTarget.toString());
  }, [kissTarget]);

  // Sync scheduled messages to local storage
  useEffect(() => {
    localStorage.setItem('love_scheduled_time_messages', JSON.stringify(scheduledTimeMessages));
  }, [scheduledTimeMessages]);

  // Periodically check scheduled messages every 15s to trigger them on current local time
  useEffect(() => {
    const checkScheduledMessages = () => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const matching = scheduledTimeMessages.find(m => m.time === currentHourMin);
      if (matching) {
        setCurrentMessage(prev => {
          if (prev !== matching.message) {
            return matching.message;
          }
          return prev;
        });
      }
    };

    checkScheduledMessages();
    const interval = setInterval(checkScheduledMessages, 15000);
    return () => clearInterval(interval);
  }, [scheduledTimeMessages]);

  // Sync Jurnal Cinta current text when active date changes
  useEffect(() => {
    setJournalText(loveJournal[journalDate] || '');
  }, [journalDate, loveJournal]);

  // Parse custom shared messages from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    const from = params.get('from');
    const to = params.get('to');
    if (msg) {
      setSharedMsgData({
        msg,
        from: from || '',
        to: to || ''
      });
      if (to) setPartnerName(to);
      if (from) setSenderName(from);
    }
  }, []);

  // --- MASTER SOUND MUTE ACTION ---
  const toggleMuteAll = () => {
    setIsMuted(prev => {
      const nextVal = !prev;
      localStorage.setItem('love_muted', nextVal ? 'true' : 'false');
      if (nextVal) {
        // Stop currently playing background music immediately
        if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current);
          musicIntervalRef.current = null;
        }
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch (e){}
          audioCtxRef.current = null;
        }
        setIsMusicPlaying(false);
      }
      return nextVal;
    });
  };

  // --- Sound Effects Synthesizer ---
  const playSweetPop = () => {
    if (isMuted) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      // Create and resume context
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      // Pentatonic scales for a lovely sweet chime sound
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      
      // Introduce subtle randomized pitch variation for high interactivity feel
      const detuneFactor = 0.94 + Math.random() * 0.12; // multiplier between 0.94 and 1.06
      osc.frequency.setValueAtTime(randomNote * detuneFactor, ctx.currentTime);
      
      // Plucky volume curve
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  // Cute kiss sound effect synthesis
  const playKissSound = () => {
    if (isMuted) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      // Fast sweeping frequency for a sweet puckering sound
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.13);
      
      // Plucky short amplitude envelope
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  // --- Favorite Messages Helpers ---
  const isFavorited = (msg: string) => favoriteMessages.includes(msg);
  const toggleFavoriteMessage = (msg: string) => {
    setFavoriteMessages(prev => {
      const isFav = prev.includes(msg);
      const updated = isFav ? prev.filter(m => m !== msg) : [...prev, msg];
      playSweetPop();
      return updated;
    });
  };

  // --- Particle Theme Rain Emoji Helper ---
  const getRainEmoji = (baseEmoji: string) => {
    if (particleTheme === 'Fire') {
      const fireEmojis = ['🔥', '⚡', '💥', '🔴', '🟠'];
      return fireEmojis[baseEmoji.charCodeAt(0) % fireEmojis.length];
    } else if (particleTheme === 'Frozen') {
      const frozenEmojis = ['❄️', '🧊', '💎', '🤍', '⭐'];
      return frozenEmojis[baseEmoji.charCodeAt(0) % frozenEmojis.length];
    } else if (particleTheme === 'Galaxy') {
      const galaxyEmojis = ['⭐', '🌌', '🌠', '🪐', '💫'];
      return galaxyEmojis[baseEmoji.charCodeAt(0) % galaxyEmojis.length];
    } else if (particleTheme === 'Golden') {
      const goldenEmojis = ['👑', '✨', '⭐', '🪙', '💛'];
      return goldenEmojis[baseEmoji.charCodeAt(0) % goldenEmojis.length];
    }
    return baseEmoji;
  };

  const getRainTypeEmoji = (heart: { id: string | number; emoji: string }) => {
    // Parse numeric parts of id safely to prevent NaN issues
    const numericId = typeof heart.id === 'number' ? heart.id : (parseInt(heart.id.replace(/\D/g, ''), 10) || 0);
    if (rainType === 'Snow') {
      const snowEmojis = ['❄️', '🌨️', '⛄', '🤍', '❄️'];
      return snowEmojis[numericId % snowEmojis.length];
    } else if (rainType === 'Leaf') {
      const leafEmojis = ['🍁', '🍂', '🍃', '🌿', '🌾'];
      return leafEmojis[numericId % leafEmojis.length];
    }
    return getRainEmoji(heart.emoji);
  };

  // --- Background Synthesizer Music (Sweet Music Box) ---
  const toggleMusic = (overrideGenre?: 'Romantic' | 'Playful' | 'Calm') => {
    if (isMuted && !isMusicPlaying) {
      setIsMuted(false);
      localStorage.setItem('love_muted', 'false');
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const activeGenre = overrideGenre || musicGenre;

    // A dreamy music-box scales based on genre
    let melody: number[] = [];
    let tempo = 380; // milliseconds per step

    if (activeGenre === 'Playful') {
      tempo = 240; // faster
      melody = [
        523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51,
        1567.98, 1760.00, 1318.51, 1046.50, 880.00, 783.99, 659.25, 587.33
      ];
    } else if (activeGenre === 'Calm') {
      tempo = 680; // slower, ambient
      melody = [
        196.00, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99,
        880.00, 987.77, 783.99, 659.25, 523.25, 440.00, 392.00, 329.63
      ];
    } else {
      // Romantic (Default)
      tempo = 380;
      melody = [
        523.25, 659.25, 783.99, 987.77, // C Maj7
        440.00, 523.25, 659.25, 880.00, // A min7
        349.23, 523.25, 698.46, 880.00, // F Maj7
        392.00, 587.33, 783.99, 987.77, // G7
        659.25, 783.99, 987.77, 1318.51,// High E min7
        587.33, 698.46, 880.00, 1174.66 // High D min7
      ];
    }

    if (isMusicPlaying && !overrideGenre) {
      // FADE-OUT before stopping music loop
      const ctx = audioCtxRef.current;
      const masterGain = masterGainRef.current;
      if (ctx && masterGain) {
        try {
          masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
          masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.0); // 1.0s fade out
        } catch (e) {
          console.warn("Fade out error:", e);
        }
      }

      // Complete cleanup after fade-out duration
      setTimeout(() => {
        if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current);
          musicIntervalRef.current = null;
        }
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch (e){}
          audioCtxRef.current = null;
        }
        setIsMusicPlaying(false);
      }, 1000);
    } else {
      // If overriding genres, fade out previous context first
      if (audioCtxRef.current && masterGainRef.current && overrideGenre) {
        const prevCtx = audioCtxRef.current;
        const prevMaster = masterGainRef.current;
        try {
          prevMaster.gain.setValueAtTime(prevMaster.gain.value, prevCtx.currentTime);
          prevMaster.gain.linearRampToValueAtTime(0.0001, prevCtx.currentTime + 0.4);
        } catch (e){}
        if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
        setTimeout(() => {
          try { prevCtx.close(); } catch (e){}
        }, 450);
      } else {
        if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch (e){}
        }
      }

      // Start the music loop with an optional transition delay if overriding
      const startDelay = overrideGenre ? 500 : 0;
      setTimeout(() => {
        try {
          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;
          setIsMusicPlaying(true);

          const masterGain = ctx.createGain();
          masterGainRef.current = masterGain;
          masterGain.connect(ctx.destination);

          // FADE-IN master volume curve
          masterGain.gain.setValueAtTime(0, ctx.currentTime);
          masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 1.2); // 1.2s smooth fade in

          let step = 0;

          musicIntervalRef.current = setInterval(() => {
            if (ctx.state === 'suspended') {
              ctx.resume();
            }
            
            const noteHz = melody[step % melody.length];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(masterGain); // Connect to master gain instead of direct destination

            // sine wave is the purest and sounds exactly like a music box
            osc.type = 'sine';
            osc.frequency.setValueAtTime(noteHz, ctx.currentTime);

            // Music box envelope: instant attack, long crystal-like decay
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (tempo * 4 / 1000));

            osc.start();
            osc.stop(ctx.currentTime + (tempo * 4 / 1000));

            step++;
          }, tempo); // dynamic speed of melody

        } catch (e) {
          console.warn("Failed to initialize background music:", e);
        }
      }, startDelay);
    }
  };

  // Cleanup synthesizer on unmount
  useEffect(() => {
    return () => {
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // --- Canvas Particle Animation Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize Canvas handler
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Spawning floating hearts occasionally
      spawnCounterRef.current++;
      if (spawnCounterRef.current >= 15) {
        spawnCounterRef.current = 0;
        
        let pColor = '';
        let pEmoji: string | undefined = undefined;
        let pSparkle = false;

        if (particleTheme === 'Fire') {
          const colors = [
            'rgba(255, 69, 0, 0.5)',   // Orange-Red
            'rgba(255, 140, 0, 0.5)',  // Dark Orange
            'rgba(255, 99, 71, 0.5)',   // Tomato
            'rgba(255, 215, 0, 0.45)',  // Gold
            'rgba(239, 68, 68, 0.5)'    // Red
          ];
          pColor = colors[Math.floor(Math.random() * colors.length)];
          const emojis = ['🔥', '✨', '⚡', '💥', '🔴', '🟠'];
          if (Math.random() < 0.35) {
            pEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          } else {
            pSparkle = true;
          }
        } else if (particleTheme === 'Frozen') {
          const colors = [
            'rgba(173, 216, 230, 0.55)', // Light Blue
            'rgba(240, 248, 255, 0.65)', // Alice Blue
            'rgba(135, 206, 250, 0.55)', // Light Sky Blue
            'rgba(224, 255, 255, 0.5)',  // Light Cyan
            'rgba(0, 191, 255, 0.45)'    // Deep Sky Blue
          ];
          pColor = colors[Math.floor(Math.random() * colors.length)];
          const emojis = ['❄️', '🧊', '💎', '🤍', '⭐'];
          if (Math.random() < 0.35) {
            pEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          } else {
            pSparkle = true;
          }
        } else if (particleTheme === 'Galaxy') {
          const colors = [
            'rgba(138, 43, 226, 0.55)',  // Blue Violet
            'rgba(75, 0, 130, 0.5)',     // Indigo
            'rgba(186, 85, 211, 0.55)',  // Medium Orchid
            'rgba(255, 0, 255, 0.45)',   // Magenta
            'rgba(0, 255, 255, 0.45)'    // Cyan
          ];
          pColor = colors[Math.floor(Math.random() * colors.length)];
          const emojis = ['⭐', '🌌', '🌠', '🚀', '🪐', '💫'];
          if (Math.random() < 0.4) {
            pEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          } else {
            pSparkle = true;
          }
        } else if (particleTheme === 'Golden') {
          const colors = [
            'rgba(212, 175, 55, 0.6)',   // Golden Metallic
            'rgba(255, 215, 0, 0.6)',    // Gold
            'rgba(243, 229, 171, 0.55)', // Amber/Cream
            'rgba(218, 165, 32, 0.55)',  // Goldenrod
            'rgba(255, 223, 0, 0.5)'     // Bright Gold
          ];
          pColor = colors[Math.floor(Math.random() * colors.length)];
          const emojis = ['👑', '✨', '🏆', '⭐', '🪙', '💛'];
          if (Math.random() < 0.35) {
            pEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          } else {
            pSparkle = true;
          }
        } else {
          // Default
          const colors = [
            'rgba(244, 63, 94, 0.45)',  // rose 500
            'rgba(236, 72, 153, 0.45)', // pink 500
            'rgba(251, 113, 133, 0.4)', // rose 400
            'rgba(244, 114, 182, 0.4)', // pink 400
            'rgba(253, 164, 175, 0.35)',// rose 300
            'rgba(251, 207, 232, 0.35)' // pink 200
          ];
          pColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 30,
          size: Math.random() * 12 + 8,
          color: pColor,
          opacity: Math.random() * 0.4 + 0.3,
          vx: 0,
          vy: -(Math.random() * 1.0 + 0.5), // upwards velocity
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          type: 'float',
          life: 1,
          decay: Math.random() * 0.002 + 0.001,
          swaySpeed: Math.random() * 0.015 + 0.005,
          swayAmplitude: Math.random() * 20 + 10,
          swayOffset: Math.random() * Math.PI * 2,
          emoji: pEmoji,
          isSparkle: pSparkle
        });
      }

      // 2. Draw & Update all particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= p.decay;
        if (p.life <= 0) return false;

        if (p.type === 'float') {
          // Floating behavior: slide upwards and sway sideways
          p.y += p.vy;
          const time = Date.now();
          const offset = Math.sin(time * (p.swaySpeed || 0.01) + (p.swayOffset || 0)) * (p.swayAmplitude || 10) * 0.02;
          p.x += offset;
          p.rotation += p.rotationSpeed;
          
          // Fade as it nears the top
          if (p.y < 120) {
            p.opacity = Math.max(0, p.opacity - 0.015);
          }
        } else {
          // Burst/Pop behavior: physics-based dispersion
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12; // mild gravity pulling them down
          p.vx *= 0.98; // air friction
          p.vy *= 0.98;
          p.rotation += p.rotationSpeed;
          p.opacity = p.life; // fade perfectly matching life decay
        }

        // Draw Heart, Emoji, or Sparkle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        
        if (p.emoji) {
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji, 0, 0);
        } else if (p.isSparkle) {
          // Beautiful 4-pointed flare star sparkle
          const scale = p.size / 24;
          ctx.scale(scale, scale);
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.moveTo(0, -12);
          ctx.quadraticCurveTo(0, 0, 12, 0);
          ctx.quadraticCurveTo(0, 0, 0, 12);
          ctx.quadraticCurveTo(0, 0, -12, 0);
          ctx.quadraticCurveTo(0, 0, 0, -12);
          ctx.closePath();
          ctx.fill();
        } else {
          // Base scale 30px
          const scale = p.size / 30;
          ctx.scale(scale, scale);
          
          ctx.beginPath();
          ctx.fillStyle = p.color;
          
          // Symmetrical Heart Path
          ctx.moveTo(0, -8);
          ctx.bezierCurveTo(-5, -22, -22, -22, -22, -5);
          ctx.bezierCurveTo(-22, 10, -8, 20, 0, 28);
          ctx.bezierCurveTo(8, 20, 22, 10, 22, -5);
          ctx.bezierCurveTo(22, -22, 5, -22, 0, -8);
          
          ctx.fill();
        }
        
        ctx.restore();

        return p.opacity > 0;
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Trigger a smooth transition flash / burst when theme changes
  useEffect(() => {
    if (themeChangeTrigger > 0) {
      triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      setThemeChangeTrigger(1);
    }
  }, [particleTheme]);

  // --- Touch & Click Handlers ---
  const triggerBurst = (clientX: number, clientY: number, customEmoji?: string) => {
    const burstCount = 14 + Math.floor(Math.random() * 6);
    const burstParticles: HeartParticle[] = [];
    
    // Play plucky synth
    playSweetPop();

    const colors = [
      '#f43f5e', // rose 500
      '#ec4899', // pink 500
      '#db2777', // pink 600
      '#e11d48', // rose 600
      '#fda4af', // rose 300
      '#f472b6', // pink 400
      '#ff8ea9',
      '#ffadc3'
    ];

    let finalColors = colors;
    let themeEmoji: string | undefined = customEmoji;
    let isSparkle = false;

    if (!customEmoji) {
      if (particleTheme === 'Fire') {
        finalColors = ['#ff4500', '#ff8c00', '#ff3300', '#ffd700', '#ef4444'];
        const emojis = ['🔥', '⚡', '💥', '🔴', '🟠'];
        if (Math.random() < 0.4) {
          themeEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        } else {
          isSparkle = true;
        }
      } else if (particleTheme === 'Frozen') {
        finalColors = ['#add8e6', '#f0f8ff', '#87cefa', '#e0ffff', '#00bfff'];
        const emojis = ['❄️', '🧊', '💎', '🤍', '⭐'];
        if (Math.random() < 0.4) {
          themeEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        } else {
          isSparkle = true;
        }
      } else if (particleTheme === 'Galaxy') {
        finalColors = ['#8a2be2', '#4b0082', '#ba55d3', '#ff00ff', '#00ffff'];
        const emojis = ['⭐', '🌠', '🪐', '💫', '🌌'];
        if (Math.random() < 0.4) {
          themeEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        } else {
          isSparkle = true;
        }
      } else if (particleTheme === 'Golden') {
        finalColors = ['#d4af37', '#ffd700', '#f3e5ab', '#daa520', '#ffdf00'];
        const emojis = ['👑', '✨', '⭐', '🪙', '💛'];
        if (Math.random() < 0.4) {
          themeEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        } else {
          isSparkle = true;
        }
      }
    }

    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 2.5; // push velocity
      
      burstParticles.push({
        x: clientX,
        y: clientY,
        size: Math.random() * 11 + 6,
        color: finalColors[Math.floor(Math.random() * finalColors.length)],
        opacity: 1.0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.0, // slight vertical jet stream
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        type: 'pop',
        life: 1.0,
        decay: Math.random() * 0.024 + 0.014,
        emoji: themeEmoji,
        isSparkle: isSparkle
      });
    }

    particlesRef.current = [...particlesRef.current, ...burstParticles];
  };

  // Pointer down captures both clicks and touches in absolute coordinates
  const handlePagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only fire from clicks/taps directly on backdrop or specific structural areas,
    // to avoid interference with button click interactions
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.prevent-burst')) {
      return;
    }
    triggerBurst(e.clientX, e.clientY);
  };

  // --- Main Heart Click Action ---
  const handleHeartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // prevent triggering double bursts
    
    // Subtle Vibration API tactile feedback
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60); // 60ms gentle pulse vibration
      }
    } catch (err) {
      console.warn("Vibration API not supported:", err);
    }

    // 1. Spontaneous Heart Burst centered on the button
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Play sweet kiss sound and trigger 💋 burst particles!
    playKissSound();
    triggerBurst(centerX, centerY, '💋');

    // 2. Increment interaction points
    setClickCount(prev => {
      const nextVal = prev + 1;
      if (nextVal > 0 && nextVal % 50 === 0) {
        setIsShaking(true);
        setShowShakeOverlay(true);
        setTimeout(() => setIsShaking(false), 1000);
      }
      return nextVal;
    });

    // Update daily stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayClicks = (dailyStats[todayStr] || 0) + 1;
    const updatedStats = { ...dailyStats, [todayStr]: todayClicks };
    setDailyStats(updatedStats);
    localStorage.setItem('love_daily_stats', JSON.stringify(updatedStats));

    // Update and check daily kisses (Target Ciuman)
    setDailyKisses(prev => {
      const nextVal = prev + 1;
      localStorage.setItem(`love_daily_kisses_${todayStr}`, nextVal.toString());

      if (nextVal >= kissTarget && !kissTargetCelebrated) {
        setKissTargetCelebrated(true);
        localStorage.setItem(`love_kiss_target_celebrated_${todayStr}`, 'true');
        setShowKissCelebration(true);

        // Fun and cute kissing bursts celebration!
        triggerConfetti();
        setTimeout(() => {
          triggerBurst(centerX - 100, centerY - 80, '💋');
          triggerBurst(centerX + 100, centerY - 80, '💋');
        }, 200);
      }
      return nextVal;
    });

    // Check for daily click target completion (Target is 15 clicks)
    const DAILY_TARGET = 15;
    if (todayClicks >= DAILY_TARGET && !dailyTargetCelebrated) {
      setDailyTargetCelebrated(true);
      localStorage.setItem(`love_daily_target_celebrated_${todayStr}`, 'true');
      setShowDailyTargetReached(true);
      
      // Massive confetti shower celebration
      triggerConfetti();
      setTimeout(triggerConfetti, 250);
      setTimeout(triggerConfetti, 500);
    }

    // Increments mood stats in real-time for Recharts Pie Chart representation
    const categories = ['Romantis 💖', 'Salting 🥰', 'Kangen 🥺', 'Happy 🌸', 'Sedih 🫂'];
    const selectedMood = categories[Math.floor(Math.random() * categories.length)];
    setMoodStats(prev => {
      const updated = {
        ...prev,
        [selectedMood]: (prev[selectedMood] || 0) + 1
      };
      return updated;
    });

    // 3. Select a new random love message adjusted to time of day & guaranteed different from current
    let coreMsg = currentMessage;
    const cleanCurrent = currentMessage
      .replace(/^Selamat Pagi ☀️ /, "")
      .replace(/^Selamat Siang 🌸 /, "")
      .replace(/^Selamat Sore 🌇 /, "")
      .replace(/^Selamat Istirahat\/Malam 🌌 /, "")
      .replace(/^Pagi Sayang ☀️! /, "")
      .replace(/^Siang Manis 🌸! /, "")
      .replace(/^Sore Cinta 🌇! /, "")
      .replace(/^Malam & Istirahat Sayang 🌌! /, "");

    const filtered = LOVE_MESSAGES.filter(m => m !== cleanCurrent);
    if (filtered.length > 0) {
      coreMsg = filtered[Math.floor(Math.random() * filtered.length)];
    }

    // Select prefix greeting according to the local hour of the day
    const hour = new Date().getHours();
    let prefix = '';
    if (hour >= 4 && hour < 11) {
      prefix = 'Selamat Pagi ☀️ ';
    } else if (hour >= 11 && hour < 16) {
      prefix = 'Selamat Siang 🌸 ';
    } else if (hour >= 16 && hour < 20) {
      prefix = 'Selamat Sore 🌇 ';
    } else {
      prefix = 'Selamat Istirahat/Malam 🌌 ';
    }

    setCurrentMessage(prefix + coreMsg);

    // 4. Temporarily speed up heartbeat pulse
    setIsHeartBeatingFast(true);
    setTimeout(() => setIsHeartBeatingFast(false), 1200);
  };

  // --- Confetti Explosion of Emoji Hearts ---
  const triggerConfetti = () => {
    playSweetPop();
    
    // Vibration for confetti
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 40, 50]);
      }
    } catch (e) {}

    const confettiCount = 35 + Math.floor(Math.random() * 15);
    const newParticles: HeartParticle[] = [];
    const heartEmojis = ['💖', '❤️', '💗', '💓', '💝', '💕', '💘', '🌸', '✨', '💜', '💛', '🥰'];
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : window.innerWidth;
    const height = canvas ? canvas.height : window.innerHeight;

    for (let i = 0; i < confettiCount; i++) {
      // dispersed horizontal positions
      const spawnX = width * (0.15 + Math.random() * 0.7);
      const spawnY = height + 20;

      // upwards cone angle
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = Math.random() * 7 + 6;

      newParticles.push({
        x: spawnX,
        y: spawnY,
        size: Math.random() * 15 + 18,
        color: '#ff69b4',
        opacity: 1.0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        type: 'pop',
        life: 1.0,
        decay: Math.random() * 0.012 + 0.008,
        emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)]
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // --- Generate Share Link and Text Snippet ---
  const handleShare = () => {
    const pName = partnerName.trim() || 'Sayang';
    const sName = senderName.trim() || 'Aku';
    const formattedMsg = formatText(currentMessage, partnerName, senderName);
    
    // Construct sharing URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(formattedMsg)}&from=${encodeURIComponent(sName)}&to=${encodeURIComponent(pName)}`;
    
    // Snazzy text snippet
    const textToCopy = `💖 Pesan Cinta Spesial dari ${sName} untuk ${pName}:\n\n"${formattedMsg}"\n\nBuka halaman cinta interaktif kita di sini: ${shareUrl}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      playSweetPop();
      
      // Heart burst at center on copy
      triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
    }).catch(err => {
      console.error("Copy failed", err);
    });
  };

  // --- Download Message as a souvenir postcard Image ---
  const downloadLoveMessageAsImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pName = partnerName.trim() || 'Sayang';
    const sName = senderName.trim() || 'Aku';
    const formattedMsg = formatText(currentMessage, partnerName, senderName);

    // 1. Background Gradient
    let grad = ctx.createLinearGradient(0, 0, 800, 600);
    if (isDarkMode) {
      // Deep Purple & Gold theme gradient
      grad.addColorStop(0, '#13091e');
      grad.addColorStop(0.5, '#1e112a');
      grad.addColorStop(1, '#2c153c');
    } else {
      // Soft Rose & Peach theme gradient
      grad.addColorStop(0, '#FFF0F5'); // LavenderBlush
      grad.addColorStop(0.5, '#FFE4E1'); // MistyRose
      grad.addColorStop(1, '#FFD1DC'); // Light Pink
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // 2. Beautiful borders
    ctx.lineWidth = 14;
    ctx.strokeStyle = isDarkMode ? '#d4af37' : '#ffb6c1'; // Gold vs Soft Pink
    ctx.strokeRect(15, 15, 770, 570);

    ctx.lineWidth = 2;
    ctx.strokeStyle = isDarkMode ? '#f3e5ab' : '#ffffff'; // Pale Gold vs White
    ctx.strokeRect(28, 28, 744, 544);

    // Corner decorative heart symbols
    const drawCornerHeart = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.8, 0.8);
      ctx.beginPath();
      ctx.fillStyle = isDarkMode ? '#d4af37' : '#ff69b4';
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(-4, -16, -16, -16, -16, -4);
      ctx.bezierCurveTo(-16, 8, -6, 16, 0, 22);
      ctx.bezierCurveTo(6, 16, 16, 8, 16, -4);
      ctx.bezierCurveTo(16, -16, 4, -16, 0, -6);
      ctx.fill();
      ctx.restore();
    };

    drawCornerHeart(55, 55);
    drawCornerHeart(745, 55);
    drawCornerHeart(55, 545);
    drawCornerHeart(745, 545);

    // 3. Header Text
    ctx.textAlign = 'center';
    ctx.fillStyle = isDarkMode ? '#d4af37' : '#db2777';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('💌 PESAN CINTA SPESIAL 💌', 400, 90);

    // Subtitle / Date
    ctx.fillStyle = isDarkMode ? '#f3e5ab' : '#8b5e83';
    ctx.font = 'italic 15px sans-serif';
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(dateStr, 400, 120);

    // Draw horizontal separator
    ctx.strokeStyle = isDarkMode ? 'rgba(212, 175, 55, 0.3)' : 'rgba(219, 39, 119, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 145);
    ctx.lineTo(600, 145);
    ctx.stroke();

    // 4. "Untuk: Sayang"
    ctx.fillStyle = isDarkMode ? '#f3e5ab' : '#5d3f6a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Untuk: ${pName} 💞`, 400, 190);

    // 5. Message Body (with word wrapping)
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#2d153c';
    ctx.font = 'italic 18px sans-serif';
    
    const words = formattedMsg.split(' ');
    let line = '';
    const lines: string[] = [];
    const maxWidth = 560;
    const lineHeight = 28;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw lines centered
    let startY = 240;
    startY = startY + (150 - (lines.length * lineHeight)) / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].trim(), 400, startY + (i * lineHeight));
    }

    // 6. Draw separator before signature
    ctx.beginPath();
    ctx.moveTo(250, 440);
    ctx.lineTo(550, 440);
    ctx.stroke();

    // 7. Signature / "Dari: Aku"
    ctx.fillStyle = isDarkMode ? '#d4af37' : '#ff1493';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Dengan Sejuta Cinta,`, 400, 480);
    
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#5d3f6a';
    ctx.font = 'bold italic 22px serif';
    ctx.fillText(`${sName} ❤️`, 400, 515);

    // Footer info
    ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(139, 94, 131, 0.6)';
    ctx.font = '11px sans-serif';
    ctx.fillText('Halaman Cinta Interaktif Kita ✨', 400, 555);

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Pesan-Cinta-${pName}.png`;
    link.href = dataUrl;
    link.click();

    // Sound effect
    playSweetPop();

    // Heart burst at center on copy/download
    triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
  };

  // --- Dismiss Shared Overlay and Clean URL ---
  const handleDismissShared = () => {
    setSharedMsgData(null);
    if (window.history.pushState) {
      const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path: newurl}, '', newurl);
    }
  };

  // --- Camera & Memory Gallery Functions ---
  const startCamera = async () => {
    setIsCameraActive(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 400, height: 400 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const video = videoRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

        // Draw overlay emoji
        ctx.font = '64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedEmoji, 340, 340);

        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        setCapturedType('image');
        stopCamera();
        playSweetPop();
      }
    }
  };

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      chunksRef.current = [];
      try {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setCapturedPhoto(base64data);
            setCapturedType('video');
          };
          reader.readAsDataURL(blob);
          setIsRecordingVideo(false);
          stopCamera();
          playSweetPop();
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecordingVideo(true);
        playSweetPop();

        // Limit recording to 5 seconds to manage localStorage limit
        setTimeout(() => {
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
        }, 5000);
      } catch (err) {
        console.error("Gagal merekam video:", err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      if (file.type.startsWith('video/')) {
        reader.onload = (event) => {
          setCapturedPhoto(event.target?.result as string);
          setCapturedType('video');
          playSweetPop();
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const size = Math.min(img.width, img.height);
              const startX = (img.width - size) / 2;
              const startY = (img.height - size) / 2;
              ctx.drawImage(img, startX, startY, size, size, 0, 0, 400, 400);

              // Draw overlay emoji
              ctx.font = '64px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(selectedEmoji, 340, 340);

              const dataUrl = canvas.toDataURL('image/jpeg');
              setCapturedPhoto(dataUrl);
              setCapturedType('image');
              playSweetPop();
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const saveMemory = () => {
    if (capturedPhoto) {
      const newMemory = {
        id: Date.now().toString(),
        image: capturedPhoto,
        emoji: selectedEmoji,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: capturedType
      };
      setMemories(prev => [newMemory, ...prev]);
      setCapturedPhoto(null);
      setCapturedType('image');
      playSweetPop();
      triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    playSweetPop();
  };

  const handleResetAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
    setClickCount(0);
    setPartnerName('');
    setSenderName('');
    setAnniversaryDate('2025-01-01');
    setMemories([]);
    setDailyStats({});
    setSurpriseMessages([]);
    setIsDarkMode(false);
    setIsHeartRainActive(true);
    setShowResetConfirm(false);
    
    // Reset newly introduced feature states
    setLoveJournal({});
    setBucketList([]);
    setRelationshipSong('');
    setFavoriteMessages([]);
    setDailyTargetCelebrated(false);
    setDailyKisses(0);
    setKissTargetCelebrated(false);
    setDailyStreak(1);
    setMoodStats({
      'Romantis 💖': 15,
      'Salting 🥰': 12,
      'Kangen 🥺': 8,
      'Happy 🌸': 14,
      'Sedih 🫂': 4
    });
    
    // Select a fresh initial message
    const hour = new Date().getHours();
    let initialGreeting = '';
    if (hour >= 4 && hour < 11) {
      initialGreeting = "Selamat Pagi ☀️! Semoga harimu menyenangkan dan penuh semangat seperti cintaku padamu. Ketuk hati di bawah untuk menerima pesan kejutan manis dari {sender}! 🥰❤️";
    } else if (hour >= 11 && hour < 16) {
      initialGreeting = "Selamat Siang 🌸! Jangan lupa istirahat dan makan siang yang enak ya manis. Aku selalu memikirkanmu! Ketuk hati untuk kejutan penyemangat dari {sender}! 🥰✨";
    } else if (hour >= 16 && hour < 20) {
      initialGreeting = "Selamat Sore 🌇! Senja ini sangat indah, tapi tidak seindah senyumanmu. Terima kasih sudah berjuang hari ini! Ketuk hati untuk pelukan hangat dari {sender}! 💞";
    } else {
      initialGreeting = "Selamat Istirahat/Malam 🌌! Tidur yang nyenyak ya sayang, semoga mimpi indah tentang kita. Ketuk hati di bawah untuk kecupan hangat malam ini dari {sender}! 😴💖";
    }
    setCurrentMessage(initialGreeting);
    
    // Reload affirmation or generate new one
    const randomIndex = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    const newAffirmation = DAILY_AFFIRMATIONS[randomIndex];
    setDailyAffirmation(newAffirmation);
    
    setIsSettingsOpen(true);
    playSweetPop();
  };

  const getLast7DaysStats = () => {
    const statsList: Array<{ date: string; displayDate: string; clicks: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      statsList.push({
        date: dateKey,
        displayDate,
        clicks: dailyStats[dateKey] || 0
      });
    }
    return statsList;
  };

  // --- Calculate Days Together ---
  const daysTogether = (() => {
    if (!anniversaryDate) return 1;
    const anniv = new Date(anniversaryDate);
    const now = new Date();
    anniv.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - anniv.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  })();

  // --- Game Mechanics & Levels ---
  const currentLevel = (() => {
    let active = LOVE_LEVELS[0];
    for (const lvl of LOVE_LEVELS) {
      if (clickCount >= lvl.clicks) {
        active = lvl;
      }
    }
    return active;
  })();

  const nextLevel = (() => {
    const currentIndex = LOVE_LEVELS.indexOf(currentLevel);
    if (currentIndex < LOVE_LEVELS.length - 1) {
      return LOVE_LEVELS[currentIndex + 1];
    }
    return null;
  })();

  const progressPercentage = (() => {
    if (!nextLevel) return 100;
    const segmentTotal = nextLevel.clicks - currentLevel.clicks;
    const segmentProgress = clickCount - currentLevel.clicks;
    return Math.min(100, Math.max(0, (segmentProgress / segmentTotal) * 100));
  })();

  // Icon selector helper for Special Letters
  const renderLetterIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-rose-500" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-rose-500" />;
      default:
        return <MailOpen className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div 
      className={`min-h-screen relative overflow-x-hidden font-sans select-none flex flex-col justify-between p-4 md:p-6 transition-colors duration-500 ${
        isDarkMode ? 'text-[#f3e5ab]' : 'text-[#5D3F6A]'
      } ${isShaking ? 'heartbeat-shake-active' : ''}`}
      style={{
        background: isDarkMode 
          ? 'radial-gradient(circle at 50% 50%, #150921 0%, #08030d 100%)' 
          : 'radial-gradient(circle at 50% 50%, #FFF0F5 0%, #FFE4E1 100%)'
      }}
      onPointerDown={handlePagePointerDown}
      id="main-container"
    >
      <style>{`
        @keyframes heartbeat-shake {
          0% { transform: scale(1) translate(0, 0); }
          15% { transform: scale(1.02) translate(-3px, -2px); }
          30% { transform: scale(0.98) translate(3px, 2px); }
          45% { transform: scale(1.01) translate(-2px, 3px); }
          60% { transform: scale(0.99) translate(2px, -3px); }
          75% { transform: scale(1.01) translate(-2px, 2px); }
          90% { transform: scale(0.99) translate(1px, 1px); }
          100% { transform: scale(1) translate(0, 0); }
        }
        .heartbeat-shake-active {
          animation: heartbeat-shake 0.8s ease-in-out;
        }

        @keyframes dramatic-heartbeat {
          0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4)); }
          14% { transform: scale(1.18); filter: drop-shadow(0 0 25px rgba(236, 72, 153, 0.85)); }
          28% { transform: scale(1.03); filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.5)); }
          42% { transform: scale(1.24); filter: drop-shadow(0 0 32px rgba(244, 63, 94, 0.95)); }
          70% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4)); }
        }
        .animate-dramatic-heartbeat {
          animation: dramatic-heartbeat 0.75s infinite ease-in-out;
        }
      `}</style>

      {/* Immersive Atmospheric Glowing Blobs */}
      <div className={`absolute top-[-100px] left-[-100px] w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full opacity-30 blur-[100px] pointer-events-none transition-all duration-700 ${
        isDarkMode ? 'bg-[#9d4edd] opacity-20' : 'bg-[#FFB6C1]'
      }`} />
      <div className={`absolute bottom-[-150px] right-[-100px] w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full opacity-35 blur-[120px] pointer-events-none transition-all duration-700 ${
        isDarkMode ? 'bg-[#d4af37] opacity-15' : 'bg-[#E0BFB8]'
      }`} />

      {/* Frame Border Aesthetic */}
      <div className={`absolute inset-3 md:inset-5 border rounded-[32px] md:rounded-[40px] pointer-events-none z-30 transition-colors duration-500 ${
        isDarkMode ? 'border-[#d4af37]/20' : 'border-white/40'
      }`} />

      {/* Scattered Subtle Static Hearts for Depth */}
      <div className={`absolute top-24 left-[12%] text-2xl pointer-events-none transition-colors duration-500 ${isDarkMode ? 'text-[#d4af37]/20' : 'text-pink-300/40'}`}>♥</div>
      <div className={`absolute top-48 right-[18%] text-xl pointer-events-none transition-colors duration-500 ${isDarkMode ? 'text-[#d4af37]/15' : 'text-pink-400/30'}`}>♥</div>
      <div className={`absolute bottom-36 left-[8%] text-3xl pointer-events-none transition-colors duration-500 ${isDarkMode ? 'text-[#d4af37]/25' : 'text-pink-200/50'}`}>♥</div>
      <div className={`absolute bottom-24 right-[12%] text-2xl pointer-events-none transition-colors duration-500 ${isDarkMode ? 'text-[#d4af37]/20' : 'text-pink-300/35'}`}>♥</div>
      <div className={`absolute top-[48%] left-[6%] text-4xl pointer-events-none transition-colors duration-500 ${isDarkMode ? 'text-[#d4af37]/10' : 'text-pink-100/60'}`}>♥</div>

      {/* Hujan Hati (Heart Rain) Background using framer-motion */}
      {isHeartRainActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {heartRainPositions.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ y: -50, opacity: 0 }}
              animate={{ 
                y: '105vh', 
                opacity: [0, 0.7, 0.7, 0],
                rotate: [0, 45, -45, 0]
              }}
              transition={{
                duration: heart.duration,
                repeat: Infinity,
                delay: heart.delay,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                left: heart.left,
                fontSize: `${heart.size}px`,
              }}
            >
              {getRainTypeEmoji(heart)}
            </motion.div>
          ))}
        </div>
      )}

      {/* Theme Transition Overlay Radial Glow */}
      <AnimatePresence>
        {themeChangeTrigger > 0 && (
          <motion.div
            key={themeChangeTrigger}
            initial={{ opacity: 0.9, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="fixed inset-0 pointer-events-none z-40 mix-blend-screen"
            style={{
              background: 
                particleTheme === 'Fire' ? 'radial-gradient(circle, rgba(249,115,22,0.45) 0%, transparent 70%)' :
                particleTheme === 'Frozen' ? 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 70%)' :
                particleTheme === 'Galaxy' ? 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)' :
                particleTheme === 'Golden' ? 'radial-gradient(circle, rgba(234,179,8,0.45) 0%, transparent 70%)' :
                'radial-gradient(circle, rgba(244,63,94,0.45) 0%, transparent 70%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Interactive Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full pointer-events-none z-10"
        id="particle-canvas"
      />

      {/* Header Bar */}
      <header className="relative z-20 w-full max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Heart className={`w-5 h-5 animate-pulse transition-all ${
            isDarkMode ? 'text-[#d4af37] fill-[#d4af37]/50' : 'text-[#FF69B4] fill-[#FF69B4]/60'
          }`} />
          <div className="flex flex-col">
            <span className={`font-serif text-lg leading-none tracking-wider font-bold transition-colors duration-500 ${
              isDarkMode ? 'text-[#d4af37]' : 'text-[#8B5E83]'
            }`}>Detak Cinta</span>
            {relationshipSong.trim() && (
              <span className={`text-[8px] font-bold mt-0.5 truncate max-w-[90px] flex items-center gap-0.5 opacity-85 ${isDarkMode ? 'text-amber-200/90' : 'text-pink-600'}`}>
                <Music className="w-2 h-2 animate-spin" style={{ animationDuration: '6s' }} />
                {relationshipSong}
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="flex items-center gap-2">
          {/* Master Mute Toggle Button */}
          <button
            onClick={toggleMuteAll}
            className={`p-1.5 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
              isMuted 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-500' 
                : isDarkMode
                  ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#d4af37]'
                  : 'bg-white/40 border-white/60 text-[#8B5E83]'
            }`}
            title={isMuted ? "Buka Suara (Unmute)" : "Senyap (Mute)"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Hujan Hati Toggle Switch */}
          <button
            onClick={() => setIsHeartRainActive(!isHeartRainActive)}
            className={`p-1.5 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
              isHeartRainActive 
                ? isDarkMode 
                  ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#d4af37]'
                  : 'bg-[#FF69B4]/20 border-[#FF69B4]/40 text-[#FF1493]' 
                : 'bg-white/40 border-white/60 text-[#A07088]'
            }`}
            title={isHeartRainActive ? "Matikan Hujan Hati" : "Aktifkan Hujan Hati"}
          >
            <Sparkle className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Mode Malam Switch */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
              isDarkMode 
                ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#d4af37]' 
                : 'bg-white/40 border-white/60 text-[#8B5E83]'
            }`}
            title={isDarkMode ? "Mode Terang" : "Mode Malam"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Sweet Synth Music Switch */}
          <button
            id="music-toggle-btn"
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm hover:opacity-95 active:scale-95 transition-all text-[11px] font-bold cursor-pointer border ${
              isDarkMode 
                ? 'bg-[#1b102b]/70 border-[#d4af37]/30 text-[#f3e5ab]' 
                : 'bg-white/40 border-white/60 text-[#8B5E83]'
            }`}
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className={`w-3.5 h-3.5 animate-bounce ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                <span className="hidden xs:inline">Musik: ON 🎵</span>
              </>
            ) : (
              <>
                <VolumeX className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#f3e5ab]/60' : 'text-[#A07088]'}`} />
                <span className="hidden xs:inline">Musik: OFF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-20 flex-1 w-full max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 flex flex-col justify-center items-center gap-6">
        
        {/* Top Centered Section Wrapper */}
        <div className="w-full max-w-xl mx-auto flex flex-col gap-6 items-center justify-center">
        
        {/* Intro Banner */}
        <div className="text-center space-y-2 max-w-sm">
          <h1 className="text-3xl font-light tracking-widest uppercase text-[#8B5E83]">
            Untuk Sayangku
          </h1>
          <div className="h-[1px] w-24 bg-[#8B5E83] mx-auto opacity-30" />
          <p className="text-xs italic text-[#A07088]">
            Ruang kecil penyemangat hari-harimu 🎒✨
          </p>
        </div>

        {/* Personalisasi Nama Panel */}
        <div className={`w-full backdrop-blur-md border rounded-2xl p-4 shadow-md space-y-3 prevent-burst transition-all duration-500 ${
          isDarkMode 
            ? 'bg-[#1b102b]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
            : 'bg-white/30 border border-white/50 text-[#5D3F6A]'
        }`}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`w-full flex justify-between items-center text-xs font-extrabold tracking-widest uppercase cursor-pointer hover:opacity-80 transition-opacity ${
              isDarkMode ? 'text-[#d4af37]' : 'text-[#8B5E83]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Settings className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
              Nama Kita: {partnerName || "Sayang"} & {senderName || "Aku"}
            </span>
            {isSettingsOpen ? (
              <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#8B5E83]'}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#8B5E83]'}`} />
            )}
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`overflow-hidden space-y-3 pt-2 border-t ${
                  isDarkMode ? 'border-[#d4af37]/20' : 'border-white/20'
                }`}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Nama Kamu:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contoh: Kevin"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-[#120820] border-[#d4af37]/30 focus:border-[#d4af37] text-white placeholder:text-amber-200/20' 
                            : 'bg-white/50 border border-pink-100 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FFC0CB]/40 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                        }`}
                      />
                      <User className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-amber-300' : 'text-[#A07088]'
                      }`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Nama Pacar (Sayang):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contoh: Aura"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-[#120820] border-[#d4af37]/30 focus:border-[#d4af37] text-white placeholder:text-amber-200/20' 
                            : 'bg-white/50 border border-pink-100 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FFC0CB]/40 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                        }`}
                      />
                      <Heart className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-[#d4af37] fill-[#d4af37]/30' : 'text-[#FF69B4] fill-[#FF69B4]/30'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Anniversary Date Selector */}
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                    isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                  }`}>
                    Tanggal Jadian Kita:
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={anniversaryDate}
                      onChange={(e) => setAnniversaryDate(e.target.value)}
                      className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none transition-all cursor-pointer ${
                        isDarkMode 
                          ? 'bg-[#120820] border-[#d4af37]/30 focus:border-[#d4af37] text-white' 
                          : 'bg-white/50 border border-pink-100 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FFC0CB]/40 text-[#5D3F6A]'
                      }`}
                    />
                    <Calendar className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-amber-300' : 'text-[#A07088]'
                    }`} />
                  </div>
                </div>

                {/* Target Hitung Mundur Kustom */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Target Hitung Mundur (Kustom):
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={countdownTargetDate}
                        onChange={(e) => {
                          setCountdownTargetDate(e.target.value);
                          localStorage.setItem('love_countdown_target_date', e.target.value);
                        }}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-[#120820] border-[#d4af37]/30 focus:border-[#d4af37] text-white' 
                            : 'bg-white/50 border border-pink-100 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FFC0CB]/40 text-[#5D3F6A]'
                        }`}
                      />
                      <Calendar className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-amber-300' : 'text-[#A07088]'
                      }`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Label Hitung Mundur:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contoh: Anniversary Ke-2 👑"
                        value={countdownTargetLabel}
                        onChange={(e) => {
                          setCountdownTargetLabel(e.target.value);
                          localStorage.setItem('love_countdown_target_label', e.target.value);
                        }}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-[#120820] border-[#d4af37]/30 focus:border-[#d4af37] text-white placeholder:text-amber-200/20' 
                            : 'bg-white/50 border border-pink-100 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FFC0CB]/40 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                        }`}
                      />
                      <Heart className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Lagu Tema & Genre Musik */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Lagu Tema Hubungan:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contoh: Perfect 🎵"
                        value={relationshipSong}
                        onChange={(e) => setRelationshipSong(e.target.value)}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-[#120820] border-[#d4af37]/30 focus:border-[#d4af37] text-white placeholder:text-amber-200/20' 
                            : 'bg-white/50 border border-pink-100 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FFC0CB]/40 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                        }`}
                      />
                      <Music className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-amber-300' : 'text-[#A07088]'
                      }`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Genre Musik Synth-Box:
                    </label>
                    <div className="flex gap-1">
                      {(['Romantic', 'Playful', 'Calm'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setMusicGenre(g);
                            playSweetPop();
                            if (isMusicPlaying) {
                              toggleMusic(g); // trigger smooth cross-fade transition
                            }
                          }}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                            musicGenre === g
                              ? isDarkMode
                                ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 font-extrabold'
                                : 'bg-[#FF69B4]/20 border-[#FF69B4] text-[#FF1493] font-extrabold'
                              : isDarkMode
                                ? 'bg-[#120820] border-transparent text-stone-400 hover:text-stone-300'
                                : 'bg-white/50 border-transparent text-[#A07088] hover:bg-white/80'
                          }`}
                        >
                          {g === 'Romantic' ? '💖 Romantic' : g === 'Playful' ? '⚡ Playful' : '🍃 Calm'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className={`text-[9px] font-semibold text-center italic mt-1 ${
                  isDarkMode ? 'text-amber-200/60' : 'text-[#A07088]/80'
                }`}>
                  Isi nama & tanggal kalian untuk mempersonalisasi seluruh petualangan cinta ini! ✨
                </p>

                {/* Rencanakan Pesan Kejutan */}
                <div className="space-y-2 pt-3 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block text-left ${
                    isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                  }`}>
                    📅 Rencanakan Pesan Kejutan:
                  </label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newSurpriseDate}
                        onChange={(e) => setNewSurpriseDate(e.target.value)}
                        className={`w-full rounded-xl px-2 py-1.5 text-xs font-semibold outline-none transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-[#120820] border border-[#d4af37]/30 text-white' 
                            : 'bg-white/50 border border-pink-100 text-[#5D3F6A]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSurpriseDate || !newSurpriseText.trim()) return;
                          const newMsg = {
                            id: Date.now().toString(),
                            date: newSurpriseDate,
                            message: newSurpriseText.trim()
                          };
                          setSurpriseMessages(prev => [...prev, newMsg]);
                          setNewSurpriseText('');
                          setNewSurpriseDate('');
                          playSweetPop();
                        }}
                        disabled={!newSurpriseDate || !newSurpriseText.trim()}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-[#d4af37] text-[#1e112a] disabled:opacity-40 hover:bg-[#d4af37]/80' 
                            : 'bg-[#FF69B4] text-white disabled:opacity-40 hover:bg-[#FF69B4]/80'
                        }`}
                      >
                        Simpan Kejutan ✨
                      </button>
                    </div>
                    <textarea
                      placeholder="Ketik pesan kejutan romantis yang akan muncul pada tanggal di atas..."
                      value={newSurpriseText}
                      onChange={(e) => setNewSurpriseText(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition-all resize-none h-12 ${
                        isDarkMode 
                          ? 'bg-[#120820] border border-[#d4af37]/30 text-white placeholder:text-amber-200/20' 
                          : 'bg-white/50 border border-pink-100 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                      }`}
                    />
                    
                    {surpriseMessages.length > 0 && (
                      <div className="space-y-1 mt-1.5 max-h-24 overflow-y-auto pr-1">
                        <span className={`text-[8px] font-bold uppercase tracking-wider block text-left ${
                          isDarkMode ? 'text-amber-200/60' : 'text-[#A07088]'
                        }`}>
                          Kejutan Terjadwal:
                        </span>
                        <div className="space-y-1">
                          {surpriseMessages.map(msg => (
                            <div 
                              key={msg.id} 
                              className={`flex justify-between items-center px-2 py-1 rounded-lg text-[9px] font-semibold border ${
                                isDarkMode 
                                  ? 'bg-[#120820]/60 border-[#d4af37]/20 text-amber-100' 
                                  : 'bg-white/40 border-pink-100/60 text-[#5D3F6A]'
                              }`}
                            >
                              <span className="truncate max-w-[150px]">
                                <strong className={isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}>{msg.date}:</strong> {msg.message}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSurpriseMessages(prev => prev.filter(m => m.id !== msg.id));
                                  playSweetPop();
                                }}
                                className="text-red-500 hover:text-red-600 font-bold p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daftar Pesan Otomatis Terjadwal */}
                <div className="space-y-2 pt-3 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block text-left flex items-center gap-1 ${
                    isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                  }`}>
                    <span>⏰ Daftar Pesan Otomatis Harian:</span>
                  </label>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="col-span-1">
                        <input
                          type="time"
                          value={newSchedTime}
                          onChange={(e) => setNewSchedTime(e.target.value)}
                          className={`w-full rounded-xl px-2 py-1.5 text-xs font-bold outline-none transition-all cursor-pointer ${
                            isDarkMode 
                              ? 'bg-[#120820] border border-[#d4af37]/30 text-white' 
                              : 'bg-white/50 border border-pink-100 text-[#5D3F6A]'
                          }`}
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newSchedText.trim() || !newSchedTime) return;
                            const newMsg = {
                              id: Date.now().toString(),
                              time: newSchedTime,
                              message: newSchedText.trim()
                            };
                            setScheduledTimeMessages(prev => {
                              const updated = [...prev, newMsg].sort((a, b) => a.time.localeCompare(b.time));
                              return updated;
                            });
                            setNewSchedText('');
                            playSweetPop();
                          }}
                          disabled={!newSchedText.trim() || !newSchedTime}
                          className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                            isDarkMode 
                              ? 'bg-[#d4af37] text-[#1e112a] disabled:opacity-40 hover:bg-[#d4af37]/80' 
                              : 'bg-[#FF69B4] text-white disabled:opacity-40 hover:bg-[#FF69B4]/80'
                          }`}
                        >
                          Tambah Pesan ⏰
                        </button>
                      </div>
                    </div>
                    
                    <textarea
                      placeholder="Ketik pesan romantis otomatis yang akan berganti di jam tersebut..."
                      value={newSchedText}
                      onChange={(e) => setNewSchedText(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition-all resize-none h-12 ${
                        isDarkMode 
                          ? 'bg-[#120820] border border-[#d4af37]/30 text-white placeholder:text-amber-200/20' 
                          : 'bg-white/50 border border-pink-100 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                      }`}
                    />

                    {scheduledTimeMessages.length > 0 && (
                      <div className="space-y-1 mt-1.5 max-h-28 overflow-y-auto pr-1">
                        <span className={`text-[8px] font-bold uppercase tracking-wider block text-left ${
                          isDarkMode ? 'text-amber-200/60' : 'text-[#A07088]'
                        }`}>
                          Daftar Jam & Pesan Aktif:
                        </span>
                        <div className="space-y-1">
                          {scheduledTimeMessages.map(msg => (
                            <div 
                              key={msg.id} 
                              className={`flex justify-between items-center px-2 py-1 rounded-lg text-[9px] font-semibold border gap-1.5 ${
                                isDarkMode 
                                  ? 'bg-[#120820]/60 border-[#d4af37]/20 text-amber-100' 
                                  : 'bg-white/40 border-pink-100/60 text-[#5D3F6A]'
                              }`}
                            >
                              <span className="truncate max-w-[210px] text-left">
                                <strong className={isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}>{msg.time}:</strong> {msg.message}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setScheduledTimeMessages(prev => prev.filter(m => m.id !== msg.id));
                                  playSweetPop();
                                }}
                                className="text-red-500 hover:text-red-600 font-bold p-0.5 cursor-pointer shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tema Efek Partikel */}
                <div className="space-y-2 pt-3 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20 text-left">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                  }`}>
                    ✨ Tema Efek Hati & Partikel:
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['Default', 'Fire', 'Frozen', 'Galaxy', 'Golden'] as const).map((theme) => {
                      const isActive = particleTheme === theme;
                      let btnThemeClass = '';
                      if (isActive) {
                        if (theme === 'Fire') btnThemeClass = 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent';
                        else if (theme === 'Frozen') btnThemeClass = 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-transparent';
                        else if (theme === 'Galaxy') btnThemeClass = 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-transparent';
                        else if (theme === 'Golden') btnThemeClass = 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white border-transparent';
                        else btnThemeClass = 'bg-rose-500 text-white border-transparent';
                      } else {
                        btnThemeClass = isDarkMode
                          ? 'bg-[#120820]/80 border-[#d4af37]/30 text-amber-200/60 hover:text-[#d4af37]'
                          : 'bg-white/50 border-pink-100 text-[#8B5E83] hover:bg-pink-50/55';
                      }
                      
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => {
                            setParticleTheme(theme);
                            localStorage.setItem('love_particle_theme', theme);
                            playSweetPop();
                          }}
                          className={`py-1.5 px-1 rounded-xl text-[9px] font-extrabold border uppercase tracking-tight transition-all cursor-pointer hover:scale-105 active:scale-95 ${btnThemeClass}`}
                        >
                          {theme === 'Default' ? 'Default 💖' : 
                           theme === 'Fire' ? 'Fire 🔥' : 
                           theme === 'Frozen' ? 'Frozen ❄️' : 
                           theme === 'Galaxy' ? 'Galaxy 🌌' : 'Golden 👑'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gaya Efek Hujan */}
                <div className="space-y-2 pt-3 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20 text-left">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                  }`}>
                    🌧️ Gaya Efek Hujan Latar:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'Heart', label: 'Hujan Hati ❤️' },
                      { id: 'Snow', label: 'Hujan Salju ❄️' },
                      { id: 'Leaf', label: 'Hujan Daun 🍁' }
                    ].map((gaya) => {
                      const isActive = rainType === gaya.id;
                      return (
                        <button
                          key={gaya.id}
                          type="button"
                          onClick={() => {
                            setRainType(gaya.id as any);
                            playSweetPop();
                          }}
                          className={`py-1.5 px-2 rounded-xl text-[9px] font-extrabold border uppercase tracking-tight transition-all cursor-pointer hover:scale-105 active:scale-95 text-center ${
                            isActive
                              ? isDarkMode
                                ? 'bg-[#d4af37] text-stone-950 border-transparent font-black'
                                : 'bg-pink-500 text-white border-transparent font-black'
                              : isDarkMode
                                ? 'bg-[#120820]/80 border-[#d4af37]/30 text-amber-200/60 hover:text-[#d4af37]'
                                : 'bg-white/50 border-pink-100 text-[#8B5E83] hover:bg-pink-50/55'
                          }`}
                        >
                          {gaya.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 📸 KAMERA & UNGGAH POLAROID KENANGAN */}
                <div id="camera-preview-anchor" className="space-y-3 pt-3 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20 text-left">
                  <div className="flex items-center gap-1.5">
                    <Camera className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                    <label className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isDarkMode ? 'text-amber-200/80' : 'text-[#A07088]'
                    }`}>
                      Kamera & Unggah Polaroid Cinta:
                    </label>
                  </div>

                  {/* Camera Live Stream */}
                  {isCameraActive && (
                    <div className="space-y-2">
                      <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-stone-900 rounded-2xl overflow-hidden border-2 border-dashed border-pink-400 dark:border-[#d4af37]">
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {isRecordingVideo && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-black tracking-widest uppercase animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-ping" />
                            REKAMING (Maks 5 dtk)
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className={`py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1 ${
                            isDarkMode ? 'bg-[#d4af37] text-stone-950 hover:bg-amber-400' : 'bg-pink-500 text-white hover:bg-pink-600'
                          }`}
                        >
                          Tangkap Foto 📸
                        </button>

                        {!isRecordingVideo ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase bg-rose-600 text-white hover:bg-rose-700 cursor-pointer flex items-center gap-1"
                          >
                            Rekam Video 🎥
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase bg-stone-600 text-white hover:bg-stone-700 cursor-pointer flex items-center gap-1"
                          >
                            Selesai Rekam ⏹️
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload and Control Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {!isCameraActive ? (
                      <button
                        type="button"
                        onClick={startCamera}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 ${
                          isDarkMode 
                            ? 'bg-[#d4af37]/20 border border-[#d4af37]/40 text-amber-200 hover:bg-[#d4af37]/30' 
                            : 'bg-pink-100/60 border border-pink-200/40 text-[#FF1493] hover:bg-pink-100'
                        }`}
                      >
                        <Camera className="w-3 h-3" />
                        Aktifkan Kamera
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="flex-1 py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase bg-stone-600 text-white cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CameraOff className="w-3 h-3" />
                        Matikan Kamera
                      </button>
                    )}

                    <label className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 border border-dashed text-center ${
                      isDarkMode 
                        ? 'border-[#d4af37]/40 text-amber-200 hover:bg-[#d4af37]/10' 
                        : 'border-pink-200 text-[#FF1493] hover:bg-pink-50'
                    }`}>
                      <Plus className="w-3 h-3" />
                      Unggah Media
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Captured/Uploaded Preview Polaroid Section */}
                  {capturedPhoto && (
                    <div className="mt-3 p-3 rounded-2xl bg-stone-50 dark:bg-[#120820] border border-stone-200 dark:border-[#d4af37]/20 space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500 dark:text-amber-200/50 text-center">Pratinjau Polaroid 🖼️</p>
                      
                      <div className="flex gap-2 items-center justify-center">
                        <span className="text-[10px] font-semibold">Overlay Emoji:</span>
                        <select
                          value={selectedEmoji}
                          onChange={(e) => {
                            setSelectedEmoji(e.target.value);
                            playSweetPop();
                          }}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold outline-none border cursor-pointer ${
                            isDarkMode ? 'bg-[#1b102b] border-[#d4af37]/30 text-white' : 'bg-white border-pink-100 text-[#5D3F6A]'
                          }`}
                        >
                          {['💖', '❤️', '💕', '💋', '🌸', '✨', '🧸', '🌹', '🥞', '💑'].map(emoji => (
                            <option key={emoji} value={emoji}>{emoji}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-white border border-stone-200 p-2 pb-4 shadow-md w-36 mx-auto">
                        <div className="relative aspect-square w-full bg-stone-200 overflow-hidden rounded-md border border-stone-300/40">
                          {capturedType === 'video' ? (
                            <video
                              src={capturedPhoto}
                              controls
                              loop
                              muted
                              className="w-full h-full object-cover select-none"
                            />
                          ) : (
                            <img
                              src={capturedPhoto}
                              alt="Unggahan"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover select-none"
                            />
                          )}
                          <span className="absolute bottom-1 right-1 text-base drop-shadow-sm select-none">{selectedEmoji}</span>
                        </div>
                        <div className="text-center pt-2">
                          <p className="text-[8px] font-black text-stone-500 leading-none uppercase tracking-wider">
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            saveMemory();
                            playSweetPop();
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase cursor-pointer text-center ${
                            isDarkMode ? 'bg-[#d4af37] text-stone-950' : 'bg-[#FF69B4] text-white'
                          }`}
                        >
                          Simpan ke Galeri 💾
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedPhoto(null);
                            setCapturedType('image');
                            playSweetPop();
                          }}
                          className="py-1.5 px-3 rounded-xl text-[9px] font-bold tracking-wider uppercase bg-stone-300 text-stone-700 hover:bg-stone-400 cursor-pointer text-center"
                        >
                          Batal ❌
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Reset Semua Data */}
                <div className="pt-3 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-1.5 px-3 text-[10px] font-bold tracking-wider uppercase text-red-500 hover:text-red-600 bg-red-50/40 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-200/20 hover:scale-[1.02] active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Semua Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Anniversary Love Counter */}
        <div className={`w-full backdrop-blur-md border rounded-3xl p-4 shadow-md relative overflow-hidden prevent-burst text-center flex flex-col items-center justify-center gap-1 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-[#d4af37]/10 to-[#822faf]/20 border-[#d4af37]/30 text-[#f3e5ab]' 
            : 'bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFE4E1]/30 border-white/60 text-[#5D3F6A]'
        }`}>
          {/* Daily Streak Counter Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase shadow-sm bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white animate-pulse">
            <Flame className="w-3 h-3 fill-current text-yellow-300" />
            <span>{dailyStreak} Hari Streak! 🔥</span>
          </div>

          <Heart className={`absolute right-4 bottom-1 w-12 h-12 pointer-events-none ${
            isDarkMode ? 'text-[#d4af37]/10 fill-[#d4af37]/5' : 'text-[#FF69B4]/10 fill-[#FF69B4]/5'
          }`} />
          
          <span className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${
            isDarkMode ? 'text-[#d4af37]' : 'text-[#8B5E83]'
          }`}>
            <Calendar className={`w-3 h-3 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
            Perjalanan Cinta Kita
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-3xl font-black tracking-tight drop-shadow-sm ${
              isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'
            }`}>
              {daysTogether}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-amber-100' : 'text-[#8B5E83]'}`}>Hari Bersama</span>
          </div>
          <p className={`text-[10px] italic ${isDarkMode ? 'text-amber-200/70' : 'text-[#A07088]'}`}>
            Sejak {new Date(anniversaryDate || '2025-01-01').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} 💞
          </p>

          {/* Live Countdown Timer */}
          {countdownTime && (
            <div className="w-full mt-2.5 pt-2.5 border-t border-dashed border-pink-200/40 dark:border-[#d4af37]/20 flex flex-col items-center justify-center gap-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1 ${
                isDarkMode ? 'text-amber-200' : 'text-[#8B5E83]'
              }`}>
                ⏳ {countdownTime.label}:
              </span>
              <div className="flex gap-2 items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className={`text-base font-black px-2 py-1 rounded-xl shadow-inner min-w-10 ${
                    isDarkMode ? 'bg-[#120820] text-[#d4af37]' : 'bg-white/60 text-[#FF1493]'
                  }`}>{countdownTime.days}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider mt-1 opacity-70">Hari</span>
                </div>
                <span className="font-extrabold text-[#FF69B4] dark:text-[#d4af37] animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span className={`text-base font-black px-2 py-1 rounded-xl shadow-inner min-w-10 ${
                    isDarkMode ? 'bg-[#120820] text-[#d4af37]' : 'bg-white/60 text-[#FF1493]'
                  }`}>{countdownTime.hours}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider mt-1 opacity-70">Jam</span>
                </div>
                <span className="font-extrabold text-[#FF69B4] dark:text-[#d4af37] animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span className={`text-base font-black px-2 py-1 rounded-xl shadow-inner min-w-10 ${
                    isDarkMode ? 'bg-[#120820] text-[#d4af37]' : 'bg-white/60 text-[#FF1493]'
                  }`}>{countdownTime.minutes}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider mt-1 opacity-70">Menit</span>
                </div>
                <span className="font-extrabold text-[#FF69B4] dark:text-[#d4af37] animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span className={`text-base font-black px-2 py-1 rounded-xl shadow-inner min-w-10 ${
                    isDarkMode ? 'bg-[#120820] text-[#d4af37]' : 'bg-white/60 text-[#FF1493]'
                  }`}>{countdownTime.seconds}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider mt-1 opacity-70">Detik</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Daily Affirmation Generator Sticky Note */}
        {dailyAffirmation && (
          <div className={`w-full backdrop-blur-sm border rounded-2xl p-4 shadow-sm relative prevent-burst text-left transition-all duration-500 ${
            isDarkMode 
              ? 'bg-[#d4af37]/5 border-[#d4af37]/30 text-white' 
              : 'bg-amber-50/50 border border-amber-200/50 text-[#5D3F6A]'
          }`}>
            <div className={`absolute top-2.5 right-3 px-2 py-0.5 text-[8px] tracking-wider uppercase font-extrabold rounded-full ${
              isDarkMode ? 'bg-[#d4af37] text-stone-950' : 'bg-amber-200 text-[#8B5E83]'
            }`}>
              Afirmasi Hari Ini ✨
            </div>
            <div className="flex gap-2.5 items-start mt-1">
              <div className={`p-1.5 rounded-full mt-0.5 ${
                isDarkMode ? 'bg-[#d4af37]/20 text-amber-300' : 'bg-amber-100 text-amber-600'
              }`}>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="space-y-0.5 flex-1">
                <span className={`text-[9px] font-bold uppercase tracking-widest block ${
                  isDarkMode ? 'text-[#d4af37]/80' : 'text-amber-700/80'
                }`}>Semangat Harianmu:</span>
                <p className={`text-xs font-semibold leading-relaxed italic ${
                  isDarkMode ? 'text-white/90' : 'text-[#5D3F6A]'
                }`}>
                  "{formatText(dailyAffirmation, partnerName, senderName)}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Central Love Dashboard with Elegant Softer Shadow Hover Lift */}
        <div className={`w-full backdrop-blur-md border rounded-[32px] p-6 shadow-xl relative space-y-6 prevent-burst hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-pink-300/25 dark:hover:shadow-purple-950/40 transition-all duration-500 ease-out ${
          isDarkMode 
            ? 'bg-[#1e112a]/85 border-[#d4af37]/30 text-[#f3e5ab]' 
            : 'bg-white/40 border-white/60 text-[#5D3F6A]'
        }`}>
          
          {/* Dynamic Message Bubble with Softer Shadow Hover Lift & Pop-in entrance animation */}
          <motion.div
            key={`message-bubble-${currentMessage}`}
            initial={{ scale: 0.93, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            className={`relative min-h-[100px] flex flex-col items-center justify-center border rounded-2xl p-6 text-center shadow-inner mt-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-300/10 dark:hover:shadow-purple-900/20 transition-all duration-300 ease-out ${
              isDarkMode 
                ? 'bg-[#12081d]/80 border-[#d4af37]/20 text-white shadow-stone-950/40' 
                : 'bg-white/20 border-white/40 text-[#5D3F6A]'
            }`}
          >
            
            {/* Quick Share & Favorite buttons in corners of bubble */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="p-1 rounded-full text-stone-400 hover:text-[#FF1493] hover:bg-white/30 dark:hover:bg-black/30 active:scale-90 transition-all cursor-pointer"
                title="Bagikan Pesan Ini"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteMessage(currentMessage);
                }}
                className="p-1 rounded-full active:scale-90 transition-all cursor-pointer"
                title={isFavorited(currentMessage) ? "Hapus dari Favorit" : "Simpan ke Favorit"}
              >
                <Heart className={`w-3.5 h-3.5 transition-colors ${
                  isFavorited(currentMessage)
                    ? 'text-[#FF1493] fill-[#FF1493]'
                    : 'text-stone-400 hover:text-[#FF1493]'
                }`} />
              </button>
            </div>
            
            {/* Elegant Header Tag */}
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[9px] uppercase tracking-widest font-bold rounded-full shadow-md transition-all ${
              isDarkMode ? 'bg-[#d4af37] text-[#1e112a]' : 'bg-[#FF69B4] text-white'
            }`}>
              Mood Booster ✨
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`text-xs md:text-sm font-semibold leading-relaxed animate-none transition-colors duration-500 ${
                  isDarkMode ? 'text-amber-100' : 'text-[#5D3F6A]'
                }`}
              >
                {formatText(currentMessage, partnerName, senderName)}
              </motion.p>
            </AnimatePresence>
            
            {/* Stylized Bottom Dots */}
            <div className="mt-3.5 flex justify-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-[#d4af37]' : 'bg-[#FF69B4]'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#f3e5ab]' : 'bg-[#FFC0CB]'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-purple-400' : 'bg-[#E0BFB8]'}`} />
            </div>
          </motion.div>

          {/* Action Row: Share, Save postcard image, WhatsApp and Confetti */}
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 mt-1">
            {/* Share / Copy Snippet */}
            <button
              onClick={handleShare}
              className={`flex flex-col xs:flex-row items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[10px] font-bold tracking-wider uppercase cursor-pointer text-center active:scale-95 transition-all border ${
                isDarkMode 
                  ? 'bg-[#1b102b]/95 border-[#d4af37]/40 text-[#f3e5ab] hover:bg-[#28183f]' 
                  : 'bg-white/50 border-pink-100/50 text-[#8B5E83] hover:bg-white/70'
              }`}
              title="Bagikan pesan cinta ini ke pacarmu!"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                  <span className="text-[8px] xs:text-[9px]">Tersalin</span>
                </>
              ) : (
                <>
                  <Share2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                  <span className="text-[8px] xs:text-[9px]">Bagikan</span>
                </>
              )}
            </button>

            {/* Download Postcard Image */}
            <button
              onClick={downloadLoveMessageAsImage}
              className={`flex flex-col xs:flex-row items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[10px] font-bold tracking-wider uppercase cursor-pointer text-center active:scale-95 transition-all border ${
                isDarkMode 
                  ? 'bg-[#1b102b]/95 border-[#d4af37]/40 text-[#f3e5ab] hover:bg-[#28183f]' 
                  : 'bg-white/50 border-pink-100/50 text-[#8B5E83] hover:bg-white/70'
              }`}
              title="Unduh pesan cinta ini sebagai gambar kenang-kenangan!"
            >
              <Download className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
              <span className="text-[8px] xs:text-[9px]">Simpan</span>
            </button>

            {/* WhatsApp Direct Share Link */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Hai ${partnerName} sayang 💞, ini ada pesan cinta spesial dari ${senderName} untukmu:\n\n"${formatText(currentMessage, partnerName, senderName)}"\n\nBuka aplikasi cinta kita di sini untuk kejutan manis!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={playSweetPop}
              className={`flex flex-col xs:flex-row items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[10px] font-bold tracking-wider uppercase text-center active:scale-95 transition-all border ${
                isDarkMode 
                  ? 'bg-[#1b102b]/95 border-[#d4af37]/40 text-[#f3e5ab] hover:bg-[#28183f]' 
                  : 'bg-white/50 border-pink-100/50 text-[#8B5E83] hover:bg-white/70'
              }`}
              title="Kirim langsung pesan cinta ini ke WhatsApp pacarmu!"
            >
              <MessageCircle className="w-3.5 h-3.5 text-green-500 hover:scale-110 transition-transform" />
              <span className="text-[8px] xs:text-[9px]">WhatsApp</span>
            </a>

            {/* Confetti Explosion */}
            <button
              onClick={triggerConfetti}
              className={`flex flex-col xs:flex-row items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[10px] font-bold tracking-wider uppercase cursor-pointer text-center group active:scale-95 transition-all border ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-[#2c144d] to-[#1e0e36] border-[#d4af37]/40 text-[#f3e5ab]' 
                  : 'bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border-pink-100/60 text-[#8B5E83]'
              }`}
              title="Ledakan hati-hati cantik di layar!"
            >
              <PartyPopper className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'}`} />
              <span className="text-[8px] xs:text-[9px]">Ledakan</span>
            </button>
          </div>

          {/* Interactive Pulse Heart Button */}
          <div className="flex flex-col items-center justify-center py-2 relative">
            <button
              id="pulse-heart-btn"
              onClick={handleHeartClick}
              className={`relative z-30 flex items-center justify-center cursor-pointer select-none transition-all duration-500 transform active:scale-90 hover:scale-110 hover:rotate-3 hover:saturate-150 ease-out ${
                clickCount >= 80
                  ? 'animate-dramatic-heartbeat'
                  : isHeartBeatingFast ? 'animate-none' : 'animate-heartbeat'
              }`}
              style={{
                animationDuration: clickCount >= 80 ? '0.7s' : (isHeartBeatingFast ? '0.4s' : '1.6s')
              }}
              title={clickCount >= 80 ? "Puncak Kebucinan Tercapai! 👑 Sentuh untuk Energi Cinta!" : "Sentuh hati ini untuk kejutan cinta"}
            >
              {/* Outer immersive soft auris */}
              <div className={`absolute w-32 h-32 rounded-full scale-125 blur-xl animate-pulse transition-colors ${
                clickCount >= 80 
                  ? 'bg-amber-400/30'
                  : isDarkMode ? 'bg-[#d4af37]/10' : 'bg-[#FF69B4]/10'
              }`} />
              <div className={`absolute w-28 h-28 rounded-full scale-110 blur-md transition-colors ${
                clickCount >= 80
                  ? 'bg-yellow-300/20'
                  : isDarkMode ? 'bg-[#f3e5ab]/10' : 'bg-[#FFC0CB]/20'
              }`} />

              {/* Magical Rotating Sparkle Ring for Puncak Kebucinan */}
              {clickCount >= 80 && (
                <div className="absolute inset-0 w-36 h-36 border border-dashed border-amber-400 rounded-full animate-spin pointer-events-none opacity-60" style={{ animationDuration: '6s' }} />
              )}
              
              <svg 
                className={`w-24 h-24 drop-shadow-[0_10px_25px_rgba(255,20,147,0.25)] transition-colors duration-300 ${
                  clickCount >= 80
                    ? 'text-amber-400 fill-amber-300 hover:text-amber-300 hover:fill-amber-400'
                    : isDarkMode 
                      ? 'text-[#d4af37] fill-[#d4af37]/80 hover:text-amber-300 hover:fill-[#d4af37]' 
                      : 'text-[#FF1493] fill-[#FF69B4] hover:text-[#FF69B4] hover:fill-[#FF1493]'
                }`}
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>

              <span className={`absolute font-extrabold text-[10px] tracking-widest uppercase pointer-events-none drop-shadow-md flex flex-col items-center ${
                clickCount >= 80 ? 'text-amber-950 font-black' : 'text-white'
              }`}>
                <span>{clickCount >= 80 ? '👑 MAHA' : 'Sentuh'}</span>
                <span>{clickCount >= 80 ? 'BUCIN 🌌' : 'Aku 💖'}</span>
              </span>
            </button>
            <span className={`mt-4 text-[11px] font-semibold tracking-wider uppercase opacity-80 ${
              clickCount >= 80
                ? 'text-amber-400 font-extrabold animate-pulse'
                : isDarkMode ? 'text-amber-200/80' : 'text-[#8B5E83]'
            }`}>
              {clickCount >= 80 ? '✨ KEKUATAN PUNCAK KEBUCINAN AKTIF ✨' : 'Tekan hati di atas untuk kejutan'}
            </span>
          </div>

          {/* Interactive Progress Meter */}
          <div className={`space-y-3 pt-2 border-t ${
            isDarkMode ? 'border-[#d4af37]/20' : 'border-white/40'
          }`}>
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className={`text-[10px] font-bold tracking-widest uppercase ${
                  isDarkMode ? 'text-amber-200' : 'text-[#8B5E83]'
                }`}>Gelar Kebucinan:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full bg-gradient-to-r ${currentLevel.color} text-white shadow-sm shadow-pink-200/40`}>
                    {currentLevel.badge}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-1.5 justify-end">
                <div className="text-right">
                  <span className={`text-2xl font-black block leading-none ${
                    isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'
                  }`}>{clickCount}</span>
                  <span className={`text-[9px] font-bold tracking-wider uppercase ${
                    isDarkMode ? 'text-amber-200/70' : 'text-[#A07088]'
                  }`}>Poin Cinta</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playSweetPop();
                    setShowResetPoinConfirm(true);
                  }}
                  className="p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-[#2c0f1e] hover:scale-110 active:scale-95 transition-all cursor-pointer border border-red-200/15"
                  title="Reset Poin Cinta"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Micro Progress Bar */}
            <motion.div 
              key={`poin-cinta-container-${clickCount}`}
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`h-3 w-full border rounded-full overflow-hidden p-[1px] shadow-sm ${
                isDarkMode ? 'bg-[#12081d] border-[#d4af37]/20' : 'bg-white/30 border-white/40'
              }`}
            >
              <motion.div 
                className={`h-full rounded-full shadow-inner ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-600 via-[#d4af37] to-amber-300' 
                    : 'bg-gradient-to-r from-[#FFC0CB] via-[#FF69B4] to-[#FF1493]'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ type: "spring", stiffness: 85, damping: 13 }}
              />
            </motion.div>

            <p className={`text-[10px] font-medium text-center italic ${
              isDarkMode ? 'text-amber-100/60' : 'text-[#A07088]'
            }`}>
              &ldquo;{currentLevel.desc}&rdquo;
            </p>

            {/* Target Ciuman Harian Indicator */}
            <div className={`space-y-2 pt-3 border-t ${
              isDarkMode ? 'border-[#d4af37]/20' : 'border-white/40'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className={`text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1 ${
                  isDarkMode ? 'text-amber-200' : 'text-[#8B5E83]'
                }`}>
                  💋 Target Ciuman Harian:
                </span>
                <span className={`font-black ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'}`}>
                  {dailyKisses} / {kissTarget}
                </span>
              </div>
              
              {/* Kiss Progress Bar */}
              <motion.div 
                key={`target-ciuman-container-${dailyKisses}`}
                animate={{ scale: [1, 1.015, 1] }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`h-2.5 w-full border rounded-full overflow-hidden p-[1px] shadow-sm relative ${
                  isDarkMode ? 'bg-[#12081d] border-[#d4af37]/20' : 'bg-white/30 border-white/40'
                }`}
              >
                <motion.div 
                  className={`h-full rounded-full ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-pink-600 to-[#d4af37]' 
                      : 'bg-gradient-to-r from-pink-300 via-rose-400 to-[#FF1493]'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (dailyKisses / kissTarget) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 85, damping: 13 }}
                />
              </motion.div>

              {/* Control row to change Kiss Target */}
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className={`${isDarkMode ? 'text-amber-100/50' : 'text-[#A07088]'}`}>
                  {dailyKisses >= kissTarget ? "Target Hari Ini Tercapai! 🥰💋" : "Ketuk hati di atas untuk mengirim kecupan!"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={isDarkMode ? 'text-amber-100/50' : 'text-[#A07088]'}>Target:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={kissTarget}
                    onChange={(e) => {
                      setKissTarget(parseInt(e.target.value, 10));
                      playSweetPop();
                    }}
                    className="w-16 h-1 bg-pink-100 dark:bg-[#12081d] rounded-lg appearance-none cursor-pointer accent-[#FF1493] dark:accent-[#d4af37]"
                    title="Ubah Target Ciuman Harian"
                  />
                  <span className={`font-black text-[10px] w-4 text-center ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'}`}>{kissTarget}</span>
                </div>
              </div>
            </div>

            {/* Grafik Aktivitas Cinta 7 Hari Terakhir */}
            <div className={`space-y-2.5 pt-3.5 border-t ${
              isDarkMode ? 'border-[#d4af37]/20' : 'border-white/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                  <span className={`text-[10px] font-extrabold tracking-widest uppercase ${
                    isDarkMode ? 'text-amber-200' : 'text-[#8B5E83]'
                  }`}>Aktivitas Cinta (7 Hari Terakhir)</span>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.015, y: -2 }}
                className="h-[120px] w-full" 
                style={{ minWidth: '100%' }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getLast7DaysStats()}
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorLoveClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#d4af37' : '#FF69B4'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isDarkMode ? '#d4af37' : '#FF69B4'} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="displayDate" 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: isDarkMode ? '#f3e5ab' : '#5D3F6A', fontSize: 8, fontWeight: 700 }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fill: isDarkMode ? '#f3e5ab' : '#5D3F6A', fontSize: 8, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDarkMode ? '#1b102b' : '#ffffff',
                        border: isDarkMode ? '1px solid #d4af37' : '1px solid #FFC0CB',
                        borderRadius: '12px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f3e5ab' : '#5D3F6A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      labelStyle={{ color: isDarkMode ? '#d4af37' : '#FF1493' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke={isDarkMode ? '#d4af37' : '#FF69B4'} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorLoveClicks)" 
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </div>
        </div>

        </div>

        {/* --- DUNIA INTERAKTIF CINTA KITA (BENTO ACCORDIONS) --- */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 prevent-burst">
          
          {/* Favorite Messages Section */}
          {favoriteMessages.length > 0 && (
            <div className={`backdrop-blur-md border rounded-2xl p-4 shadow-md transition-all duration-500 ${
              isDarkMode 
                ? 'bg-[#1b102b]/80 border-[#d4af37]/20 text-[#f3e5ab]' 
                : 'bg-white/40 border-white/60 text-[#5D3F6A]'
            }`}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Heart className="w-4 h-4 text-[#FF1493] fill-[#FF1493]" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest">Pesan Favorit Kita ({favoriteMessages.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {favoriteMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-2.5 rounded-xl border text-[11px] font-semibold flex justify-between items-start gap-2.5 text-left transition-colors ${
                      isDarkMode 
                        ? 'bg-[#120820]/60 border-[#d4af37]/15 text-amber-100 hover:bg-[#180b29]' 
                        : 'bg-white/50 border-pink-100/40 text-[#5D3F6A] hover:bg-white/70'
                    }`}
                  >
                    <p className="italic leading-relaxed flex-1">"{formatText(msg, partnerName, senderName)}"</p>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(formatText(msg, partnerName, senderName));
                          playSweetPop();
                        }}
                        className="p-1 rounded-md text-stone-400 hover:text-[#FF1493] hover:bg-white/20 transition-all cursor-pointer"
                        title="Salin Pesan"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavoriteMessage(msg)}
                        className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-white/20 transition-all cursor-pointer"
                        title="Hapus dari Favorit"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. JURNAL CINTA (CALENDAR & DAILY NOTES) */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase">Jurnal Cinta Kita 📖</h3>
                  <p className="text-[9px] opacity-75">Tulis catatan harian & lihat tanda hati di kalender</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  Object.keys(loveJournal).length > 0
                    ? isDarkMode ? 'bg-[#d4af37]/20 text-amber-200' : 'bg-pink-100 text-[#FF1493]'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                }`}>
                  {Object.keys(loveJournal).length} Catatan
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                  isFirebaseEnabled 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-stone-500/10 text-stone-400 border border-stone-500/20'
                }`} title={isFirebaseEnabled ? "Tersinkronisasi otomatis ke Firestore Cloud!" : "Tersimpan lokal di perangkat"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseEnabled ? 'bg-emerald-400' : 'bg-stone-400'}`} />
                  {isFirebaseEnabled ? "Cloud ☁️" : "Lokal 📂"}
                </span>
              </div>
            </div>

            {/* Calendar Grid Controller */}
            <div className="mt-4 space-y-3 pt-3 border-t border-dashed border-stone-200/20">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black tracking-wide">
                  {new Date(currentJournalYear, currentJournalMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSweetPop();
                      if (currentJournalMonth === 0) {
                        setCurrentJournalMonth(11);
                        setCurrentJournalYear(prev => prev - 1);
                      } else {
                        setCurrentJournalMonth(prev => prev - 1);
                      }
                    }}
                    className="p-1 rounded-lg bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 text-[10px] font-bold cursor-pointer transition-all"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSweetPop();
                      if (currentJournalMonth === 11) {
                        setCurrentJournalMonth(0);
                        setCurrentJournalYear(prev => prev + 1);
                      } else {
                        setCurrentJournalMonth(prev => prev + 1);
                      }
                    }}
                    className="p-1 rounded-lg bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 text-[10px] font-bold cursor-pointer transition-all"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Monthly Grid View */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((dayLabel, idx) => (
                  <span key={idx} className="text-[8px] font-bold opacity-60 uppercase">{dayLabel}</span>
                ))}
                
                {/* Pad leading days */}
                {Array.from({ length: new Date(currentJournalYear, currentJournalMonth, 1).getDay() }).map((_, idx) => (
                  <div key={`pad-${idx}`} className="aspect-square" />
                ))}

                {/* Actual Days of the Month */}
                {Array.from({ length: new Date(currentJournalYear, currentJournalMonth + 1, 0).getDate() }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${currentJournalYear}-${String(currentJournalMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = journalDate === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const hasEntry = !!loveJournal[dateStr];

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => {
                        setJournalDate(dateStr);
                        playSweetPop();
                      }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer text-[10px] font-extrabold transition-all border ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-[#d4af37]/30 border-[#d4af37] text-white ring-2 ring-[#d4af37]/50'
                            : 'bg-[#FF69B4] border-[#FF1493] text-white ring-2 ring-[#FFC0CB]'
                          : isToday
                            ? 'bg-stone-200 dark:bg-stone-800 border-stone-400 text-[#5D3F6A] dark:text-white'
                            : isDarkMode
                              ? 'bg-black/20 border-transparent text-amber-100 hover:bg-black/40'
                              : 'bg-white/40 border-transparent text-[#5D3F6A] hover:bg-white/80'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasEntry && (
                        <span className="text-[8px] absolute bottom-0.5 animate-bounce text-red-500">❤️</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day Note Input & Details */}
              <div className={`p-3 rounded-2xl border space-y-2 mt-2 ${
                isDarkMode ? 'bg-[#120820]/80 border-[#d4af37]/20' : 'bg-white/60 border-pink-100/40'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black tracking-wider uppercase opacity-85">
                    Catatan: {new Date(journalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {loveJournal[journalDate] && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Hapus catatan jurnal ini?")) {
                          setLoveJournal(prev => {
                            const copy = { ...prev };
                            delete copy[journalDate];
                            localStorage.setItem('love_journal', JSON.stringify(copy));
                            return copy;
                          });
                          if (isFirebaseEnabled && db) {
                            deleteDoc(doc(db, "love_journal", journalDate))
                              .catch(err => console.error("Firestore delete error:", err));
                          }
                          playSweetPop();
                        }
                      }}
                      className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="Tulis kejutan manis atau memori hari ini di sini... ✍️🌸"
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  className={`w-full rounded-xl p-2.5 text-xs font-semibold h-16 outline-none resize-none transition-all ${
                    isDarkMode 
                      ? 'bg-[#1b102b] border border-[#d4af37]/30 text-white focus:border-[#d4af37]' 
                      : 'bg-white/80 border border-pink-100 text-[#5D3F6A] focus:border-[#FF69B4]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const textToSave = journalText;
                    setLoveJournal(prev => {
                      const updated = { ...prev, [journalDate]: textToSave };
                      localStorage.setItem('love_journal', JSON.stringify(updated));
                      return updated;
                    });
                    if (isFirebaseEnabled && db) {
                      setDoc(doc(db, "love_journal", journalDate), { text: textToSave, updatedAt: new Date().toISOString() })
                        .catch(err => console.error("Firestore save error:", err));
                    }
                    playSweetPop();
                    triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
                  }}
                  disabled={!journalText.trim()}
                  className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all duration-300 ${
                    journalText.trim()
                      ? isDarkMode
                        ? 'bg-[#d4af37] text-stone-950 hover:bg-amber-400'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:scale-[1.02]'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Jurnal Cinta 💖
                </button>
              </div>
            </div>
          </div>

          {/* 2. KALKULATOR KECOCOKAN NAMA */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase">Kalkulator Kecocokan Nama 💖</h3>
                <p className="text-[9px] opacity-75">Hitung persentase cinta berdua secara ilmiah & asyik</p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200/20">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider block">Nama Kamu:</span>
                  <input
                    type="text"
                    placeholder="Kevin"
                    value={calcName1}
                    onChange={(e) => setCalcName1(e.target.value)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-[#120820] border border-[#d4af37]/30 text-white placeholder:text-amber-200/20 focus:border-[#d4af37]' 
                        : 'bg-white/50 border border-pink-100 text-[#5D3F6A] focus:border-[#FF69B4]'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider block">Nama Pacar:</span>
                  <input
                    type="text"
                    placeholder="Aura"
                    value={calcName2}
                    onChange={(e) => setCalcName2(e.target.value)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-[#120820] border border-[#d4af37]/30 text-white placeholder:text-amber-200/20 focus:border-[#d4af37]' 
                        : 'bg-white/50 border border-pink-100 text-[#5D3F6A] focus:border-[#FF69B4]'
                    }`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!calcName1.trim() || !calcName2.trim()) return;
                  setIsCalculating(true);
                  setCalcResult(null);
                  playSweetPop();
                  
                  // Interactive calculation simulation
                  setTimeout(() => {
                    const combined = (calcName1 + calcName2).toLowerCase().replace(/\s+/g, '');
                    let sum = 0;
                    for (let i = 0; i < combined.length; i++) {
                      sum += combined.charCodeAt(i);
                    }
                    // Generate consistent romantic percentage between 70 and 100
                    const percent = 70 + (sum % 31);
                    setCalcResult(percent);
                    setIsCalculating(false);
                    
                    if (percent >= 95) {
                      setCalcMessage("Belahan Jiwa Sejati! Saling ditakdirkan oleh takdir kosmis alam semesta! 🌌🪐💍");
                    } else if (percent >= 85) {
                      setCalcMessage("Sangat Cocok! Chemistry kalian berdua luar biasa membara & harmonis! 🔥💘✨");
                    } else {
                      setCalcMessage("Saling Melengkapi! Cinta kalian tulus, hangat, & penuh kasih sayang! 🤗🌸💞");
                    }
                    
                    triggerConfetti();
                  }, 1200);
                }}
                disabled={isCalculating || !calcName1.trim() || !calcName2.trim()}
                className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  calcName1.trim() && calcName2.trim() && !isCalculating
                    ? isDarkMode
                      ? 'bg-[#d4af37] text-stone-950 hover:bg-amber-400'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:scale-[1.02]'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                }`}
              >
                {isCalculating ? (
                  <span className="flex items-center gap-1 animate-pulse">
                    Mengukur Detak Cinta... 💓
                  </span>
                ) : (
                  <>
                    <span>Hitung Persentase Cinta 💓</span>
                  </>
                )}
              </button>

              {/* Animated Compatibility Result display */}
              <AnimatePresence>
                {calcResult !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-3.5 rounded-2xl border text-center space-y-2 relative overflow-hidden ${
                      isDarkMode 
                        ? 'bg-gradient-to-b from-[#1b102b] to-black/40 border-[#d4af37]/35' 
                        : 'bg-gradient-to-b from-pink-50/50 to-rose-50/50 border-pink-100/50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <motion.span 
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.0 }}
                        className={`text-4xl font-black block tracking-tighter ${
                          isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'
                        }`}
                      >
                        {calcResult}%
                      </motion.span>
                      <span className="text-[9px] font-bold tracking-wider uppercase opacity-75">Tingkat Kecocokan</span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed italic px-2">
                      &ldquo;{calcMessage}&rdquo;
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 3. DAFTAR HARAPAN & BUCKET LIST BERSAMA */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase">Daftar Harapan & Goals ✈️</h3>
                  <p className="text-[9px] opacity-75">Rencana & mimpi romantis yang ingin kita capai berdua</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800/40 text-stone-500">
                {bucketList.filter(b => b.completed).length}/{bucketList.length} Selesai
              </span>
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200/20">
              {/* Add Goal Input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Contoh: Dinner di atap gedung romantis... 🌃🕯️"
                  value={newBucketText}
                  onChange={(e) => setNewBucketText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBucketText.trim()) {
                      const newGoal = { id: Date.now().toString(), text: newBucketText.trim(), completed: false };
                      setBucketList(prev => [...prev, newGoal]);
                      setNewBucketText('');
                      playSweetPop();
                    }
                  }}
                  className={`flex-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-[#120820] border border-[#d4af37]/30 text-white placeholder:text-amber-200/20' 
                      : 'bg-white/50 border border-pink-100 text-[#5D3F6A] placeholder:text-[#A07088]/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newBucketText.trim()) return;
                    const newGoal = { id: Date.now().toString(), text: newBucketText.trim(), completed: false };
                    setBucketList(prev => [...prev, newGoal]);
                    setNewBucketText('');
                    playSweetPop();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-[#d4af37] text-stone-950 hover:bg-amber-400' 
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                  }`}
                >
                  Tambah
                </button>
              </div>

              {/* Goal List Display */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {bucketList.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      goal.completed
                        ? 'opacity-65 dark:bg-stone-900/40 border-stone-200/10'
                        : isDarkMode
                          ? 'bg-[#120820]/40 border-[#d4af37]/15 text-amber-100'
                          : 'bg-white/50 border-pink-100/40 text-[#5D3F6A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setBucketList(prev => prev.map(b => b.id === goal.id ? { ...b, completed: !b.completed } : b));
                        playSweetPop();
                        if (!goal.completed) triggerConfetti();
                      }}
                      className="flex items-center gap-2 text-left cursor-pointer flex-1"
                    >
                      {goal.completed ? (
                        <CheckSquare className="w-4 h-4 text-pink-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                      <span className={`text-[11px] font-semibold ${goal.completed ? 'line-through decoration-pink-500/80 text-stone-400' : ''}`}>
                        {goal.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBucketList(prev => prev.filter(b => b.id !== goal.id));
                        playSweetPop();
                      }}
                      className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. STATISTIK SUASANA HATI (RECHARTS PIE CHART & LOG MOOD) */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <PieChart className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase">Statistik Suasana Hati Kita 📊</h3>
                <p className="text-[9px] opacity-75">Visualisasi interaktif perasaan yang kita rasakan akhir-akhir ini</p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200/20">
              
              {/* Log mood button bar */}
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-wider block opacity-75">Bagaimana Suasana Hatimu Hari Ini?</span>
                <div className="grid grid-cols-5 gap-1">
                  {Object.keys(moodStats).map((moodName) => {
                    const emoji = moodName.split(' ').pop() || '💖';
                    return (
                      <button
                        key={moodName}
                        type="button"
                        onClick={() => {
                          setMoodStats(prev => {
                            const updated = { ...prev, [moodName]: (prev[moodName] || 0) + 1 };
                            localStorage.setItem('love_mood_stats', JSON.stringify(updated));
                            return updated;
                          });
                          playSweetPop();
                          triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
                        }}
                        className={`py-1 rounded-xl text-center text-xs font-bold border transition-all active:scale-90 hover:scale-105 cursor-pointer ${
                          isDarkMode 
                            ? 'bg-[#120820] border-[#d4af37]/20 text-white hover:bg-black/40' 
                            : 'bg-white/60 border-pink-100 text-[#5D3F6A] hover:bg-white/80'
                        }`}
                        title={`Log ${moodName}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pie Chart Display */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.025 }}
                className="h-[140px] w-full flex items-center justify-center relative"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPieChart>
                    <Pie
                      data={Object.entries(moodStats).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {Object.entries(moodStats).map(([name], index) => {
                        const colors = isDarkMode
                          ? ['#d4af37', '#f3e5ab', '#ff9900', '#cc9900', '#e5c158']
                          : ['#FF1493', '#FF69B4', '#DA70D6', '#FFB6C1', '#BA55D3'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDarkMode ? '#1b102b' : '#ffffff',
                        border: isDarkMode ? '1px solid #d4af37' : '1px solid #FFC0CB',
                        borderRadius: '12px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f3e5ab' : '#5D3F6A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </RechartPieChart>
                </ResponsiveContainer>
                
                {/* Embedded Beautiful custom SVG representation for the Pie Chart slices */}
                <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none z-10">
                  <div className="flex gap-2 text-[8px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/40 dark:bg-black/40 border border-white/20 dark:border-stone-800 shadow-sm backdrop-blur-sm">
                    {Object.entries(moodStats).map(([name, value], i) => (
                      <span key={name} className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: isDarkMode ? ['#d4af37', '#f3e5ab', '#ff9900', '#cc9900', '#e5c158'][i % 5] : ['#FF1493', '#FF69B4', '#DA70D6', '#FFB6C1', '#BA55D3'][i % 5] }} />
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 5. GALERI KENANGAN POLAROID DECK */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Image className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase">Galeri Kenangan Indah Kita 📸</h3>
                  <p className="text-[9px] opacity-75">Abadikan momen manis & peluk kenangan selamanya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSweetPop();
                  // Trigger open settings camera panel directly
                  setIsSettingsOpen(true);
                  setTimeout(() => {
                    const cameraPanel = document.getElementById('camera-preview-anchor');
                    if (cameraPanel) cameraPanel.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-pink-200/40 cursor-pointer ${
                  isDarkMode ? 'bg-[#d4af37]/20 text-amber-200' : 'bg-pink-100 text-[#FF1493]'
                }`}
              >
                Ambil Foto
              </button>
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200/20">
              {memories.length === 0 ? (
                <div className="text-center py-6 space-y-1 text-stone-400">
                  <p className="text-xs font-semibold">Belum Ada Polaroid Kenangan 🖼️</p>
                  <p className="text-[9px]">Gunakan kamera atau unggah foto di panel Nama Kita di atas!</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin snap-x snap-mandatory">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMemoryPhoto(m.image);
                        playSweetPop();
                      }}
                      className={`flex-none w-32 bg-stone-50 border border-stone-200 p-1.5 pb-3 shadow-md hover:shadow-xl hover:-rotate-1 active:scale-95 transition-all cursor-pointer snap-start ${
                        isDarkMode ? 'dark:bg-stone-100 dark:border-stone-300' : ''
                      }`}
                      style={{
                        transform: `rotate(${(parseInt(m.id) % 5) - 2}deg)`
                      }}
                    >
                      <div className="relative aspect-square w-full bg-stone-200 overflow-hidden rounded-md border border-stone-300/40">
                        {m.type === 'video' ? (
                          <video
                            src={m.image}
                            controls
                            loop
                            muted
                            className="w-full h-full object-cover select-none"
                          />
                        ) : (
                          <img
                            src={m.image}
                            alt="Memori cinta"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover select-none"
                          />
                        )}
                        <span className="absolute bottom-1 right-1 text-base drop-shadow-sm select-none">{m.emoji}</span>
                      </div>
                      <div className="text-center pt-2 space-y-0.5 text-stone-700">
                        <p className="text-[9px] font-black leading-none uppercase tracking-wider">{m.date}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Hapus memori indah ini dari galeri?")) {
                              deleteMemory(m.id);
                            }
                          }}
                          className="text-[8px] font-extrabold text-red-500 hover:underline inline-block mt-1 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. GENERATOR SURAT CINTA AI */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase">Generator Surat Cinta AI ✍️</h3>
                  <p className="text-[9px] opacity-75">Tulis surat romantis personal bertenaga Gemini AI</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200/20">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-wider block">Milestone/Momen:</label>
                  <select
                    value={loveLetterMilestone}
                    onChange={(e) => setLoveLetterMilestone(e.target.value)}
                    className={`w-full rounded-xl px-2 py-1 text-[10px] font-bold outline-none border cursor-pointer ${
                      isDarkMode 
                        ? 'bg-[#120820] border-[#d4af37]/30 text-white' 
                        : 'bg-white/60 border-pink-100 text-[#5D3F6A]'
                    }`}
                  >
                    <option value="Hari Jadi ke-1">Hari Jadi ke-1 👑</option>
                    <option value="Satu Bulan Bersama">Satu Bulan Bersama 🌸</option>
                    <option value="Setahun Bersama">Setahun Bersama 🎉</option>
                    <option value="Hari Valentine">Hari Valentine 💖</option>
                    <option value="Ulang Tahun Dia">Ulang Tahun Dia 🎂</option>
                    <option value="Kangen Berat">Kangen Berat 🥺</option>
                    <option value="Minta Maaf">Minta Maaf 🫂</option>
                    <option value="Semangat Ujian/Kerja">Semangat Hubungan ⚡</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-wider block">Gaya Bahasa:</label>
                  <select
                    value={loveLetterStyle}
                    onChange={(e) => setLoveLetterStyle(e.target.value)}
                    className={`w-full rounded-xl px-2 py-1 text-[10px] font-bold outline-none border cursor-pointer ${
                      isDarkMode 
                        ? 'bg-[#120820] border-[#d4af37]/30 text-white' 
                        : 'bg-white/60 border-pink-100 text-[#5D3F6A]'
                    }`}
                  >
                    <option value="Sangat Romantis & Mendalam">Sangat Romantis 💖</option>
                    <option value="Manis, Lucu & Menggemaskan">Lucu & Menggemaskan 🥰</option>
                    <option value="Puitis & Syahdu">Puitis & Syahdu 📖</option>
                    <option value="Singkat, Padat & Penuh Makna">Singkat & Bermakna ✨</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingLetter}
                onClick={async () => {
                  playSweetPop();
                  setIsGeneratingLetter(true);
                  setLetterError("");
                  try {
                    const res = await fetch("/api/generate-letter", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        partnerName,
                        senderName,
                        milestone: loveLetterMilestone,
                        style: loveLetterStyle
                      })
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    setGeneratedLetter(data.letter);
                  } catch (e: any) {
                    setLetterError(e.message || "Gagal membuat surat cinta.");
                  } finally {
                    setIsGeneratingLetter(false);
                  }
                }}
                className={`w-full py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isGeneratingLetter
                    ? 'opacity-60 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                }`}
              >
                {isGeneratingLetter ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Menulis dengan Cinta...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" />
                    Hasilkan Surat Cinta AI ✨
                  </>
                )}
              </button>

              {letterError && (
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold text-center">
                  ⚠️ {letterError}
                </div>
              )}

              {generatedLetter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-2xl border text-left space-y-2 relative ${
                    isDarkMode
                      ? 'bg-[#120820]/60 border-[#d4af37]/20 text-amber-100'
                      : 'bg-white/60 border-pink-100 text-[#5D3F6A]'
                  }`}
                >
                  <p className="text-[10px] font-semibold leading-relaxed whitespace-pre-wrap italic">
                    {generatedLetter}
                  </p>
                  
                  <div className="flex justify-end gap-1.5 pt-2 border-t border-dashed border-stone-200/10">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLetter);
                        playSweetPop();
                        setCopiedLetter(true);
                        setTimeout(() => setCopiedLetter(false), 2000);
                      }}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        isDarkMode ? 'bg-[#d4af37]/20 text-amber-300' : 'bg-pink-50 text-[#FF1493]'
                      }`}
                    >
                      {copiedLetter ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Salin Surat
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toggleFavoriteMessage(generatedLetter);
                        playSweetPop();
                      }}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        isDarkMode ? 'bg-[#d4af37]/30 text-amber-100' : 'bg-pink-100 text-[#FF1493]'
                      }`}
                    >
                      <Heart className="w-3 h-3 fill-current text-pink-500 dark:text-amber-400" />
                      Simpan ke Favorit
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* 7. KUIS CINTA INTERAKTIF AI */}
          <div className={`backdrop-blur-md border rounded-[24px] p-4 shadow-md transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-[#1e112a]/80 border-[#d4af37]/30 text-[#f3e5ab]' 
              : 'bg-white/40 border-white/60 text-[#5D3F6A]'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className={`w-4 h-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#FF69B4]'}`} />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase">Kuis Cinta Interaktif AI 🎮</h3>
                <p className="text-[9px] opacity-75">Jawab pertanyaan tentang pacarmu untuk meraih bonus poin!</p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200/20 text-center">
              {quizQuestions.length === 0 ? (
                <div className="py-4 space-y-2">
                  <p className="text-[10px] font-bold leading-relaxed max-w-xs mx-auto">
                    Siap membuktikan seberapa dalam kamu mengenal {partnerName || 'dia'}? Hasilkan kuis bertenaga AI dan kumpulkan bonus poin cinta! 💖
                  </p>
                  <button
                    type="button"
                    disabled={isGeneratingQuiz}
                    onClick={async () => {
                      playSweetPop();
                      setIsGeneratingQuiz(true);
                      setQuizError("");
                      try {
                        const res = await fetch("/api/generate-quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ partnerName })
                        });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        setQuizQuestions(data.quiz);
                        setCurrentQuestionIndex(0);
                        setQuizScore(0);
                        setSelectedAnswer(null);
                        setShowQuizResults(false);
                      } catch (e: any) {
                        setQuizError(e.message || "Gagal membuat kuis cinta.");
                      } finally {
                        setIsGeneratingQuiz(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 mx-auto cursor-pointer hover:scale-105 active:scale-95 ${
                      isGeneratingQuiz
                        ? 'opacity-60 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-[#d4af37] text-stone-950 font-black'
                          : 'bg-[#FF69B4] text-white'
                    }`}
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Meracik Soal Spesial...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        Mulai Kuis Cinta Baru 🎮
                      </>
                    )}
                  </button>
                  {quizError && (
                    <p className="text-[9px] font-semibold text-red-500 mt-2">⚠️ {quizError}</p>
                  )}
                </div>
              ) : showQuizResults ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4 space-y-3"
                >
                  <div className="text-3xl">🏆</div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider">Hasil Ujian Cinta!</h4>
                    <p className="text-[10px] mt-1 font-semibold">
                      Kamu berhasil menjawab <strong className={isDarkMode ? 'text-amber-300' : 'text-pink-500'}>{quizScore} dari 5</strong> pertanyaan dengan benar!
                    </p>
                  </div>
                  <p className="text-[9px] italic max-w-xs mx-auto leading-relaxed">
                    {quizScore === 5
                      ? "Luar biasa! Kamu adalah pasangan paling perhatian di dunia. Hubungan kalian sungguh diliputi keselarasan mutlak! 💑👑"
                      : quizScore >= 3
                        ? "Hebat sekali! Hubungan kalian sangat kuat dan kamu sangat memahami kebiasaan-kebiasaan lucunya. Pertahankan! 🥰"
                        : "Romantis itu perjalanan panjang! Ini adalah kesempatan indah untuk mengobrol lebih dalam dan saling mengenal satu sama lain malam ini. 🫂🥂"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playSweetPop();
                      setQuizQuestions([]);
                    }}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                      isDarkMode ? 'bg-[#d4af37]/20 text-amber-200 border border-[#d4af37]/40' : 'bg-pink-100 text-[#FF1493] border border-pink-200'
                    }`}
                  >
                    Main Lagi 🔄
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3.5 text-left">
                  <div className="flex justify-between items-center text-[8px] font-black tracking-widest uppercase opacity-75">
                    <span>Soal {currentQuestionIndex + 1} dari 5</span>
                    <span className={isDarkMode ? 'text-amber-300' : 'text-pink-500'}>Skor: {quizScore}</span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="h-1 w-full bg-stone-200 dark:bg-[#120820] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${isDarkMode ? 'bg-amber-400' : 'bg-pink-500'}`}
                      style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs font-bold leading-relaxed">
                    {quizQuestions[currentQuestionIndex].question}
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {quizQuestions[currentQuestionIndex].options.map((opt, idx) => {
                      const isAnswered = selectedAnswer !== null;
                      const isCorrect = idx === quizQuestions[currentQuestionIndex].answerIndex;
                      const isSelected = idx === selectedAnswer;

                      let btnStyle = isDarkMode
                        ? 'bg-[#120820]/40 border-[#d4af37]/10 text-amber-100 hover:bg-[#120820]'
                        : 'bg-white/60 border-pink-100 text-[#5D3F6A] hover:bg-white';

                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = 'bg-green-500/20 border-green-500 text-green-600 font-extrabold dark:text-green-400';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-500/20 border-red-500 text-red-600 font-extrabold dark:text-red-400';
                        } else {
                          btnStyle = 'opacity-50 cursor-not-allowed';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => {
                            playSweetPop();
                            setSelectedAnswer(idx);
                            const correct = idx === quizQuestions[currentQuestionIndex].answerIndex;
                            if (correct) {
                              setQuizScore(prev => prev + 1);
                              setClickCount(prev => prev + 10); // Reward 10 bonus points!
                              
                              // Trigger a custom heart particle burst as celebratory effect
                              const rect = document.getElementById(`quiz-opt-${idx}`)?.getBoundingClientRect();
                              if (rect && canvasRef.current) {
                                // Simple trigger for heart particles at quiz spot
                                try {
                                  for (let i = 0; i < 8; i++) {
                                    particlesRef.current.push({
                                      x: canvasRef.current.width / 2 + (Math.random() * 40 - 20),
                                      y: canvasRef.current.height / 2 + (Math.random() * 40 - 20),
                                      size: Math.random() * 8 + 5,
                                      color: isDarkMode ? '#d4af37' : '#FF1493',
                                      opacity: 1.0,
                                      vx: Math.random() * 4 - 2,
                                      vy: -Math.random() * 4 - 2,
                                      rotation: Math.random() * 360,
                                      spin: Math.random() * 2 - 1
                                    });
                                  }
                                } catch (e) {}
                              }
                            }
                          }}
                          id={`quiz-opt-${idx}`}
                          className={`w-full text-left p-2.5 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswer !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-2.5 rounded-xl border text-[9px] font-semibold leading-relaxed ${
                        selectedAnswer === quizQuestions[currentQuestionIndex].answerIndex
                          ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-500'
                      }`}
                    >
                      <p className="font-extrabold mb-0.5">
                        {selectedAnswer === quizQuestions[currentQuestionIndex].answerIndex
                          ? '✨ Jawaban Benar (+10 Poin Cinta!)'
                          : '💔 Jawaban Kurang Tepat'}
                      </p>
                      <p className="opacity-90">{quizQuestions[currentQuestionIndex].explanation}</p>

                      <button
                        type="button"
                        onClick={() => {
                          playSweetPop();
                          if (currentQuestionIndex < 4) {
                            setCurrentQuestionIndex(prev => prev + 1);
                            setSelectedAnswer(null);
                          } else {
                            setShowQuizResults(true);
                          }
                        }}
                        className={`mt-2.5 w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                          isDarkMode ? 'bg-[#d4af37] text-stone-950 font-black' : 'bg-[#FF69B4] text-white'
                        }`}
                      >
                        {currentQuestionIndex < 4 ? 'Pertanyaan Berikutnya ➡️' : 'Lihat Hasil Kuis 🏆'}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Special Letters Row */}
        <div className="w-full space-y-3 prevent-burst">
          <div className="flex items-center gap-1.5 px-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 fill-pink-300" />
            <span className="text-[10px] font-extrabold text-[#8B5E83] uppercase tracking-widest">Kotak Surat Rahasia Kita</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SPECIAL_LETTERS.map((letter) => (
              <button
                key={letter.id}
                onClick={() => setActiveLetter(letter)}
                className="bg-white/30 hover:bg-white/50 active:scale-95 border border-white/50 rounded-2xl p-3 shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF0F5] border border-pink-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  {renderLetterIcon(letter.icon)}
                </div>
                <span className="text-[9px] font-bold text-[#5D3F6A] leading-tight block">
                  {letter.title}
                </span>
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* Footer Details */}
      <footer className="relative z-20 py-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.25em] text-[#A07088] uppercase opacity-75">
          <span>Dibuat Penuh Cinta</span>
          <span className="text-[#FF69B4] animate-ping">❤</span>
          <span>Untukmu</span>
        </div>
      </footer>

      {/* Letter Modal Overlay */}
      <AnimatePresence>
        {activeLetter && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-rose-950/30 backdrop-blur-sm"
            onClick={() => setActiveLetter(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              onClick={(e) => e.stopPropagation()} // prevent clicking backdrop from closing
              className="relative w-full max-w-md bg-stone-50 border border-amber-100/50 rounded-3xl p-6 shadow-2xl shadow-stone-900/40 text-stone-800 max-h-[85vh] overflow-y-auto flex flex-col justify-between"
              style={{
                backgroundImage: 'radial-gradient(#e2e2e2 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveLetter(null)}
                className="absolute top-4 right-4 bg-stone-200/80 hover:bg-stone-300/80 p-1.5 rounded-full text-stone-600 hover:text-stone-950 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Envelope styling details */}
              <div className="space-y-4 pt-2">
                <div className="border-b-2 border-dashed border-stone-200 pb-3 flex items-center gap-2">
                  <MailOpen className="w-6 h-6 text-rose-500" />
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 block">Surat Istimewa</span>
                    <h3 className="font-serif text-xl font-bold text-stone-800 leading-none">{activeLetter.subject}</h3>
                  </div>
                </div>

                {/* Main letter content */}
                <div className="font-sans leading-relaxed text-sm text-stone-700 whitespace-pre-line py-2 min-h-[140px]">
                  {formatText(activeLetter.content, partnerName, senderName)}
                </div>

                {/* Stamp / Signature Block */}
                <div className="border-t border-dashed border-stone-200 pt-3 flex justify-between items-center bg-white/40 p-3 rounded-2xl">
                  <div className="text-[11px] italic text-[#FF69B4] font-bold max-w-[65%]">
                    &ldquo;{formatText(activeLetter.tagline, partnerName, senderName)}&rdquo;
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-stone-400 block tracking-wider uppercase">Peluk hangat,</span>
                    <span className="font-serif text-lg font-bold text-[#FF69B4] leading-none block">{senderName || "Pacarmu"} ❤️</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immersive Shared Message Overlay */}
      <AnimatePresence>
        {sharedMsgData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white/95 backdrop-blur-lg border border-pink-100 rounded-[36px] p-6 text-center shadow-2xl relative overflow-hidden prevent-burst"
            >
              <div className="absolute top-[-40px] left-[-40px] w-24 h-24 rounded-full bg-[#FFB6C1]/30 blur-xl pointer-events-none" />
              <div className="absolute bottom-[-40px] right-[-40px] w-24 h-24 rounded-full bg-[#E0BFB8]/40 blur-xl pointer-events-none" />
              
              <div className="flex flex-col items-center justify-center gap-4 py-3">
                <div className="w-16 h-16 rounded-full bg-[#FFF0F5] border border-pink-200 flex items-center justify-center shadow-inner animate-bounce">
                  <MailOpen className="w-8 h-8 text-[#FF1493] fill-[#FFC0CB]" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#FF1493] tracking-[0.25em] uppercase">Surat Cinta Spesial 💌</span>
                  <h2 className="text-xl font-black text-[#5D3F6A] leading-tight">
                    Untuk {sharedMsgData.to || "Sayang"}
                  </h2>
                </div>

                <div className="w-full h-[1px] bg-pink-100/75 my-1" />

                <div className="bg-[#FFF0F5]/50 border border-pink-100 rounded-2xl p-5 text-xs md:text-sm font-semibold text-[#5D3F6A] leading-relaxed shadow-inner italic">
                  "{sharedMsgData.msg}"
                </div>

                <div className="w-full h-[1px] bg-pink-100/75 my-1" />
                
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Dengan Sejuta Rindu Dari,</span>
                  <span className="font-serif text-lg font-extrabold text-[#FF1493]">{sharedMsgData.from || "Seseorang"} ❤️</span>
                </div>

                <button
                  onClick={handleDismissShared}
                  className="mt-4 w-full bg-gradient-to-r from-[#FF69B4] to-[#FF1493] hover:from-[#FF1493] hover:to-[#FF69B4] active:scale-95 text-white text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Buka Aplikasi Kita</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className={`w-full max-w-sm rounded-[32px] p-6 text-center border shadow-2xl relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#1b102b] to-[#120820] border-red-500/50 text-[#f3e5ab]' 
                  : 'bg-gradient-to-br from-white to-red-50/30 border-red-200 text-[#5D3F6A]'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shadow-inner animate-pulse">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-500 tracking-[0.2em] uppercase">Konfirmasi Reset 🚨</span>
                  <h3 className="text-lg font-black leading-tight">
                    Hapus Seluruh Data?
                  </h3>
                </div>

                <p className={`text-xs leading-relaxed font-semibold ${
                  isDarkMode ? 'text-amber-100/70' : 'text-stone-500'
                }`}>
                  Tindakan ini akan menghapus semua nama, tanggal jadian, poin cinta, riwayat klik harian, kejutan terjadwal, dan Galeri Kenangan kalian secara permanen. Tindakan ini tidak bisa dibatalkan!
                </p>

                <div className="grid grid-cols-2 gap-3 w-full mt-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isDarkMode 
                        ? 'bg-[#1b102b] border-[#d4af37]/30 text-[#f3e5ab] hover:bg-[#28183f]' 
                        : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleResetAllData}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-md transition-all cursor-pointer"
                  >
                    Ya, Reset Semua
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Poin Cinta Confirmation Dialog Modal */}
      <AnimatePresence>
        {showResetPoinConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className={`w-full max-w-sm rounded-[32px] p-6 text-center border shadow-2xl relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#1b102b] to-[#120820] border-pink-500/50 text-[#f3e5ab]' 
                  : 'bg-gradient-to-br from-white to-pink-50/30 border-pink-200 text-[#5D3F6A]'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center shadow-inner animate-pulse">
                  <RotateCcw className="w-7 h-7 text-pink-500" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-pink-500 tracking-[0.2em] uppercase">Konfirmasi Reset Poin 💖</span>
                  <h3 className="text-lg font-black leading-tight">
                    Reset Poin Cinta?
                  </h3>
                </div>

                <p className={`text-xs leading-relaxed font-semibold ${
                  isDarkMode ? 'text-amber-100/70' : 'text-stone-500'
                }`}>
                  Apakah kamu yakin ingin mereset Poin Cinta kembali ke 0? Gelar Kebucinanmu akan dimulai dari awal lagi, tetapi nama kalian, Jurnal Cinta, dan Galeri Kenangan akan tetap aman! 🥰
                </p>

                <div className="grid grid-cols-2 gap-3 w-full mt-3">
                  <button
                    onClick={() => setShowResetPoinConfirm(false)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isDarkMode 
                        ? 'bg-[#1b102b] border-[#d4af37]/30 text-[#f3e5ab] hover:bg-[#28183f]' 
                        : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setClickCount(0);
                      localStorage.setItem('love_clicks', '0');
                      
                      // Reset Target Ciuman (daily kisses) points and celebration state in real-time as requested
                      const todayStr = new Date().toISOString().split('T')[0];
                      setDailyKisses(0);
                      localStorage.setItem(`love_daily_kisses_${todayStr}`, '0');
                      
                      setKissTargetCelebrated(false);
                      localStorage.setItem(`love_kiss_target_celebrated_${todayStr}`, 'false');
                      
                      setDailyTargetCelebrated(false);
                      localStorage.setItem(`love_daily_target_celebrated_${todayStr}`, 'false');

                      setShowResetPoinConfirm(false);
                      playSweetPop();
                    }}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-600 active:scale-95 text-white shadow-md transition-all cursor-pointer"
                  >
                    Ya, Reset Poin
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Surprise Message Modal Overlay */}
      <AnimatePresence>
        {activeSurpriseMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className={`w-full max-w-sm rounded-[32px] p-6 text-center border shadow-2xl relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#1b102b] to-[#120820] border-[#d4af37] text-[#f3e5ab]' 
                  : 'bg-gradient-to-br from-white to-pink-50/50 border-pink-200 text-[#5D3F6A]'
              }`}
            >
              {/* Decorative sparkles */}
              <div className="absolute top-4 right-4 animate-bounce">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-[#d4af37]/10 flex items-center justify-center shadow-inner animate-heartbeat">
                  <Heart className="w-9 h-9 text-pink-500 fill-pink-400" />
                </div>
                
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold tracking-[0.25em] uppercase ${
                    isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'
                  }`}>Kejutan Hari Ini 💖</span>
                  <h3 className="text-xl font-black leading-tight">
                    Pesan Spesial Untukmu!
                  </h3>
                </div>

                <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#d4af37]/20' : 'bg-pink-100'} my-1`} />

                <p className={`text-sm font-bold leading-relaxed px-2 italic text-center ${
                  isDarkMode ? 'text-white' : 'text-[#5D3F6A]'
                }`}>
                  "{activeSurpriseMessage}"
                </p>

                <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#d4af37]/20' : 'bg-pink-100'} my-1`} />

                <button
                  onClick={() => {
                    setActiveSurpriseMessage(null);
                    playSweetPop();
                  }}
                  className={`w-full mt-2 active:scale-95 text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer tracking-widest uppercase flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-amber-400 to-[#d4af37] text-[#1e112a]' 
                      : 'bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                  <span>Terima Kasih, Sayang 🥰</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polaroid Lightbox Full Screen Modal */}
      <AnimatePresence>
        {selectedMemoryPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
            onClick={() => setSelectedMemoryPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-sm w-full bg-stone-50 p-3 pb-8 rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setSelectedMemoryPhoto(null);
                  playSweetPop();
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="aspect-square w-full rounded-md overflow-hidden bg-stone-100 border border-stone-200">
                {selectedMemoryPhoto.startsWith('data:video/') ? (
                  <video
                    src={selectedMemoryPhoto}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedMemoryPhoto}
                    alt="Full polaroid memori"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="text-center pt-4">
                <p className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Polaroid Kenangan Cinta Kita</p>
                <p className="text-xs font-serif italic text-stone-700 mt-1">“Momen indah yang diabadikan selamanya”</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Click Target Reached Celebration Modal */}
      <AnimatePresence>
        {showDailyTargetReached && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b102b]/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className={`w-full max-w-sm rounded-[32px] p-6 text-center border shadow-2xl relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#1b102b] to-[#120820] border-[#d4af37] text-[#f3e5ab]' 
                  : 'bg-gradient-to-br from-white to-pink-50 border-pink-200 text-[#5D3F6A]'
              }`}
            >
              <div className="absolute top-4 right-4 animate-bounce">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-[#d4af37]/10 flex items-center justify-center shadow-inner animate-heartbeat">
                  <PartyPopper className="w-9 h-9 text-pink-500" />
                </div>
                
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold tracking-[0.25em] uppercase ${
                    isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'
                  }`}>Target Harian Tercapai 🎯</span>
                  <h3 className="text-xl font-black leading-tight">
                    Wow! Luar Biasa, Sayang! 🎉
                  </h3>
                </div>

                <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#d4af37]/20' : 'bg-pink-100'} my-1`} />

                <p className="text-xs font-semibold leading-relaxed px-2 text-center">
                  Hari ini kamu sudah mengirimkan lebih dari 15 detak cinta tulus kepada pasanganmu! Semoga hubungan kalian selalu erat, hangat, & bahagia selamanya! ❤️✨
                </p>

                <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#d4af37]/20' : 'bg-pink-100'} my-1`} />

                <button
                  onClick={() => {
                    setShowDailyTargetReached(false);
                    playSweetPop();
                  }}
                  className={`w-full mt-2 active:scale-95 text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer tracking-widest uppercase flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-amber-400 to-[#d4af37] text-[#1e112a]' 
                      : 'bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                  <span>Selesai & Lanjutkan 🥰</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heartbeat Shake Full Screen Overlay */}
      <AnimatePresence>
        {showShakeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-pink-500/10 dark:bg-[#d4af37]/5 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.4, 0], opacity: [0, 0.85, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-[120px] filter drop-shadow-lg animate-heartbeat"
            >
              💖
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Ciuman Harian Tercapai Celebration Modal */}
      <AnimatePresence>
        {showKissCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b102b]/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className={`w-full max-w-sm rounded-[32px] p-6 text-center border shadow-2xl relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#1b102b] to-[#120820] border-[#d4af37] text-[#f3e5ab]' 
                  : 'bg-gradient-to-br from-white to-pink-50 border-pink-200 text-[#5D3F6A]'
              }`}
            >
              <div className="absolute top-4 right-4 animate-bounce">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-[#d4af37]/10 flex items-center justify-center shadow-inner animate-bounce">
                  <span className="text-3xl">💋</span>
                </div>
                
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold tracking-[0.25em] uppercase ${
                    isDarkMode ? 'text-[#d4af37]' : 'text-[#FF1493]'
                  }`}>Target Ciuman Tercapai 💋</span>
                  <h3 className="text-xl font-black leading-tight">
                    Ciuman Manis Dikirim! 😘💞
                  </h3>
                </div>

                <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#d4af37]/20' : 'bg-pink-100'} my-1`} />

                <p className="text-xs font-semibold leading-relaxed px-2 text-center">
                  Hari ini kamu berhasil mengirimkan {kissTarget} ciuman manis terindah untuk {partnerName || 'sayang'}! Setiap kecupan adalah bukti betapa besar rindumu hari ini. 💖💏
                </p>

                <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#d4af37]/20' : 'bg-pink-100'} my-1`} />

                <button
                  onClick={() => {
                    setShowKissCelebration(false);
                    playSweetPop();
                  }}
                  className={`w-full mt-2 active:scale-95 text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer tracking-widest uppercase flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-amber-400 to-[#d4af37] text-[#1e112a]' 
                      : 'bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                  <span>Terima Kasih, Sayang 😘</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
