
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wifi, Check, CreditCard, Trash2, Plus, ArrowLeft, Sparkles } from 'lucide-react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import AppText from '../../components/common/AppText';
import {
  createSubscription,
  savePaymentMethod,
  listPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getSubscriptionStatus,
} from '../../utils/subscription';
import type { SettingStackParamList } from './Settingnnavigator';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<SettingStackParamList, 'SubscriptionPayment'>;

const BRAND_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
};

type SavedCard = {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
};

type EnteredCardDetails = {
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}


function friendlyErrorMessage(serverError: string | undefined, fallback: string): string {
  switch (serverError) {
    case 'too_many_requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'concurrent_request':
      return 'This request was already being processed. Please tap "Pay" again.';
    case 'payment_method_mismatch':
      return "This card doesn't match this account. Please add a new card.";
    case 'subscription_mismatch':
      return "This subscription doesn't match this account.";
    default:
      return fallback;
  }
}

function CardGlow() {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.05] });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity, transform: [{ scale }] }]}>
      <View style={styles.blobTopLeft}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="blobPurple" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#A855F7" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#blobPurple)" />
        </Svg>
      </View>

      {/* <View style={styles.blobBottomRight}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="blobPink" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#EC4899" stopOpacity={0.7} />
              <Stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#blobPink)" />
        </Svg>
      </View> */}

      {/* <View style={styles.blobMidRight}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="blobBlue" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#4F7BF7" stopOpacity={0.65} />
              <Stop offset="100%" stopColor="#4F7BF7" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#blobBlue)" />
        </Svg>
      </View> */}
    </Animated.View>
  );
}

export default function SubscriptionPaymentScreen({ navigation }: Props) {
  const { confirmPayment } = useStripe();
  const { isSubscribed, setOptimisticSubscribed } = useAuth();
  const [statusChecking, setStatusChecking] = useState(true);
  const [alreadyPaidThisPeriod, setAlreadyPaidThisPeriod] = useState(isSubscribed);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [enteredCard, setEnteredCard] = useState<EnteredCardDetails | null>(null);
  const [revealedLast4, setRevealedLast4] = useState<string | null>(null);
  const [revealedExpiry, setRevealedExpiry] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rememberCard, setRememberCard] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  useEffect(() => {

    if (isSubscribed) {
      setAlreadyPaidThisPeriod(true);
      setStatusChecking(false);
      return;
    }

    (async () => {
      try {
        const res: any = await getSubscriptionStatus();
        const status = res?.status;
        const periodEnd = res?.currentPeriodEnd ?? null;

        const stillInPaidWindow =
          !!periodEnd && new Date(periodEnd).getTime() > Date.now();

        if (status === 'active' || stillInPaidWindow) {
          setAlreadyPaidThisPeriod(true);
          setCurrentPeriodEnd(periodEnd);
          setOptimisticSubscribed(true);
        }
      } catch (err) {
        console.log('[subscription] status check failed:', err);
      } finally {
        setStatusChecking(false);
      }
    })();
  }, [isSubscribed, setOptimisticSubscribed]);

  useEffect(() => {
    if (alreadyPaidThisPeriod) return;
    (async () => {
      try {
        const cards = await listPaymentMethods();
        setSavedCards(cards);
        const defaultCard = cards.find((c) => c.is_default);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        } else {
          setShowNewCardForm(true);
        }
      } catch (err) {
        console.log('[cards] failed to load saved cards:', err);
        setShowNewCardForm(true);
      } finally {
        setLoadingCards(false);
      }
    })();
  }, [alreadyPaidThisPeriod]);

  useEffect(() => {
    if (selectedCardId && !showNewCardForm) {
      const card = savedCards.find((c) => c.id === selectedCardId);
      if (card) {
        setRevealedLast4(card.card_last4);
        setRevealedExpiry(
          `${String(card.card_exp_month).padStart(2, '0')}/${String(card.card_exp_year).slice(-2)}`
        );
      }
    } else if (showNewCardForm) {
      if (!enteredCard) {
        setRevealedLast4(null);
        setRevealedExpiry(null);
      }
    }
  }, [selectedCardId, showNewCardForm, savedCards, enteredCard]);

  const handleDeleteCard = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePaymentMethod(id);
      setSavedCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedCardId === id) {
        setSelectedCardId(null);
        setShowNewCardForm(true);
      }
    } catch (err: any) {
      const serverError = err?.response?.data?.error;
      setErrorMsg(friendlyErrorMessage(serverError, "Couldn't remove the card. Please try again."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectCard = async (id: string) => {
    setSelectedCardId(id);
    setShowNewCardForm(false);
    setErrorMsg(null);
    const card = savedCards.find((c) => c.id === id);
    if (card && !card.is_default) {
      try {
        await setDefaultPaymentMethod(id);
        setSavedCards((prev) => prev.map((c) => ({ ...c, is_default: c.id === id })));
      } catch {
      
      }
    }
  };

  const handleCreateSubscriptionError = (err: any): boolean => {
    const serverError = err?.response?.data?.error;

    if (serverError === 'already_paid_this_period' || serverError === 'already_subscribed') {
      const periodEnd = err?.response?.data?.currentPeriodEnd ?? null;
      setAlreadyPaidThisPeriod(true);
      setCurrentPeriodEnd(periodEnd);
      setErrorMsg(null);
      return true;
    }

    if (
      serverError === 'too_many_requests' ||
      serverError === 'concurrent_request' ||
      serverError === 'payment_method_mismatch'
    ) {
      setErrorMsg(friendlyErrorMessage(serverError, 'Something went wrong. Please try again.'));
      return true;
    }

    return false;
  };

  const payWithSavedCard = async () => {
    const card = savedCards.find((c) => c.id === selectedCardId);
    if (!card) return;

    setProcessing(true);
    setErrorMsg(null);
    try {
      const { clientSecret, status } = await createSubscription(card.stripe_payment_method_id);

      if (status !== 'succeeded') {

        const { error } = await confirmPayment(clientSecret, {
          paymentMethodType: 'Card',
          paymentMethodData: { paymentMethodId: card.stripe_payment_method_id },
        });
        if (error) {
          setErrorMsg(error.message);
          setProcessing(false);
          return;
        }
      }

      setOptimisticSubscribed(true);
      setAlreadyPaidThisPeriod(true);

      setSuccess(true);
      setTimeout(() => navigation.navigate('SettingTab', { justSubscribed: true }), 1400);
    } catch (err: any) {
      setProcessing(false);
      if (handleCreateSubscriptionError(err)) return;
      setErrorMsg(err.message ?? 'Something went wrong');
    }
  };

  const payWithNewCard = async () => {
    if (!cardholderName.trim()) {
      setErrorMsg('Enter the name on the card');
      return;
    }
    if (!cardComplete) {
      setErrorMsg('Please complete all card details');
      return;
    }

    setProcessing(true);
    setErrorMsg(null);

    try {
      const { clientSecret, customerId } = await createSubscription();

      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: { billingDetails: { name: cardholderName.trim() } },
      });

      if (error) {
        setErrorMsg(error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent) {
        const pm = (paymentIntent as any).paymentMethod;
        const paymentMethodId = typeof pm === 'string' ? pm : pm?.id;

        if (enteredCard?.last4) setRevealedLast4(enteredCard.last4);
        if (enteredCard?.expiryMonth && enteredCard?.expiryYear) {
          setRevealedExpiry(
            `${String(enteredCard.expiryMonth).padStart(2, '0')}/${String(enteredCard.expiryYear).slice(-2)}`
          );
        }

        if (rememberCard && paymentMethodId && customerId) {
          try {
            await savePaymentMethod({
              stripeCustomerId: customerId,
              paymentMethodId,
              cardBrand: enteredCard?.brand,
              cardLast4: enteredCard?.last4,
              cardExpMonth: enteredCard?.expiryMonth,
              cardExpYear: enteredCard?.expiryYear,
            });
          } catch (saveErr: any) {
            console.log('[stripe] failed to save card (non-fatal):', saveErr?.message);
          }
        }

        setOptimisticSubscribed(true);
        setAlreadyPaidThisPeriod(true);

        setSuccess(true);
        setTimeout(() => navigation.navigate('SettingTab', { justSubscribed: true }), 1400);
      }
    } catch (err: any) {
      setProcessing(false);
      if (handleCreateSubscriptionError(err)) return;
      setErrorMsg(err.message ?? 'Something went wrong');
    }
  };

  const handlePay = () => {
    if (alreadyPaidThisPeriod) return;
    if (selectedCardId && !showNewCardForm) {
      payWithSavedCard();
    } else {
      payWithNewCard();
    }
  };

  const canPay =
    !alreadyPaidThisPeriod &&
    (selectedCardId && !showNewCardForm
      ? true
      : cardholderName.trim().length > 0 && cardComplete);

  const previewName =
    selectedCardId && !showNewCardForm ? 'Saved card' : cardholderName || 'Your name';

  if (statusChecking) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  if (alreadyPaidThisPeriod) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center mt-4 mb-6">
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-brand-bgCardSoft items-center justify-center mr-3">
              <ArrowLeft size={18} color="#E2E8F0" />
            </Pressable>
            <AppText className="font-heading text-display-lg text-brand-textPrimary">
              My Card
            </AppText>
          </View>

          <View style={styles.lockedCard}> 
            <View style={styles.lockedIconWrap}>
              <Sparkles size={22} color="#FFFFFF" />
            </View>
            <AppText className="font-sansBold text-body-lg text-white mt-4">
              You're already subscribed
            </AppText>
            <AppText className="font-sans text-body-sm text-white/70 mt-2 text-center">
              {currentPeriodEnd
                ? `You've already paid for this billing period. Your next payment is due on ${formatDate(currentPeriodEnd)}.`
                : "You've already paid for this billing period."}
            </AppText>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-6 py-4 items-center rounded-btn bg-brand-primaryLight/50">
            <AppText className="font-sansMedium text-body-lg text-brand-white">
              Back to Settings
            </AppText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-brand-primaryLight/15 items-center justify-center mb-4">
          <Check size={28} color="#7C3AED" strokeWidth={3} />
        </View>
        <AppText className="font-sansMedium text-body-lg text-brand-textPrimary">
          Payment Successful
        </AppText>
        <AppText className="font-sans text-body-sm text-brand-textMuted mt-1">
          Welcome to Premium
        </AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
            <StatusBar
        translucent={false}
        backgroundColor="#0C1422"
        barStyle="light-content"
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View className="flex-row items-center mt-4 mb-6">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            className="w-9 h-9 rounded-full bg-brand-bgCardSoft items-center justify-center mr-3">
            <ArrowLeft size={18} color="#E2E8F0" />
          </Pressable>
          <AppText className="font-heading text-display-lg text-brand-textPrimary">
            My Card
          </AppText>
        </View>

        {/* Premium card mockup — gradient surface, diagonal sheen, pulsing glow behind it */}
        <View style={styles.cardGlowWrap}>
          <CardGlow />

          <View style={styles.cardPreview}>
            <Svg style={StyleSheet.absoluteFillObject} width="0%" height="100%">
              <Defs>
                <LinearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#9333EA" stopOpacity={1} />
                  <Stop offset="55%" stopColor="#7C3AED" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#4C1D95" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width="100%" height="100%" fill="url(#cardBg)" rx={22} />
            </Svg>

            <View style={styles.cardSheen} pointerEvents="none" />
            <View style={styles.cardBorder} pointerEvents="none" />

            <View className="flex-row justify-between items-start">
              <Wifi size={20} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
              <View style={styles.cardBrandBadge}>
                <CreditCard size={16} color="#FFFFFF" />
              </View>
            </View>

            <AppText style={styles.cardNumberText}>
              {revealedLast4 ? `••••  ••••  ••••  ${revealedLast4}` : '••••  ••••  ••••  ••••'}
            </AppText>

            <View className="flex-row justify-between items-end">
              <View>
                <AppText style={styles.cardLabel}>Card holder name</AppText>
                <AppText style={styles.cardValue} numberOfLines={1}>{previewName}</AppText>
              </View>
              <View>
                <AppText style={styles.cardLabel}>Expiry date</AppText>
                <AppText style={styles.cardValue}>{revealedExpiry ?? '--/--'}</AppText>
              </View>
              <View style={styles.chip} />
            </View>
          </View>
        </View>

        <AppText className="font-sansMedium text-body-sm text-brand-textSecondary mt-6 mb-2">
          Saved Cards
        </AppText>

        {loadingCards ? (
          <View className="py-6 items-center">
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : (
          <>
            {savedCards.map((card) => {
              const isSelected = selectedCardId === card.id && !showNewCardForm;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => handleSelectCard(card.id)}
                  className="flex-row items-center px-4 py-3.5 rounded-card mb-2.5"
                  style={[styles.savedCardRow, isSelected && styles.savedCardRowActive]}>
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  <CreditCard size={18} color="#94A3B8" style={{ marginHorizontal: 10 }} />

                  <View className="flex-1">
                    <AppText className="font-sansMedium text-body-sm text-brand-textPrimary">
                      {(BRAND_LABEL[card.card_brand] ?? card.card_brand ?? 'Card')} •••• {card.card_last4}
                    </AppText>
                    <AppText className="font-sans text-body-xs text-brand-textMuted mt-0.5">
                      Expires {String(card.card_exp_month).padStart(2, '0')}/{String(card.card_exp_year).slice(-2)}
                      {card.is_default ? '  ·  Default' : ''}
                    </AppText>
                  </View>

                  <Pressable
                    onPress={() => handleDeleteCard(card.id)}
                    hitSlop={10}
                    disabled={deletingId === card.id}
                    className="w-8 h-8 items-center justify-center rounded-full">
                    {deletingId === card.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Trash2 size={16} color="#64748B" />
                    )}
                  </Pressable>
                </Pressable>
              );
            })}

            {!showNewCardForm && (
              <Pressable
                onPress={() => {
                  setShowNewCardForm(true);
                  setSelectedCardId(null);
                }}
                className="flex-row items-center px-4 py-3.5 rounded-card mb-2.5"
                style={styles.addCardRow}>
                <View style={styles.addIconWrap}>
                  <Plus size={16} color="#A855F7" />
                </View>
                <AppText className="font-sansMedium text-body-sm text-brand-textSecondary ml-2.5">
                  Add new card
                </AppText>
              </Pressable>
            )}
          </>
        )}

        {showNewCardForm && (
          <View className="mt-2">
            <AppText className="font-sans text-body-sm text-brand-textSecondary mb-2">
              Card holder name
            </AppText>
            <TextInput
              value={cardholderName}
              onChangeText={(t) => {
                setCardholderName(t);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="John Carter"
              placeholderTextColor="#64748B"
              autoCapitalize="words"
              style={styles.pillInput}
            />

            <AppText className="font-sans text-body-sm text-brand-textSecondary mt-4 mb-2">
              Card number, expiry and CVV
            </AppText>
            <View style={styles.cardFieldWrapper}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: '4242 4242 4242 4242', expiration: 'MM/YY', cvc: 'CVC' }}
                cardStyle={{
                  backgroundColor: '#1A2740',
                  textColor: '#FFFFFF',
                  placeholderColor: '#64748B',
                  borderWidth: 0,
                  fontSize: 15,
                }}
                style={styles.cardField}
                onCardChange={(details) => {
                  setCardComplete(details.complete);
                  if (errorMsg) setErrorMsg(null);

                  if (details.last4) {
                    setEnteredCard({
                      brand: details.brand,
                      last4: details.last4,
                      expiryMonth: details.expiryMonth,
                      expiryYear: details.expiryYear,
                    });
                    setRevealedLast4(details.last4);
                    if (details.expiryMonth && details.expiryYear) {
                      setRevealedExpiry(
                        `${String(details.expiryMonth).padStart(2, '0')}/${String(details.expiryYear).slice(-2)}`
                      );
                    }
                  }
                }}
              />
            </View>

            {savedCards.length > 0 && (
              <Pressable
                onPress={() => {
                  setShowNewCardForm(false);
                  const defaultCard = savedCards.find((c) => c.is_default) ?? savedCards[0];
                  setSelectedCardId(defaultCard.id);
                }}
                className="mt-3 self-start">
                <AppText className="font-sansMedium text-body-sm text-brand-accent">
                  ← Use a saved card
                </AppText>
              </Pressable>
            )}

            <Pressable
              onPress={() => setRememberCard((v) => !v)}
              className="flex-row items-center mt-4">
              <View style={[styles.checkbox, rememberCard && styles.checkboxChecked]}>
                {rememberCard && <Check size={12} color="#7C3AED" strokeWidth={3} />}
              </View>
              <AppText className="font-sansMedium text-body-sm text-brand-textSecondary ml-2">
                Remember my card
              </AppText>
            </Pressable>
          </View>
        )}

        {errorMsg ? (
          <View className="mt-3 px-3 py-2.5 rounded-card bg-red-500/10">
            <AppText className="font-sans text-body-sm text-red-400">{errorMsg}</AppText>
          </View>
        ) : null}

        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPress={handlePay}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={processing || !canPay}
            className="mt-6 py-4 items-center rounded-btn flex-row justify-center bg-brand-primaryLight"
            style={{ opacity: processing || !canPay ? 0.5 : 1 }}>
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <AppText className="font-sansMedium text-body-lg text-brand-white">
                Pay $20.00
              </AppText>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    backgroundColor: '#7C3AE930',
    borderRadius: 20,
    padding: 24,
    borderWidth:1,
    borderColor:'#7C3AED',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 0,
  },
  lockedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardGlowWrap: {
    position: 'relative',
    paddingVertical: 14,
  },
  cardGlowHalo: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
  },
  cardPreview: {
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 0,
  },
 
  cardSheen: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: '70%',
    height: '220%',
 
    transform: [{ rotate: '20deg' }],
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cardBrandBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumberText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: '#FFFFFF',
    marginTop: 28,
    marginBottom: 22,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardValue: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', maxWidth: 140 },
  chip: {
    width: 28,
    height: 21,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  savedCardRow: {
    backgroundColor: '#161F33',
    borderWidth: 1,
    borderColor: '#1E2A40',
  },
  savedCardRowActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#1E1B3A',
  },
  addCardRow: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#1E2A40',
  },
  addIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#7C3AED' },
  pillInput: {
    backgroundColor: '#1A2740',
    borderRadius: 24,
    paddingHorizontal: 18,
    height: 50,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A3F5C',
  },
  cardFieldWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A3F5C',
  },
  cardField: { width: '100%', height: 50 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: 'transparent' },
});

