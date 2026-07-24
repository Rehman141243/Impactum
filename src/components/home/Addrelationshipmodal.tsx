
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput,TouchableOpacity, ScrollView,KeyboardAvoidingView, Platform, Animated, Easing, Dimensions,BackHandler,StyleSheet,Modal,} from 'react-native';
import { X, ChevronDown, Check } from 'lucide-react-native';
import AppText from '../common/AppText';
import { apiClient } from '../../utils/axiosClient';
import { useToast } from '../../context/ToastContext';

interface FormData {
  yourName: string;
  relationshipType: string;
  otherPersonName: string;
  otherPersonEmail: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  meaningText: string;
}

interface FormErrors {
  yourName?: string;
  relationshipType?: string;
  otherPersonName?: string;
  otherPersonEmail?: string;
  dob?: string;
  meaningText?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUserName?: string;
}

const RELATIONSHIP_TYPES = [
  'Brothers', 'Sisters', 'Brother & Sister', 'Friends', 'Romantic',
  'Marriage', 'Son & Dad', 'Son & Mom', 'Daughter & Dad', 'Daughter & Mom',
  'Colleagues', 'Mentor & Mentee',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const MIN_AGE = 16;
const MAX_AGE = 120;
const MIN_MEANING_LENGTH = 10;
const MAX_MEANING_LENGTH = 1000;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function emptyForm(name: string): FormData {
  return {
    yourName: name,
    relationshipType: '',
    otherPersonName: '',
    otherPersonEmail: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    meaningText: '',
  };
}

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  return true;
}

function calculateAge(day: number, month: number, year: number): number {
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}

function RelationshipDropdown({
  value, onSelect, error,
}: {
  value: string;
  onSelect: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setPos({ top: y + height + 4, left: x, width });
      setOpen(true);
    });
  };

  return (
    <View>
      <TouchableOpacity
        ref={triggerRef}
        onPress={open ? () => setOpen(false) : openDropdown}
        activeOpacity={0.8}
        style={[
          styles.dropdownTrigger,
          error ? styles.inputError : open ? styles.inputFocused : styles.inputNormal,
        ]}>
        <AppText style={[styles.dropdownTriggerText, !value && styles.placeholderText]}>
          {value || 'Select type'}
        </AppText>
        <ChevronDown size={18} color="#64748B" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>

        <View style={StyleSheet.absoluteFillObject}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />

          <View
            style={{
              position: 'absolute',
              top: Platform.OS === 'android' ? pos.top + 40 : pos.top,
              left: pos.left,
              width: pos.width,
              backgroundColor: '#121929',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#1E293B',
              maxHeight: 260,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              overflow: 'hidden',
            }}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled">
              {RELATIONSHIP_TYPES.map(type => {
                const selected = type === value;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => { onSelect(type); setOpen(false); }}
                    activeOpacity={0.7}
                    style={[
                      styles.dropdownItem,
                      selected && styles.dropdownItemSelected,
                    ]}>
                    <AppText style={[
                      styles.dropdownItemText,
                      selected && styles.dropdownItemTextSelected,
                    ]}>
                      {type}
                    </AppText>
                    {selected && <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {!!error && <AppText style={styles.errorText}>{error}</AppText>}
    </View>
  );
}

function DOBInputRow({
  day, month, year,
  onDayChange, onMonthChange, onYearChange,
  error,
  dayRef, monthRef, yearRef,
}: {
  day: string; month: string; year: string;
  onDayChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  error?: string;
  dayRef: React.RefObject<TextInput>;
  monthRef: React.RefObject<TextInput>;
  yearRef: React.RefObject<TextInput>;
}) {
  return (
    <View>
      <View style={styles.dobRow}>

        <View style={{ flex: 1 }}>
          <TextInput
            ref={dayRef}
            value={day}
            onChangeText={v => {
              const clean = v.replace(/\D/g, '').slice(0, 2);
              onDayChange(clean);
              if (clean.length === 2) monthRef.current?.focus();
            }}
            placeholder="DD"
            placeholderTextColor="#4A5568"
            keyboardType="numeric"
            maxLength={2}
            selectionColor="#4F7BF7"
            style={[styles.dobInput, error ? styles.inputError : styles.inputNormal]}
          />
        </View>

        <AppText style={styles.dobSeparator}>/</AppText>

        <View style={{ flex: 1 }}>
          <TextInput
            ref={monthRef}
            value={month}
            onChangeText={v => {
              const clean = v.replace(/\D/g, '').slice(0, 2);
              onMonthChange(clean);
              if (clean.length === 2) yearRef.current?.focus();
            }}
            placeholder="MM"
            placeholderTextColor="#4A5568"
            keyboardType="numeric"
            maxLength={2}
            selectionColor="#4F7BF7"
            style={[styles.dobInput, error ? styles.inputError : styles.inputNormal]}
          />
        </View>

        <AppText style={styles.dobSeparator}>/</AppText>

        <View style={{ flex: 2 }}>
          <TextInput
            ref={yearRef}
            value={year}
            onChangeText={v => {
              const clean = v.replace(/\D/g, '').slice(0, 4);
              onYearChange(clean);
            }}
            placeholder="YYYY"
            placeholderTextColor="#4A5568"
            keyboardType="numeric"
            maxLength={4}
            selectionColor="#4F7BF7"
            style={[styles.dobInput, error ? styles.inputError : styles.inputNormal]}
          />
        </View>
      </View>
      {!!error && <AppText style={styles.errorText}>{error}</AppText>}
    </View>
  );
}

function Label({ children, required }: { children: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <AppText style={styles.labelText}>{children}</AppText>
      {required && <AppText style={styles.labelRequired}>{' *'}</AppText>}
    </View>
  );
}

function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.stepBar}>
      <View style={styles.stepActive} />
      <View style={[styles.stepInactive, step === 2 && styles.stepActive]} />
    </View>
  );
}

function StyledInput({ error, ...props }: React.ComponentProps<typeof TextInput> & { error?: string }) {
  return (
    <View>
      <TextInput
        style={[styles.textInput, error ? styles.inputError : styles.inputNormal]}
        placeholderTextColor="#4A5568"
        selectionColor="#4F7BF7"
        {...props}
      />
      {!!error && <AppText style={styles.errorText}>{error}</AppText>}
    </View>
  );
}

export default function AddRelationshipModal({
  visible, onClose, onSuccess, currentUserName = '',
}: Props) {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormData>(emptyForm(currentUserName));
  const [rendered, setRendered] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const set = (key: keyof FormData) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined, dob: undefined }));
  };

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1, duration: 250,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0, damping: 20, mass: 1, stiffness: 150, useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0, duration: 200,
          easing: Easing.in(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: SCREEN_HEIGHT, duration: 230,
          easing: Easing.in(Easing.cubic), useNativeDriver: true,
        }),
      ]).start(() => {
        setRendered(false);
        setStep(1);
        setErrors({});
        setForm(emptyForm(currentUserName));
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!rendered || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [rendered]);

  function animateToStep(next: 1 | 2) {
    const outX = next === 2 ? -16 : 16;
    Animated.parallel([
      Animated.timing(stepFade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(stepSlide, { toValue: outX, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      stepSlide.setValue(-outX);
      Animated.parallel([
        Animated.timing(stepFade, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(stepSlide, { toValue: 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    });
  }

  function validateStep1(): boolean {
    const errs: FormErrors = {};

    const name = form.yourName.trim();
    if (!name) {
      errs.yourName = 'Your name is required';
    } else if (name.length < 2) {
      errs.yourName = 'Name must be at least 2 characters';
    } else if (name.length > 50) {
      errs.yourName = 'Name is too long';
    } else if (!NAME_REGEX.test(name)) {
      errs.yourName = 'Name can only contain letters';
    }

    if (!form.relationshipType) {
      errs.relationshipType = 'Please select a relationship type';
    }

    const otherName = form.otherPersonName.trim();
    if (!otherName) {
      errs.otherPersonName = "Other person's name is required";
    } else if (otherName.length < 2) {
      errs.otherPersonName = 'Name must be at least 2 characters';
    } else if (otherName.length > 50) {
      errs.otherPersonName = 'Name is too long';
    } else if (!NAME_REGEX.test(otherName)) {
      errs.otherPersonName = 'Name can only contain letters';
    }

    const email = form.otherPersonEmail.trim();
    if (!email) {
      errs.otherPersonEmail = "Other person's email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      errs.otherPersonEmail = 'Please enter a valid email address';
    } else if (email.length > 254) {
      errs.otherPersonEmail = 'Email address is too long';
    }

    if (!form.dobDay || !form.dobMonth || !form.dobYear) {
      errs.dob = 'Your date of birth is required';
    } else {
      const day = parseInt(form.dobDay, 10);
      const month = parseInt(form.dobMonth, 10);
      const year = parseInt(form.dobYear, 10);
      const currentYear = new Date().getFullYear();

      if (form.dobYear.length !== 4 || year < 1900 || year > currentYear) {
        errs.dob = 'Please enter a valid birth year';
      } else if (!isValidCalendarDate(day, month, year)) {
        errs.dob = 'Please enter a valid date';
      } else {
        const age = calculateAge(day, month, year);
        if (age < MIN_AGE) {
          errs.dob = `You must be at least ${MIN_AGE} years old to create part`;
        } else if (age > MAX_AGE) {
          errs.dob = 'Please enter a valid date of birth';
        }
      }
    }

    setErrors(errs);

    const firstError = Object.values(errs)[0];
    if (firstError) {
      showError(firstError);
    }

    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: FormErrors = {};
    const text = form.meaningText.trim();
    if (!text) {
      errs.meaningText = 'Please write what this relationship means to you';
    } else if (text.length < MIN_MEANING_LENGTH) {
      errs.meaningText = `Please write at least ${MIN_MEANING_LENGTH} characters`;
    } else if (text.length > MAX_MEANING_LENGTH) {
      errs.meaningText = `Please keep it under ${MAX_MEANING_LENGTH} characters`;
    }
    setErrors(errs);

    if (errs.meaningText) {
      showError(errs.meaningText);
    }

    return Object.keys(errs).length === 0;
  }

  async function handleCreateBond() {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await apiClient.post('/relationships/create', {
        yourName:         form.yourName.trim(),
        relationshipType: form.relationshipType,
        otherPersonName:  form.otherPersonName.trim(),
        otherPersonEmail: form.otherPersonEmail.trim().toLowerCase(),
        yourBirthday:     `${form.dobYear}-${form.dobMonth.padStart(2, '0')}-${form.dobDay.padStart(2, '0')}`,
        meaningText:      form.meaningText.trim(),
      });
      showSuccess(`Bond created! An invitation was sent to ${form.otherPersonEmail.trim()}`);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.';
      showError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0, duration: 200,
        easing: Easing.in(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: SCREEN_HEIGHT, duration: 230,
        easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }),
    ]).start(() => {
      setRendered(false);
      setStep(1);
      setErrors({});
      setForm(emptyForm(currentUserName));
      onClose();
    });
  }

  if (!rendered) return null;

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 9999 }]}
      pointerEvents="box-none">

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#000',
            opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] }),
          },
        ]}
      />
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>

          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <AppText style={styles.stepLabel}>
                {step === 1 ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
              </AppText>
              <AppText style={styles.headingText}>
                {step === 1 ? 'Who matters to you?' : 'What this relationship means to you'}
              </AppText>
              {step === 1 && (
                <AppText style={styles.subheadingText}>
                  Add someone special to your circle of trust
                </AppText>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <StepBar step={step} />
          <View style={styles.divider} />

          <Animated.View style={{ opacity: stepFade, transform: [{ translateX: stepSlide }], flex: 1 }}>
            <ScrollView
              style={{ paddingHorizontal: 24 }}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {step === 1 ? (
                <>
                  <Label required>YOUR NAME</Label>
                  <StyledInput
                    value={form.yourName}
                    onChangeText={set('yourName')}
                    placeholder="Your display name"
                    error={errors.yourName}
                    maxLength={50}
                  />

                  <Label required>RELATIONSHIP TYPE</Label>
                  <RelationshipDropdown
                    value={form.relationshipType}
                    onSelect={v => {
                      setForm(f => ({ ...f, relationshipType: v }));
                      setErrors(e => ({ ...e, relationshipType: undefined }));
                    }}
                    error={errors.relationshipType}
                  />

                  <Label required>OTHER PERSON'S NAME</Label>
                  <StyledInput
                    value={form.otherPersonName}
                    onChangeText={set('otherPersonName')}
                    placeholder="Name of this special person"
                    error={errors.otherPersonName}
                    maxLength={50}
                  />

                  <Label required>OTHER PERSON'S EMAIL</Label>
                  <StyledInput
                    value={form.otherPersonEmail}
                    onChangeText={set('otherPersonEmail')}
                    placeholder="su@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.otherPersonEmail}
                  />
                  {!errors.otherPersonEmail && (
                    <AppText style={styles.hintText}>We'll send them an invitation to join</AppText>
                  )}

                  <Label required>YOUR DATE OF BIRTH</Label>
                  <AppText style={[styles.hintText, { marginBottom: 8 }]}>
                    You must be {MIN_AGE}+ to join. Also used to show your zodiac sign.
                  </AppText>
                  <DOBInputRow
                    day={form.dobDay}
                    month={form.dobMonth}
                    year={form.dobYear}
                    onDayChange={set('dobDay')}
                    onMonthChange={set('dobMonth')}
                    onYearChange={set('dobYear')}
                    error={errors.dob}
                    dayRef={dayRef}
                    monthRef={monthRef}
                    yearRef={yearRef}
                  />
                </>
              ) : (
                <>
                  <Label required>WHAT DOES THIS RELATIONSHIP MEAN TO YOU?</Label>
                  <AppText style={styles.meaningSubText}>
                    Describe in your own words why this relationship matters. You can go deeper later.
                  </AppText>
                  <View style={[styles.textAreaWrapper, errors.meaningText ? styles.inputError : styles.inputNormal]}>
                    <TextInput
                      value={form.meaningText}
                      onChangeText={set('meaningText')}
                      placeholder="Write what you feel about this relationship..."
                      placeholderTextColor="#4A5568"
                      multiline
                      textAlignVertical="top"
                      maxLength={MAX_MEANING_LENGTH}
                      style={styles.textArea}
                      selectionColor="#4F7BF7"
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {!!errors.meaningText ? (
                      <AppText style={styles.errorText}>{errors.meaningText}</AppText>
                    ) : <View />}
                    <AppText style={styles.hintText}>
                      {form.meaningText.trim().length}/{MAX_MEANING_LENGTH}
                    </AppText>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            {step === 2 ? (
              <TouchableOpacity
                onPress={() => { animateToStep(1); setErrors({}); }}
                style={styles.backBtn}>
                <AppText style={styles.backBtnText}>Back</AppText>
              </TouchableOpacity>
            ) : <View />}

            {step === 1 ? (
              <TouchableOpacity
                onPress={() => { if (validateStep1()) animateToStep(2); }}
                style={styles.continueBtn}>
                <AppText style={styles.continueBtnText}>Continue</AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleCreateBond}
                disabled={loading}
                style={[styles.createBtn, loading && { opacity: 0.7 }]}>
                <AppText style={styles.createBtnText}>
                  {loading ? 'Creating...' : 'Create bond ✨'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>

        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    maxHeight: '92%', backgroundColor: '#0A0E17',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 9999,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 0,
  },
  stepLabel: { fontSize: 11, color: '#4F7BF7', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, fontWeight: '500' },
  headingText: { fontSize: 28, lineHeight: 34, color: '#F1F5F9', fontWeight: '700' },
  subheadingText: { fontSize: 15, color: '#94A3B8', marginTop: 4 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepBar: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 20, paddingHorizontal: 24 },
  stepActive: { flex: 1, height: 3, borderRadius: 9999, backgroundColor: '#4F7BF7' },
  stepInactive: { flex: 1, height: 3, borderRadius: 9999, backgroundColor: '#1E293B' },
  divider: { height: 1, backgroundColor: '#1E293B' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  labelText: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '500' },
  labelRequired: { fontSize: 11, color: '#4F7BF7', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '500' },
  textInput: { backgroundColor: '#111827', borderRadius: 12, height: 38, paddingHorizontal: 10, fontSize: 12, color: '#F1F5F9', borderWidth: 1 },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 12, height: 38, paddingHorizontal: 12, borderWidth: 1 },
  dropdownTriggerText: { fontSize: 15, color: '#F1F5F9', flex: 1 },
  inlineDropdownMenu: {
    position: 'absolute', top: 54, left: 0, right: 0,
    backgroundColor: '#121929', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B',
    elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    zIndex: 9999,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  dropdownItemSelected: { backgroundColor: '#B8960C' },
  dropdownItemText: { fontSize: 15, color: '#F1F5F9' },
  dropdownItemTextSelected: { color: '#fff', fontWeight: '600' },
  inputNormal: { borderColor: '#1E293B' },
  inputFocused: { borderColor: '#4F7BF7' },
  inputError: { borderColor: '#EF4444' },
  placeholderText: { color: '#4A5568' },
  hintText: { fontSize: 12, color: '#64748B', marginTop: 4, marginLeft: 4 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },
  meaningSubText: { fontSize: 15, color: '#94A3B8', marginBottom: 12, lineHeight: 24 },
  textAreaWrapper: { backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, minHeight: 200, padding: 16 },
  textArea: { fontSize: 15, color: '#F1F5F9', minHeight: 180, textAlignVertical: 'top' },

  dobRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dobSubLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 6, textAlign: 'center' },
  dobInput: { backgroundColor: '#111827', borderRadius: 12, height: 38, borderWidth: 1, fontSize: 16, color: '#F1F5F9', textAlign: 'center' },
  dobSeparator: { fontSize: 20, color: '#64748B', marginBottom: 14, paddingHorizontal: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1E293B' },
  backBtnText: { fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  continueBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(79,123,247,0.15)', borderWidth: 1, borderColor: 'rgba(79,123,247,0.35)' },
  continueBtnText: { fontSize: 15, color: '#4F7BF7', fontWeight: '500' },
  createBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#4F7BF7', flexDirection: 'row', alignItems: 'center', gap: 8 },
  createBtnText: { fontSize: 15, color: '#fff', fontWeight: '500' },
});
