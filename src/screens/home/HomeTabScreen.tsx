

// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { Pressable, ScrollView, TextInput, View, ActivityIndicator, RefreshControl } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Plus, Search, User } from 'lucide-react-native';
// import AppText from '../../components/common/AppText';
// import BrandIcon from '../../components/common/brandicon';
// import { useTranslated } from '../../hooks/useTranslated';
// import RelationshipCard, { RelationshipItem } from '../../components/home/RelationshipCard';
// import { useAuth } from '../../context/AuthContext';
// import { apiClient } from '../../utils/axiosClient';
// import { HomeStackParamList } from './homennavigator';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { useNavigation } from '@react-navigation/native';
// import { useAddRelationship } from '../../context/Addrelationshipcontext';

// export default function HomeTabScreen() {
//   const searchPlaceholder = useTranslated('Find a connection...');
//   const {
//     visible,
//     openModal,
//     closeModal,
//     onSuccessCallback,
//   } = useAddRelationship();
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [search, setSearch] = useState('');
//   const { user } = useAuth();
//   const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
//   const [rawRelationships, setRawRelationships] = useState<any[]>([]);
//   const [ratings, setRatings] = useState<any[]>([]);
//   const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

//   const fetchRatings = useCallback(async () => {
//     try {
//       const { data } = await apiClient.get('/ratings/current/all');
//       if (data.success) setRatings(data.data);
//     } catch (err) {
//       console.error('[HomeTab] ratings fetch error:', err);
//     }
//   }, []);

//   const fetchRelationships = useCallback(async () => {
//     try {
//       const { data } = await apiClient.get('/relationships');
//       if (data.success) setRawRelationships(data.relationships);
//     } catch (err) {
//       console.error('[HomeTab] fetch relationships error:', err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   const fetchUnreadCounts = useCallback(async () => {
//     try {
//       const { data } = await apiClient.get('/messages/unread/counts');
//       if (data.success) setUnreadCounts(data.data);
//     } catch (err) {
//       console.error('[HomeTab] unread counts error:', err);
//     }
//   }, []);

//   const relationships: RelationshipItem[] = useMemo(() => {
//     return rawRelationships.map((r: any) => {
//       const isCreator = r.creator_id === user?.id;
//       const name = isCreator ? r.other_person_name : r.creator_name;
//       const initial = name?.charAt(0)?.toUpperCase() ?? '?';
//       const isAccepted = r.status === 'accepted';
//       const myRating = ratings.find(
//         x => x.relationship_id === r.id && x.rated_by === user?.id,
//       );

//       return {
//         id: r.id,
//         initial,
//         name,
//         ringColor: isAccepted ? '#22C55E' : '#EAB308',
//         statusColor: isAccepted ? '#22C55E' : '#EAB308',
//         harmony: 0,
//         rating: myRating?.rating ?? 0,
//         leftTag: 'Dr. Harmony',
//         rightTag: isAccepted ? 'Active' : 'Pending',
//         leftTagBg: '#1A2D4A',
//         rightTagBg: isAccepted ? '#1A3D2A' : '#3D3420',
//         relationshipType: r.relationship_type,
//         status: r.status,
//         unreadCount: unreadCounts[r.id] ?? 0, 
//       };
//     });
//   }, [rawRelationships, ratings, unreadCounts, user?.id]); 

//   useEffect(() => {
//     fetchRelationships();
//     fetchRatings();
//     fetchUnreadCounts();
//   }, [fetchRelationships, fetchRatings, fetchUnreadCounts]);

  
//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchRelationships();
//     fetchRatings();
//     fetchUnreadCounts();
//   }, [fetchRelationships, fetchRatings, fetchUnreadCounts]);

//   const onModalClose = useCallback(() => {
//     fetchRelationships();
//   }, [fetchRelationships]);

//   React.useEffect(() => {
//     onSuccessCallback.current = onModalClose;
//     return () => { onSuccessCallback.current = null; };
//   }, [onModalClose]);

//   const filtered = relationships.filter(r =>
//     r.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
//       {/* StatusBar is handled globally by <ThemedStatusBar /> in App.tsx —
//           rendering one here too would fight it and go stale on theme toggle. */}

//       <ScrollView
//         className="flex-1"
//         contentContainerClassName="px-5 pb-6"
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#A855F7"
//           />
//         }>

//         {/* ── Header ── */}
//         <View className="flex-row items-center justify-between mt-2 mb-6">
//           <View className="flex-row items-center gap-2.5">
//             <BrandIcon size={36} />
//             <AppText className="font-sansSemiBold text-body-md text-brand-textPrimary tracking-[2px]">
//               IMPACTUM
//             </AppText>
//           </View>
//           <View className="flex-row items-center gap-2">
//             <Pressable
//               onPress={() => navigation.navigate('AccountScreen')}
//               className="w-10 h-10 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft items-center justify-center">
//               <User size={18} color="#94A3B8" />
//             </Pressable>
//             <Pressable
//               onPress={() => openModal(user?.name ?? '')}
//               className="flex-row items-center gap-1.5 px-3.5 h-10 rounded-full bg-brand-bgCardSoft border border-brand-primaryLight/40">
//               <Plus size={16} color="#A855F7" />
//               <AppText className="font-sansMedium text-body-sm text-white ">New</AppText>
//             </Pressable>
//           </View>
//         </View>

//         {/* ── Hero copy ── */}
//         <AppText className="font-sansMedium text-caption text-brand-blueSoft uppercase tracking-[2px] mb-2">
//           Your Space
//         </AppText>
//         <AppText className="font-heading text-[34px] leading-[40px] text-brand-textPrimary">
//           Nurture Your
//         </AppText>
//         <AppText className="font-heading text-[34px] leading-[40px] text-brand-gold mb-3">
//           Relationships
//         </AppText>
//         <AppText className="font-sans text-body-md text-brand-textSecondary mb-6 leading-6"  style={{
//     fontFamily: 'CormorantGaramond-Regular',
  
//   }} >
//           Cultivate and strengthen your most important relationships in the world.
//         </AppText>

//         {/* ── Search ── */}
//         <View className="flex-row items-center bg-brand-bgCardSoft border border-brand-borderSoft rounded-full px-4 h-[48px] mb-7">
//           <Search size={18} color="#64748B" />
//           <TextInput
//             value={search}
//             onChangeText={setSearch}
//             placeholder={searchPlaceholder}
//             placeholderTextColor="#64748B"
//             className="flex-1 ml-3 font-sans text-body-md text-brand-textPrimary"
//           />
//         </View>

//         {/* ── Relationship list ── */}
//         <View className="flex-row items-center justify-between mb-4">
//           <AppText className="font-sansMedium text-caption text-brand-textMuted uppercase tracking-[2px]">
//             Your Relationships
//           </AppText>
//           {relationships.length > 0 && (
//             <AppText className="font-sansMedium text-caption text-brand-textMuted">
//               {relationships.length !== 1 ? '' : ''}
//             </AppText>
//           )}
//         </View>

//         {loading ? (
//           <View className="py-10 items-center">
//             <ActivityIndicator color="#A855F7" />
//           </View>
//         ) : filtered.length === 0 ? (
//           <View className="py-10 items-center gap-2">
//             <AppText className="font-sansMedium text-body-md text-brand-textMuted text-center">
//               {search ? 'No relationships match your search' : 'No relationships yet'}
//             </AppText>
//             {!search && (
//               <AppText className="font-sans text-body-sm text-brand-textMuted text-center">
//                 Tap "New" to add your first bond
//               </AppText>
//             )}
//           </View>
//         ) : (
//           filtered.map((item, index) => (
//             <RelationshipCard
//               key={item.id}
//               item={item}
//               index={index}
//               onPress={() => navigation.navigate('RelationshipDetail', { relationshipId: item.id })}
//               onChatPress={() =>
//                 navigation.navigate('Chat', { relationshipId: item.id, partnerName: item.name })
//               }
//             />
//           ))
//         )}

//         {/* ── Add card ── */}
//         <Pressable
//           onPress={() => openModal(user?.name ?? '')}
//           className="border border-dashed border-brand-borderSoft rounded-card py-5 items-center justify-center flex-row gap-2 mt-1">
//           <Plus size={18} color="#64748B" />
//           <AppText className="font-sansMedium text-body-md text-brand-textMuted">
//             Add a new relationship
//           </AppText>
//         </Pressable>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, TextInput, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, User } from 'lucide-react-native';
import AppText from '../../components/common/AppText';
import BrandIcon from '../../components/common/brandicon';
import { useTranslated } from '../../hooks/useTranslated';
import RelationshipCard, { RelationshipItem } from '../../components/home/RelationshipCard';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/axiosClient';
import { HomeStackParamList } from './homennavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAddRelationship } from '../../context/Addrelationshipcontext';
import NoInternetOverlay from '../../utils/Nointernetoverlay';
import RelationshipCardSkeleton from '../../utils/RelationshipCardskeleton';
import { useNetworkStatus } from '../../utils/UseNetworkStatus';

export default function HomeTabScreen() {
  const searchPlaceholder = useTranslated('Find a connection...');
  const {
    visible,
    openModal,
    closeModal,
    onSuccessCallback,
  } = useAddRelationship();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [rawRelationships, setRawRelationships] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // 'checking' | 'online' | 'offline'
  const { status: networkStatus, retry: retryNetwork } = useNetworkStatus();

  const fetchRatings = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/ratings/current/all');
      if (data.success) setRatings(data.data);
    } catch (err) {
      console.error('[HomeTab] ratings fetch error:', err);
    }
  }, []);

  const fetchRelationships = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/relationships');
      if (data.success) setRawRelationships(data.relationships);
    } catch (err) {
      console.error('[HomeTab] fetch relationships error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/messages/unread/counts');
      if (data.success) setUnreadCounts(data.data);
    } catch (err) {
      console.error('[HomeTab] unread counts error:', err);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchRelationships();
    fetchRatings();
    fetchUnreadCounts();
  }, [fetchRelationships, fetchRatings, fetchUnreadCounts]);

  const relationships: RelationshipItem[] = useMemo(() => {
    return rawRelationships.map((r: any) => {
      const isCreator = r.creator_id === user?.id;
      const name = isCreator ? r.other_person_name : r.creator_name;
      const initial = name?.charAt(0)?.toUpperCase() ?? '?';
      const isAccepted = r.status === 'accepted';
      const myRating = ratings.find(
        x => x.relationship_id === r.id && x.rated_by === user?.id,
      );

      return {
        id: r.id,
        initial,
        name,
        ringColor: isAccepted ? '#22C55E' : '#EAB308',
        statusColor: isAccepted ? '#22C55E' : '#EAB308',
        harmony: 0,
        rating: myRating?.rating ?? 0,
        leftTag: 'Dr. Harmony',
        rightTag: isAccepted ? 'Active' : 'Pending',
        leftTagBg: '#1A2D4A',
        rightTagBg: isAccepted ? '#1A3D2A' : '#3D3420',
        relationshipType: r.relationship_type,
        status: r.status,
        unreadCount: unreadCounts[r.id] ?? 0,
      };
    });
  }, [rawRelationships, ratings, unreadCounts, user?.id]);


  useEffect(() => {
    console.log('[HomeTab] networkStatus =', networkStatus);
    if (networkStatus === 'online') {
      fetchAll();
    }
  }, [networkStatus, fetchAll]);

  const onRefresh = useCallback(() => {
    if (networkStatus !== 'online') {
      retryNetwork();
      return;
    }
    setRefreshing(true);
    fetchAll();
  }, [networkStatus, retryNetwork, fetchAll]);

  const onModalClose = useCallback(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  React.useEffect(() => {
    onSuccessCallback.current = onModalClose;
    return () => { onSuccessCallback.current = null; };
  }, [onModalClose]);

  const filtered = relationships.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Header + hero + search block, reused above every body state so the
  // layout doesn't jump between checking / offline / online ──
  const HeaderBlock = (
    <>
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <View className="flex-row items-center gap-2.5">
          <BrandIcon size={36} />
          <AppText className="font-sansSemiBold text-body-md text-brand-textPrimary tracking-[2px]">
            IMPACTUM
          </AppText>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => navigation.navigate('AccountScreen')}
            className="w-10 h-10 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft items-center justify-center">
            <User size={18} color="#94A3B8" />
          </Pressable>
          <Pressable
            onPress={() => openModal(user?.name ?? '')}
            className="flex-row items-center gap-1.5 px-3.5 h-10 rounded-full bg-brand-bgCardSoft border border-brand-primaryLight/40">
            <Plus size={16} color="#A855F7" />
            <AppText className="font-sansMedium text-body-sm text-white ">New</AppText>
          </Pressable>
        </View>
      </View>

      <AppText className="font-sansMedium text-caption text-brand-blueSoft uppercase tracking-[2px] mb-2">
        Your Space
      </AppText>
      <AppText className="font-heading text-[34px] leading-[40px] text-brand-textPrimary">
        Nurture Your
      </AppText>
      <AppText className="font-heading text-[34px] leading-[40px] text-brand-gold mb-3">
        Relationships
      </AppText>
      <AppText
        className="font-sans text-body-md text-brand-textSecondary mb-6 leading-6"
        style={{ fontFamily: 'CormorantGaramond-Regular' }}>
        Cultivate and strengthen your most important relationships in the world.
      </AppText>

      <View className="flex-row items-center bg-brand-bgCardSoft border border-brand-borderSoft rounded-full px-4 h-[48px] mb-7">
        <Search size={18} color="#64748B" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
          placeholderTextColor="#64748B"
          editable={networkStatus === 'online'}
          className="flex-1 ml-3 font-sans text-body-md text-brand-textPrimary"
        />
      </View>
    </>
  );


  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>


      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A855F7"
          />
        }>

        {HeaderBlock}

        <View className="flex-row items-center justify-between mb-4">
          <AppText className="font-sansMedium text-caption text-brand-textMuted uppercase tracking-[2px]">
            Your Relationships
          </AppText>
          {relationships.length > 0 && (
            <AppText className="font-sansMedium text-caption text-brand-textMuted">
              {relationships.length !== 1 ? '' : ''}
            </AppText>
          )}
        </View>

        {networkStatus === 'checking' || loading ? (
  Array.from({ length: 3 }).map((_, i) => (
    <RelationshipCardSkeleton key={i} index={i} />
  ))
) : networkStatus === 'offline' ? (
  <View className="py-10 items-center gap-3">
    <AppText className="font-sansMedium text-body-md text-brand-textMuted text-center">
      No internet connection
    </AppText>
    <AppText className="font-sans text-body-sm text-brand-textMuted text-center">
      Check your connection and try again.
    </AppText>
    <Pressable
      onPress={retryNetwork}
      className="mt-1 px-5 py-2.5 rounded-full bg-brand-iconStroke">
      <AppText className="font-sansSemiBold text-[13px] text-white">Retry</AppText>
    </Pressable>
  </View>
) : filtered.length === 0 ? (
  <View className="py-10 items-center gap-2">
    <AppText className="font-sansMedium text-body-md text-brand-textMuted text-center">
      {search ? 'No relationships match your search' : 'No relationships yet'}
    </AppText>
    {!search && (
      <AppText className="font-sans text-body-sm text-brand-textMuted text-center">
        Tap "New" to add your first bond
      </AppText>
    )}
  </View>
) : (
  filtered.map((item, index) => (
    <RelationshipCard
      key={item.id}
      item={item}
      index={index}
      onPress={() => navigation.navigate('RelationshipDetail', { relationshipId: item.id })}
      onChatPress={() =>
        navigation.navigate('Chat', { relationshipId: item.id, partnerName: item.name })
      }
    />
  ))
)}

        {/* ── Add card ── */}
        <Pressable
          onPress={() => openModal(user?.name ?? '')}
          className="border border-dashed border-brand-borderSoft rounded-card py-5 items-center justify-center flex-row gap-2 mt-1">
          <Plus size={18} color="#64748B" />
          <AppText className="font-sansMedium text-body-md text-brand-textMuted">
            Add a new relationship
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}