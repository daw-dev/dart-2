import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { translations } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { usePosition, TRENTO_LANDMARKS } from '@/hooks/use-position';

export interface RandomArtItem {
  id: string | number;
  name: string;
  label: string;
  fullTitle: string;
  artist: string;
  preview: string;
  category?: string;
}

const MODERN_ART_POOL: RandomArtItem[] = [
  {
    id: 'm-1',
    name: 'Cyber_Murales.png',
    label: 'Cyberpunk Murales',
    fullTitle: 'Murales Cyberpunk Neon',
    artist: 'NeoStreetArt',
    preview: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=800&auto=format&fit=crop&q=80',
    category: 'StreetArt',
  },
  {
    id: 'm-2',
    name: 'Neon_Dragon.png',
    label: 'Neon Dragon 3D',
    fullTitle: 'Dragone Olografico Fluorescente',
    artist: 'FutureVibes',
    preview: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    category: 'Ologramma',
  },
  {
    id: 'm-3',
    name: 'Geometric_Prism.png',
    label: 'Prisma Cinetico 3D',
    fullTitle: 'Poliedro Cinetico Astratto',
    artist: 'ShapeLab3D',
    preview: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    category: '3DArt',
  },
  {
    id: 'm-4',
    name: 'Fluid_Wave.png',
    label: 'Onda Cinetica Fluida',
    fullTitle: 'Scultura Fluida Iridescente',
    artist: 'DigitalMesh',
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    category: 'Scultura3D',
  },
  {
    id: 'm-5',
    name: 'Pop_Graffiti.png',
    label: 'Pop Art Spectrum',
    fullTitle: 'Murales Pop Graffiti',
    artist: 'SprayMaster',
    preview: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    category: 'StreetArt',
  },
  {
    id: 'm-6',
    name: 'Quantum_Vortex.png',
    label: 'Vortice Quantico',
    fullTitle: 'Portale Spazio-Temporale Olografico',
    artist: 'VoxelStudio',
    preview: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&auto=format&fit=crop&q=80',
    category: 'Ologramma',
  },
  {
    id: 'm-7',
    name: 'Cyber_Mecha.png',
    label: 'Robot Cyber Mecha',
    fullTitle: 'Guardiano Cibernetico 3D',
    artist: 'GlitchCrafter',
    preview: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    category: '3DArt',
  },
  {
    id: 'm-8',
    name: 'Neon_Street.png',
    label: 'Neon Skyline',
    fullTitle: 'Affreschi Luminosi Notturni',
    artist: 'UrbanGlow',
    preview: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&auto=format&fit=crop&q=80',
    category: 'StreetArt',
  },
  {
    id: 'm-9',
    name: 'Glass_Crystal.png',
    label: 'Cristallo Etereo',
    fullTitle: 'Cristallo Olografico Fluttuante',
    artist: 'PrismDesign',
    preview: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=800&auto=format&fit=crop&q=80',
    category: '3DArt',
  },
  {
    id: 'm-10',
    name: 'Synth_Arcade.png',
    label: 'Retro Synth Arcade',
    fullTitle: 'Arcade Olografico Anni 80',
    artist: 'PixelWave',
    preview: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    category: 'PixelArt',
  },
  {
    id: 'm-11',
    name: 'Bioluminescent_Flora.png',
    label: 'Flora Bioluminescente',
    fullTitle: 'Edera Luminosa Neon 3D',
    artist: 'EcoDigital',
    preview: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    category: 'BioArt',
  },
  {
    id: 'm-12',
    name: 'Origami_Polygon.png',
    label: 'Origami Low-Poly',
    fullTitle: 'Scultura Geometrica Low-Poly',
    artist: 'VoxelArt',
    preview: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    category: '3DArt',
  },
];

export async function fetchRandomWebArtworks(count = 3): Promise<RandomArtItem[]> {
  // Shuffle modern art pool for fast, high-res, vibrant modern results
  const shuffled = [...MODERN_ART_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function PublishScreen() {
  const { publishDArtWork, language, currentUser } = useAuth();
  const { userLocation, nearestLandmark, setUserLocation } = usePosition();
  const t = translations[language];
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [scanProgress, setScanProgress] = useState(0);

  // Random Web Artworks: Street Art, 3D Digital & Holograms
  const [randomArts, setRandomArts] = useState<RandomArtItem[]>(MODERN_ART_POOL.slice(0, 3));
  const [isLoadingArts, setIsLoadingArts] = useState(false);

  // Asset selection & Upload
  const [assetName, setAssetName] = useState('Murales_Cyber.png');
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(MODERN_ART_POOL[0].preview);

  // Spatial Manipulation
  const [scale, setScale] = useState<number>(1.2);
  const [scaleText, setScaleText] = useState<string>('1.20');
  const [rotation, setRotation] = useState<number>(35);
  const [rotationText, setRotationText] = useState<string>('35');

  // Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(nearestLandmark);
  const [hashtagsText, setHashtagsText] = useState('#StreetArt #3D');
  const [license, setLicense] = useState<'Creative Commons BY 4.0' | 'Creative Commons BY-NC 4.0' | 'Tutti i diritti riservati'>('Creative Commons BY 4.0');
  const [durationHours, setDurationHours] = useState<number>(48);

  const loadRandomArts = async () => {
    setIsLoadingArts(true);
    try {
      const arts = await fetchRandomWebArtworks(3);
      setRandomArts(arts);
      if (arts.length > 0 && !uploadedImageUri) {
        setUploadedImageUri(arts[0].preview);
        setAssetName(arts[0].name);
      }
    } finally {
      setIsLoadingArts(false);
    }
  };

  React.useEffect(() => {
    loadRandomArts();
  }, []);

  const startScanning = () => {
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep(2);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handleFinishPublish = () => {
    if (!currentUser) {
      alert('Devi essere autenticato per pubblicare un D\'ArtWork.');
      return;
    }
    if (!title.trim()) {
      alert('Inserisci un titolo per il tuo D\'ArtWork.');
      return;
    }
    const tags = hashtagsText
      .split(' ')
      .map((tag) => tag.replace('#', '').trim())
      .filter((tag) => tag.length > 0);

    // Exact persistent simulated GPS coordinates
    const latitude = userLocation.latitude;
    const longitude = userLocation.longitude;

    publishDArtWork(
      title,
      description,
      locationName || nearestLandmark,
      tags,
      uploadedImageUri || undefined,
      license,
      latitude,
      longitude,
      durationHours,
      scale,
      rotation
    );

    router.replace('/');
  };

  if (!currentUser) {
    return (
      <View style={[styles.scrollView, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <View style={[styles.guestGuardCard, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
          <SymbolView name="lock.fill" size={36} tintColor={theme.primary} />
          <ThemedText type="subtitle" style={{ marginTop: Spacing.two, textAlign: 'center', fontWeight: '900' }}>
            Accesso Richiesto
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginVertical: Spacing.two, lineHeight: 20 }}>
            Per posizionare e pubblicare un D'ArtWork geolocalizzato nello spazio 3D di Trento è necessario accedere con un account.
          </ThemedText>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.primary, width: '100%', alignItems: 'center', paddingVertical: Spacing.two }]}
            onPress={() => router.replace('/profile')}
          >
            <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
              Accedi o Registrati
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, { marginTop: Spacing.two, width: '100%', alignItems: 'center', borderColor: theme.cardBorderSubtle }]}
            onPress={() => router.replace('/')}
          >
            <ThemedText type="smallBold">
              Torna alla Mappa
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: safeAreaInsets.top + Spacing.two }]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorderSubtle }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Torna indietro"
            hitSlop={12}
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            }}
          >
            <SymbolView name="arrow.left" size={26} tintColor={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
              {t.createArtworkBtn}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
              Passo {step} di 5 • {step === 1 ? 'Scansione Spaziale' : step === 2 ? 'Upload Foto / Asset' : step === 3 ? 'Scala & Rotazione' : step === 4 ? 'Metadati & Licenza' : 'Pubblicazione Live'}
            </ThemedText>
          </View>
        </View>

        {/* Step Indicator Bar */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                {
                  backgroundColor: step >= s ? theme.primary : theme.surfaceSubtle,
                  borderColor: step >= s ? theme.primary : theme.cardBorderSubtle,
                },
              ]}
            >
              <ThemedText
                type="code"
                style={{ color: step >= s ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '700' }}
              >
                {s}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Main Card with Step Content */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorderSubtle,
            },
          ]}
        >
          {/* Step 1: Spatial Scanning */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <ThemedText type="smallBold">1. Scansione Spaziale Ambientale</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Inquadra lo spazio circostante per calibrare l'ambiente per il rendering AR dell'opera.
              </ThemedText>

              <View style={[styles.scanViewport, { borderColor: scanProgress >= 100 ? '#10B981' : theme.cardBorderSubtle }]}>
                {/* Point cloud grid simulation */}
                <View style={styles.gridOverlay}>
                  <ThemedText type="code" style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>
                    {scanProgress < 100 ? `Calibrazione spazio: ${scanProgress}%` : 'Ambiente AR Calibrato (100%)'}
                  </ThemedText>
                </View>
              </View>

              {/* Simulation Note for Spatial Scanning */}
              <View style={[styles.simStepCard, { backgroundColor: theme.isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="code" style={{ color: '#6366F1', fontWeight: '800', fontSize: 11 }}>
                    Scansione Spaziale Simulata (Prototipo Web)
                  </ThemedText>
                </View>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4, lineHeight: 14 }}>
                  Nell'app reale nativa su smartphone: i sensori LiDAR/ToF e la fotocamera scansionano la geometria fisica del muro o della piazza circostante (Point Cloud Mesh) per calcolare il piano di ancoraggio e le occlusioni.
                </ThemedText>
              </View>

              {scanProgress === 0 ? (
                <Pressable style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={startScanning}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Avvia Scansione Spaziale
                  </ThemedText>
                </Pressable>
              ) : scanProgress < 100 ? (
                <ThemedText type="code" style={{ textAlign: 'center', marginVertical: Spacing.two }}>
                  Analisi spaziale e piani in corso ({scanProgress}%)...
                </ThemedText>
              ) : (
                <Pressable style={[styles.primaryBtn, { backgroundColor: '#10B981' }]} onPress={() => setStep(2)}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Spazio Calibrato • Avanti &gt;
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {/* Step 2: Select Random Web Artworks / Assets */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <ThemedText type="smallBold">2. Scegli l'Opera / Asset Virtuale</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Seleziona uno dei D'ArtWork generati casualmente o pescane altri 3 dal catalogo.
              </ThemedText>

              {/* Simulation Note for Asset Selection */}
              <View style={[styles.simStepCard, { backgroundColor: theme.isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="code" style={{ color: '#6366F1', fontWeight: '800', fontSize: 11 }}>
                    Selezione Asset Simulata (Prototipo)
                  </ThemedText>
                </View>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4, lineHeight: 14 }}>
                  Nel prototipo didattico le opere sono caricate dal catalogo virtuale. Nell'app reale, l'artista può importare i propri modelli 3D (.glb/.usdz), texture volumetriche e shader procedurali per il rendering real-time.
                </ThemedText>
              </View>

              {/* Preview of current selected image/asset */}
              {uploadedImageUri && (
                <View style={[styles.previewBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}>
                  <Image source={{ uri: uploadedImageUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={{ flex: 1, paddingLeft: Spacing.two }}>
                    <ThemedText type="smallBold" numberOfLines={1}>{assetName}</ThemedText>
                    <ThemedText type="code" style={{ color: '#10B981', marginTop: 2 }}>Opera selezionata</ThemedText>
                  </View>
                </View>
              )}

              {/* Random Web Artworks */}
              <View style={{ marginTop: Spacing.two, gap: Spacing.one }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: Spacing.one }}>
                    <ThemedText type="smallBold">
                      3 Opere Casuali dal Web
                    </ThemedText>
                    <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                      Street Art, Murales & Sculture 3D Digitali
                    </ThemedText>
                  </View>
                  <Pressable
                    disabled={isLoadingArts}
                    style={[
                      styles.refreshArtsBtn,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                      isLoadingArts && { opacity: 0.5 },
                    ]}
                    onPress={loadRandomArts}
                  >
                    <ThemedText type="code" style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
                      {isLoadingArts ? 'Caricamento...' : 'Pescane altre 3'}
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.sampleGrid}>
                  {randomArts.map((art) => (
                    <Pressable
                      key={art.id}
                      style={[
                        styles.sampleCard,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                        uploadedImageUri === art.preview && {
                          borderColor: theme.primary,
                          backgroundColor: theme.isDark ? '#3B2456' : '#EDE9FE',
                        },
                      ]}
                      onPress={() => {
                        setAssetName(art.name);
                        setUploadedImageUri(art.preview);
                        if (!title || randomArts.some((r) => r.fullTitle === title)) {
                          setTitle(art.fullTitle);
                        }
                        if (!description || description.startsWith('Ispirato a "')) {
                          setDescription(`Ispirato all'opera "${art.fullTitle}" di ${art.artist}.`);
                        }
                        const tag = art.category ? art.category.replace(/[^a-zA-Z0-9]/g, '') : 'Scultura';
                        setHashtagsText(`#${tag || 'Arte3D'} #StreetArt #AR`);
                      }}
                    >
                      <Image source={{ uri: art.preview }} style={styles.sampleThumb} resizeMode="cover" />
                      <View style={{ width: '100%', gap: 2 }}>
                        <ThemedText type="smallBold" numberOfLines={2} style={styles.sampleLabel}>
                          {art.label}
                        </ThemedText>
                        <ThemedText type="code" themeColor="textSecondary" numberOfLines={1} style={{ fontSize: 9, textAlign: 'center' }}>
                          {art.artist}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.navRow}>
                <Pressable style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]} onPress={() => setStep(1)}>
                  <ThemedText type="smallBold">&lt; Indietro</ThemedText>
                </Pressable>
                <Pressable style={[styles.primaryBtn, { backgroundColor: theme.primary, flex: 1 }]} onPress={() => setStep(3)}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{t.wizardNext} &gt;</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 3: AR Spatial Placement & Manipulation */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <ThemedText type="smallBold">3. Scala & Rotazione Spaziale</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Regola le dimensioni e l'inclinazione prospettica desiderata per l'opera nello spazio AR.
              </ThemedText>

              {/* Simulation Note for Spatial Manipulation */}
              <View style={[styles.simStepCard, { backgroundColor: theme.isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="code" style={{ color: '#6366F1', fontWeight: '800', fontSize: 11 }}>
                    Calibrazione & Gesti AR Simulati
                  </ThemedText>
                </View>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4, lineHeight: 14 }}>
                  Nel prototipo la scala e la rotazione si regolano con slider e numeri. Nell'app reale l'artista interagisce con gesture touch direttamente nell'inquadratura AR (pinch per la scala, rotazione a due dita e snap al piano rilevato).
                </ThemedText>
              </View>

              <View style={[styles.placementStage, { borderColor: theme.cardBorderSubtle }]}>
                {uploadedImageUri ? (
                  <Image
                    source={{ uri: uploadedImageUri }}
                    style={[
                      styles.manipulatedImage,
                      {
                        transform: [
                          { scale },
                          { rotate: `${rotation}deg` },
                        ],
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <ThemedText type="code" style={{ fontSize: 13, color: '#94A3B8' }}>D'Art AR Preview</ThemedText>
                )}
                <View style={styles.stageOverlay}>
                  <ThemedText type="code" style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                    Scala: {scale.toFixed(2)}x • Rotazione: {rotation}°
                  </ThemedText>
                </View>
              </View>

              {/* Scale Slider & Direct Numeric Input */}
              <View style={styles.controlRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText type="smallBold">Scala Spaziale (0.1x – 5.0x):</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}
                      onPress={() => {
                        const next = Math.max(0.1, parseFloat((scale - 0.05).toFixed(2)));
                        setScale(next);
                        setScaleText(next.toFixed(2));
                      }}
                    >
                      <ThemedText type="smallBold">-</ThemedText>
                    </Pressable>

                    <View style={[styles.numInputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                      <TextInput
                        style={[styles.numTextInput, { color: theme.primary }]}
                        value={scaleText}
                        onChangeText={(val) => {
                          setScaleText(val);
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed) && parsed > 0) {
                            setScale(Math.min(5.0, Math.max(0.1, parsed)));
                          }
                        }}
                        onBlur={() => {
                          const parsed = parseFloat(scaleText);
                          if (isNaN(parsed) || parsed <= 0) {
                            setScale(1.0);
                            setScaleText('1.00');
                          } else {
                            const clamped = Math.min(5.0, Math.max(0.1, parsed));
                            setScale(clamped);
                            setScaleText(clamped.toFixed(2));
                          }
                        }}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />
                      <ThemedText type="code" style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>x</ThemedText>
                    </View>

                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}
                      onPress={() => {
                        const next = Math.min(5.0, parseFloat((scale + 0.05).toFixed(2)));
                        setScale(next);
                        setScaleText(next.toFixed(2));
                      }}
                    >
                      <ThemedText type="smallBold">+</ThemedText>
                    </Pressable>
                  </View>
                </View>

                {Platform.OS === 'web' && (
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.05"
                    value={scale}
                    onChange={(e: any) => {
                      const val = parseFloat(e.target.value);
                      setScale(val);
                      setScaleText(val.toFixed(2));
                    }}
                    style={{
                      width: '100%',
                      accentColor: theme.primary,
                      cursor: 'pointer',
                      height: 6,
                      marginTop: 6,
                      marginBottom: 6,
                    }}
                  />
                )}
              </View>

              {/* Rotation Slider & Direct Numeric Input */}
              <View style={styles.controlRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText type="smallBold">Inclinazione & Rotazione (0° – 360°):</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}
                      onPress={() => {
                        const next = (rotation - 5 + 360) % 360;
                        setRotation(next);
                        setRotationText(next.toString());
                      }}
                    >
                      <ThemedText type="smallBold">-</ThemedText>
                    </Pressable>

                    <View style={[styles.numInputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                      <TextInput
                        style={[styles.numTextInput, { color: theme.primary }]}
                        value={rotationText}
                        onChangeText={(val) => {
                          setRotationText(val);
                          const parsed = parseInt(val, 10);
                          if (!isNaN(parsed)) {
                            setRotation(((parsed % 360) + 360) % 360);
                          }
                        }}
                        onBlur={() => {
                          const parsed = parseInt(rotationText, 10);
                          if (isNaN(parsed)) {
                            setRotation(0);
                            setRotationText('0');
                          } else {
                            const mod = ((parsed % 360) + 360) % 360;
                            setRotation(mod);
                            setRotationText(mod.toString());
                          }
                        }}
                        keyboardType="number-pad"
                        selectTextOnFocus
                      />
                      <ThemedText type="code" style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>°</ThemedText>
                    </View>

                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}
                      onPress={() => {
                        const next = (rotation + 5) % 360;
                        setRotation(next);
                        setRotationText(next.toString());
                      }}
                    >
                      <ThemedText type="smallBold">+</ThemedText>
                    </Pressable>
                  </View>
                </View>

                {Platform.OS === 'web' && (
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={rotation}
                    onChange={(e: any) => {
                      const val = parseInt(e.target.value, 10);
                      setRotation(val);
                      setRotationText(val.toString());
                    }}
                    style={{
                      width: '100%',
                      accentColor: theme.primary,
                      cursor: 'pointer',
                      height: 6,
                      marginTop: 6,
                      marginBottom: 6,
                    }}
                  />
                )}
              </View>

              <View style={styles.navRow}>
                <Pressable style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]} onPress={() => setStep(2)}>
                  <ThemedText type="smallBold">&lt; Indietro</ThemedText>
                </Pressable>
                <Pressable style={[styles.primaryBtn, { backgroundColor: theme.primary, flex: 1 }]} onPress={() => setStep(4)}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{t.wizardNext} &gt;</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 4: Metadata & Creative Commons */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <ThemedText type="smallBold">4. Titolo, Descrizione & Licenza</ThemedText>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                placeholder={t.titleRequired}
                placeholderTextColor={theme.placeholder}
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, minHeight: 70, textAlignVertical: 'top' }]}
                placeholder={t.description}
                placeholderTextColor={theme.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                placeholder={t.hashtags}
                placeholderTextColor={theme.placeholder}
                value={hashtagsText}
                onChangeText={setHashtagsText}
              />

              {/* Duration Picker */}
              <ThemedText type="smallBold" style={{ marginTop: Spacing.one }}>
                Durata Esposizione:
              </ThemedText>
              <View style={styles.btnGroup}>
                {[24, 48, 72, 96].map((hrs) => (
                  <Pressable
                    key={hrs}
                    style={[styles.smallBtn, durationHours === hrs && { backgroundColor: theme.primary }]}
                    onPress={() => setDurationHours(hrs)}
                  >
                    <ThemedText type="code" style={{ color: durationHours === hrs ? '#FFF' : theme.text, fontSize: 11, fontWeight: '700' }}>
                      {hrs} Ore
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* License Selector */}
              <ThemedText type="smallBold" style={{ marginTop: Spacing.one, marginBottom: 4 }}>
                {t.licenseLabel}
              </ThemedText>
              {[
                'Creative Commons BY 4.0',
                'Creative Commons BY-NC 4.0',
                'Tutti i diritti riservati',
              ].map((lic) => (
                <Pressable
                  key={lic}
                  style={[
                    styles.licenseOption,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                    license === lic && { backgroundColor: theme.licenseBg, borderColor: theme.primary },
                  ]}
                  onPress={() => setLicense(lic as any)}
                >
                  <ThemedText type="code" style={{ fontWeight: '700', color: license === lic ? theme.licenseText : theme.text }}>
                    {lic}
                  </ThemedText>
                </Pressable>
              ))}

              <View style={styles.navRow}>
                <Pressable style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]} onPress={() => setStep(3)}>
                  <ThemedText type="smallBold">&lt; Indietro</ThemedText>
                </Pressable>
                <Pressable style={[styles.primaryBtn, { backgroundColor: theme.primary, flex: 1 }]} onPress={() => setStep(5)}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{t.wizardNext} &gt;</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 5: Location & Confirmation */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <ThemedText type="smallBold">5. Posizione GPS a Trento & Pubblicazione</ThemedText>

              {/* Current persistent GPS coordinate badge */}
              <View style={[styles.gpsBadge, { backgroundColor: theme.surfaceSubtle, borderColor: theme.primary }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    Coordinate GPS Attuali (Simulatore Posizione):
                  </ThemedText>
                  <ThemedText type="code" style={{ fontSize: 12, fontWeight: '800' }}>
                    Lat: {userLocation.latitude.toFixed(6)} • Lng: {userLocation.longitude.toFixed(6)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Punto di riferimento più vicino: {nearestLandmark}
                  </ThemedText>
                </View>
              </View>

              {/* Custom location name input */}
              <ThemedText type="smallBold" style={{ marginTop: Spacing.one }}>
                Nome del Luogo / Punto d'Interesse:
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                placeholder="Es. Piazza Dante, Vicolo del Duomo, ecc."
                placeholderTextColor={theme.placeholder}
                value={locationName}
                onChangeText={setLocationName}
              />

              {/* Quick Landmark Anchor Buttons */}
              <ThemedText type="small" themeColor="textSecondary">
                Oppure ancora la tua posizione su un luogo iconico di Trento:
              </ThemedText>
              <View style={styles.locationGrid}>
                {TRENTO_LANDMARKS.map((lm) => (
                  <Pressable
                    key={lm.name}
                    style={[
                      styles.locationCard,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                      locationName === lm.name && { backgroundColor: theme.primary + '22', borderColor: theme.primary },
                    ]}
                    onPress={() => {
                      setLocationName(lm.name);
                      setUserLocation({ latitude: lm.latitude, longitude: lm.longitude });
                    }}
                  >
                    <ThemedText type="smallBold" style={{ color: locationName === lm.name ? theme.primary : theme.text }}>
                      {lm.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* Simulation Note for Geolocation & Publishing */}
              <View style={[styles.simStepCard, { backgroundColor: theme.isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="code" style={{ color: '#6366F1', fontWeight: '800', fontSize: 11 }}>
                    Pubblicazione & Ancoraggio Geospaziale
                  </ThemedText>
                </View>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4, lineHeight: 14 }}>
                  Nel prototipo didattico l'opera viene georeferenziata alle coordinate simulate attuali e salvata su MongoDB Atlas. Nell'app reale le coordinate sono acquisite con precisione centimetrica via GPS/GNSS con geofencing e firma crittografica dell'autore.
                </ThemedText>
              </View>

              {/* Final Summary Card */}
              <View style={[styles.summaryBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}>
                <ThemedText type="smallBold">Riepilogo Pubblicazione D'ArtWork:</ThemedText>
                <ThemedText type="small">Titolo: <ThemedText type="smallBold">{title || '(Senza titolo)'}</ThemedText></ThemedText>
                <ThemedText type="small">Artista: @{currentUser?.username}</ThemedText>
                <ThemedText type="small">Luogo: {locationName || nearestLandmark}</ThemedText>
                <ThemedText type="code" style={{ fontSize: 11, color: theme.primary }}>
                  Coordinate GPS: [{userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}]
                </ThemedText>
                <ThemedText type="small">Orientamento AR: {scale}x scala • {rotation}° rotazione</ThemedText>
                <ThemedText type="small">Durata Esposizione: {durationHours} ore</ThemedText>
                <ThemedText type="small">Licenza d'uso: {license}</ThemedText>
              </View>

              <View style={styles.navRow}>
                <Pressable style={[styles.secondaryBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]} onPress={() => setStep(4)}>
                  <ThemedText type="smallBold">&lt; Indietro</ThemedText>
                </Pressable>
                <Pressable style={[styles.primaryBtn, { backgroundColor: '#10B981', flex: 1 }]} onPress={handleFinishPublish}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Pubblica D'ArtWork
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 600,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.one,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  stepContainer: {
    gap: Spacing.two,
  },
  scanViewport: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: Spacing.one,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.one,
  },
  gridOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  uploadButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Spacing.one,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    marginVertical: Spacing.one,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: Spacing.one,
  },
  refreshArtsBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sampleCard: {
    flex: 1,
    padding: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    alignItems: 'center',
    gap: Spacing.one,
  },
  sampleThumb: {
    width: '100%',
    height: 70,
    borderRadius: 6,
  },
  sampleLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  placementStage: {
    height: 200,
    backgroundColor: '#0F172A',
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  manipulatedImage: {
    width: 130,
    height: 130,
  },
  stageOverlay: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  controlRow: {
    gap: Spacing.one,
  },
  btnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  smallBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    height: 32,
  },
  numInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: 8,
    height: 32,
    gap: 2,
  },
  numTextInput: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 42,
    textAlign: 'center',
    padding: 0,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 13,
  },
  licenseOption: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    marginBottom: Spacing.one,
  },
  locationGrid: {
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    gap: 4,
    marginVertical: Spacing.one,
  },
  simStepCard: {
    borderWidth: 1.5,
    borderRadius: Spacing.one + 2,
    padding: Spacing.two,
    marginVertical: Spacing.one,
  },
  guestGuardCard: {
    maxWidth: 420,
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    alignItems: 'center',
  },
});
