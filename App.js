import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@halmeel/data-v1';
const C = {
  bg: '#F5F6FB', white: '#FFFFFF', ink: '#172033', muted: '#80889B', line: '#E8EAF2',
  primary: '#6657E8', primaryDark: '#5143C9', lilac: '#EFEDFF', mint: '#E5F8F1', green: '#1E9C74',
  amber: '#FFF2D9', orange: '#C17A16', rose: '#FFE8E8', red: '#D94C4C', blue: '#E7F1FF', navy: '#19213D',
};
const STATUS_OPTIONS = ['Bilow', 'Socda', 'Sugaya', 'Dhammaystiran'];
const PRIORITY_OPTIONS = ['Caadi', 'Muhiim', 'Degdeg'];
const MONTHS = ['Jannaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun', 'Luuliyo', 'Agoosto', 'Sebtembar', 'Oktoobar', 'Nofeembar', 'Diseembar'];
const DAYS = ['Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimce', 'Sabti', 'Axad'];
const DAYS_SHORT = ['Isn', 'Tal', 'Arb', 'Kha', 'Jim', 'Sab', 'Axa'];
const todayString = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const dateLabel = (s) => {
  if (!s) return 'Taariikh lama dejin';
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const dateIsPast = (s) => s && s < todayString();
const initials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'HM';

function Icon({ name, size = 20, color = C.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}
function Button({ title, icon, onPress, variant = 'primary', style, small = false }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, variant === 'primary' ? styles.buttonPrimary : variant === 'outline' ? styles.buttonOutline : variant === 'soft' ? styles.buttonSoft : styles.buttonGhost, small && styles.buttonSmall, style]}>
      {icon ? <Icon name={icon} size={small ? 15 : 17} color={variant === 'primary' ? C.white : variant === 'danger' ? C.red : C.primary} /> : null}
      <Text style={[styles.buttonText, variant !== 'primary' && { color: variant === 'danger' ? C.red : C.primary }, small && { fontSize: 12 }]}>{title}</Text>
    </Pressable>
  );
}
function SectionTitle({ title, action, onAction }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}</View>;
}
function Pill({ label, active, onPress }) {
  return <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text></Pressable>;
}
function EmptyState({ icon = 'file-tray-outline', title, body, button, onPress }) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}><Icon name={icon} size={28} color={C.primary} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{button ? <Button title={button} icon="add" onPress={onPress} style={{ marginTop: 15 }} /> : null}</View>;
}
function Card({ children, style }) { return <View style={[styles.card, style]}>{children}</View>; }

export default function App() {
  const [data, setData] = useState({ projects: [], tasks: [], profile: { name: '', email: '', role: 'Developer / Founder' } });
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('home');
  const [projectType, setProjectType] = useState('project');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [draft, setDraft] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [shownMonth, setShownMonth] = useState(new Date());
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setData({ projects: Array.isArray(parsed.projects) ? parsed.projects : [], tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [], profile: { name: '', email: '', role: 'Developer / Founder', ...(parsed.profile || {}) } });
        }
      } catch (e) {
        Alert.alert('Kaydinta', 'Xogtii hore lama akhrin karin. Waxaad sii wadan kartaa isticmaalka app-ka.');
      } finally { setReady(true); }
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => Alert.alert('Khalad', 'Xogta gudaha telefoonka lama kaydin karin. Hubi booska telefoonka.'));
  }, [data, ready]);

  const activeProjects = data.projects.filter(p => p.type === 'project' && p.status !== 'Dhammaystiran').length;
  const ideasCount = data.projects.filter(p => p.type === 'idea').length;
  const openTasks = data.tasks.filter(t => !t.done).length;
  const upcomingTasks = useMemo(() => data.tasks.filter(t => !t.done).sort((a, b) => (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99') || (a.time || '').localeCompare(b.time || '')).slice(0, 4), [data.tasks]);

  const openForm = (kind, item = null) => {
    if (kind === 'profile') {
      setDraft({ ...(data.profile || {}) });
    } else if (item) {
      setDraft({ ...item, editing: true });
    } else if (kind === 'task') {
      setDraft({ title: '', description: '', date: selectedDate || todayString(), time: '09:00', projectName: '', priority: 'Caadi', done: false });
    } else {
      setDraft({ title: '', description: '', category: kind === 'idea' ? 'Fikrad cusub' : 'Software', status: 'Bilow', priority: 'Caadi', type: kind, dueDate: '' });
    }
    setModal(kind);
  };

  const closeModal = () => { setModal(null); setDraft({}); setSelectedItem(null); };
  const updateDraft = (key, value) => setDraft(prev => ({ ...prev, [key]: value }));

  const saveForm = () => {
    const title = (draft.title || '').trim();
    if (modal !== 'profile' && !title) { Alert.alert('Cinwaan ayaa loo baahan yahay', 'Fadlan geli cinwaanka.'); return; }
    if (modal === 'profile') {
      setData(prev => ({ ...prev, profile: { ...prev.profile, name: (draft.name || '').trim(), email: (draft.email || '').trim(), role: (draft.role || '').trim() || 'Developer / Founder' } }));
      closeModal(); return;
    }
    if (modal === 'task') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date || '')) { Alert.alert('Taariikh sax ah geli', 'Isticmaal qaabka YYYY-MM-DD, tusaale 2026-10-23.'); return; }
      setData(prev => {
        if (draft.editing && draft.id) return { ...prev, tasks: prev.tasks.map(t => t.id === draft.id ? { ...t, ...draft, title, editing: undefined } : t) };
        return { ...prev, tasks: [{ ...draft, id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`, title, createdAt: new Date().toISOString() }, ...prev.tasks] };
      });
      setSelectedDate(draft.date); setShownMonth(new Date(`${draft.date}T12:00:00`)); closeModal(); return;
    }
    if (modal === 'project' || modal === 'idea') {
      setData(prev => {
        if (draft.editing && draft.id) return { ...prev, projects: prev.projects.map(p => p.id === draft.id ? { ...p, ...draft, title, type: modal === 'idea' ? 'idea' : 'project', editing: undefined } : p) };
        return { ...prev, projects: [{ ...draft, id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`, title, type: modal === 'idea' ? 'idea' : 'project', createdAt: new Date().toISOString() }, ...prev.projects] };
      });
      closeModal(); return;
    }
  };

  const toggleTask = (task) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) }));
  const changeStatus = (item) => {
    const idx = STATUS_OPTIONS.indexOf(item.status || 'Bilow');
    const nextStatus = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setData(prev => ({ ...prev, projects: prev.projects.map(p => p.id === item.id ? { ...p, status: nextStatus } : p) }));
    setSelectedItem(prev => prev ? { ...prev, status: nextStatus } : prev);
  };
  const deleteEntity = (kind, id) => Alert.alert('Ma hubtaa?', 'Xogtan waa la tirtiri doonaa.', [
    { text: 'Ka noqo', style: 'cancel' },
    { text: 'Tirtir', style: 'destructive', onPress: () => { setData(prev => kind === 'task' ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : { ...prev, projects: prev.projects.filter(p => p.id !== id) }); closeModal(); } },
  ]);
  const backup = async () => {
    try { await Share.share({ title: 'HalMeel — Kayd xogeed', message: JSON.stringify({ app: 'HalMeel', exportedAt: new Date().toISOString(), ...data }, null, 2) }); }
    catch { Alert.alert('Dhoofin', 'Dhoofinta xogta lama dhammaystirin.'); }
  };
  const clearData = () => Alert.alert('Tirtir dhammaan xogta?', 'Tani waxay tirtiraysaa mashaariicda, fikradaha iyo jadwalka ee ku kaydsan telefoonkan.', [
    { text: 'Ka noqo', style: 'cancel' }, { text: 'Tirtir xogta', style: 'destructive', onPress: () => setData({ projects: [], tasks: [], profile: { name: '', email: '', role: 'Developer / Founder' } }) },
  ]);

  const renderTaskRow = (task, compact = false) => (
    <View key={task.id} style={[styles.taskRow, compact && styles.taskRowCompact]}>
      <Pressable onPress={() => toggleTask(task)} style={[styles.checkCircle, task.done && styles.checkCircleDone]}><Icon name={task.done ? 'checkmark' : 'ellipse-outline'} size={task.done ? 14 : 17} color={task.done ? C.white : C.muted} /></Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => openForm('task', task)}>
        <Text style={[styles.taskTitle, task.done && styles.taskDoneText]} numberOfLines={1}>{task.title}</Text>
        <Text style={styles.taskMeta}>{task.time || 'Waqti lama dejin'}{task.projectName ? `  ·  ${task.projectName}` : ''}</Text>
      </Pressable>
      {task.priority === 'Degdeg' ? <View style={styles.priorityDot} /> : null}
      {!compact ? <Pressable onPress={() => openForm('task', task)} hitSlop={10}><Icon name="ellipsis-horizontal" size={20} color={C.muted} /></Pressable> : null}
    </View>
  );

  const renderProjectCard = (item) => (
    <Pressable key={item.id} onPress={() => { setSelectedItem(item); setModal('detail'); }} style={styles.projectCard}>
      <View style={styles.projectTopLine}>
        <View style={[styles.projectIcon, item.type === 'idea' ? { backgroundColor: C.amber } : { backgroundColor: C.lilac }]}><Icon name={item.type === 'idea' ? 'bulb-outline' : 'layers-outline'} size={21} color={item.type === 'idea' ? C.orange : C.primary} /></View>
        <View style={{ flex: 1 }}><Text style={styles.projectName} numberOfLines={1}>{item.title}</Text><Text style={styles.projectCategory}>{item.category || (item.type === 'idea' ? 'Fikrad' : 'Mashruuc')}</Text></View>
        <Icon name="chevron-forward" size={18} color={C.muted} />
      </View>
      {item.description ? <Text style={styles.projectDescription} numberOfLines={2}>{item.description}</Text> : null}
      <View style={styles.projectBottomLine}><View style={[styles.statusTag, item.status === 'Dhammaystiran' ? { backgroundColor: C.mint } : item.status === 'Socda' ? { backgroundColor: C.blue } : item.status === 'Sugaya' ? { backgroundColor: C.amber } : { backgroundColor: '#F0F1F7' }]}><Text style={[styles.statusTagText, item.status === 'Dhammaystiran' ? { color: C.green } : item.status === 'Socda' ? { color: '#3B69AD' } : item.status === 'Sugaya' ? { color: C.orange } : {}]}>{item.type === 'idea' ? 'Fikrad' : (item.status || 'Bilow')}</Text></View>{item.dueDate ? <Text style={styles.dueText}><Icon name="calendar-outline" size={12} color={C.muted} /> {dateLabel(item.dueDate)}</Text> : null}</View>
    </Pressable>
  );

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>HAL MEEL OO HAWLAHAAGA AH</Text><Text style={styles.greeting}>Ku soo dhowow{data.profile.name ? `, ${data.profile.name.split(' ')[0]}` : ''} 👋</Text><Text style={styles.greetingSub}>Fikradahaaga u beddel qorshe la fulin karo.</Text></View>
        <Pressable onPress={() => setTab('profile')} style={styles.avatar}><Text style={styles.avatarText}>{initials(data.profile.name)}</Text></Pressable>
      </View>
      <View style={styles.heroCard}>
        <View style={styles.heroPatternOne} /><View style={styles.heroPatternTwo} />
        <View style={styles.heroBadge}><Icon name="sparkles" size={12} color="#E8E5FF" /><Text style={styles.heroBadgeText}>GOOBTAADA HIRGELINTA</Text></View>
        <Text style={styles.heroTitle}>Fikrad kasta{ '\n' }waxay mudan tahay{ '\n' }in la hirgeliyo.</Text>
        <Text style={styles.heroBody}>Qor. Qorshee. Daba gal. Hal meel ku wada hay.</Text>
        <Button title="Qor fikrad cusub" icon="add" onPress={() => openForm('idea')} style={{ alignSelf: 'flex-start', marginTop: 15, backgroundColor: C.white }} />
        <View style={styles.heroDecor}><Icon name="bulb" size={37} color="#BEB6FF" /></View>
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="layers-outline" value={activeProjects} label="Mashruuc socda" tone="purple" />
        <StatCard icon="bulb-outline" value={ideasCount} label="Fikrado kaydsan" tone="amber" />
        <StatCard icon="checkbox-outline" value={openTasks} label="Hawl furan" tone="mint" />
      </View>
      <SectionTitle title="Bilow degdeg ah" />
      <View style={styles.quickGrid}>
        <QuickAction icon="add-circle-outline" color={C.primary} bg={C.lilac} title="Mashruuc" body="Bilow wax cusub" onPress={() => openForm('project')} />
        <QuickAction icon="bulb-outline" color={C.orange} bg={C.amber} title="Fikrad" body="Kaydi fikrad" onPress={() => openForm('idea')} />
        <QuickAction icon="calendar-outline" color={C.green} bg={C.mint} title="Hawl / Jadwal" body="Qorshee waqti" onPress={() => openForm('task')} />
      </View>
      <SectionTitle title="Hawlaha kuu soo socda" action="Eeg jadwalka" onAction={() => setTab('calendar')} />
      <Card style={{ paddingHorizontal: 14 }}>
        {upcomingTasks.length ? upcomingTasks.map(t => renderTaskRow(t, true)) : <View style={styles.inlineEmpty}><View style={styles.inlineEmptyIcon}><Icon name="calendar-clear-outline" size={20} color={C.primary} /></View><View style={{ flex: 1 }}><Text style={styles.inlineEmptyTitle}>Jadwalkaagu waa faaruq</Text><Text style={styles.inlineEmptyBody}>Ku dar hawl si aad ula socoto waqtigaaga.</Text></View><Pressable onPress={() => openForm('task')}><Icon name="add-circle" size={25} color={C.primary} /></Pressable></View>}
      </Card>
      <SectionTitle title="Mashaariicdaadii ugu dambeeyay" action="Dhammaan" onAction={() => setTab('projects')} />
      {data.projects.filter(p => p.type === 'project').slice(0, 2).map(renderProjectCard)}
      {data.projects.filter(p => p.type === 'project').length === 0 ? <Card style={{ padding: 0 }}><EmptyState icon="rocket-outline" title="Mashruuca koowaad bilow" body="Ku kaydi magaca, faahfaahinta iyo xaaladda mashruucaaga." button="Ku dar mashruuc" onPress={() => openForm('project')} /></Card> : null}
      <View style={{ height: 14 }} />
    </ScrollView>
  );

  const renderProjects = () => {
    const filtered = data.projects.filter(p => p.type === projectType && `${p.title} ${p.description || ''} ${p.category || ''}`.toLowerCase().includes(search.toLowerCase()));
    return <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      <View style={styles.pageHeaderRow}><View><Text style={styles.pageTitle}>Mashaariic & Fikrado</Text><Text style={styles.pageSubtitle}>Wax kasta oo aad dhiseyso, hal meel.</Text></View><Pressable onPress={() => openForm(projectType)} style={styles.roundAdd}><Icon name="add" size={23} color={C.white} /></Pressable></View>
      <View style={styles.searchBox}><Icon name="search-outline" size={18} color={C.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Raadi mashruuc ama fikrad..." placeholderTextColor="#9AA1B2" style={styles.searchInput} returnKeyType="search" /><Pressable onPress={() => setSearch('')}><Icon name="close-circle" size={17} color={search ? C.muted : 'transparent'} /></Pressable></View>
      <View style={styles.segmented}><Pill label={`Mashaariic (${data.projects.filter(p => p.type === 'project').length})`} active={projectType === 'project'} onPress={() => setProjectType('project')} /><Pill label={`Fikrado (${ideasCount})`} active={projectType === 'idea'} onPress={() => setProjectType('idea')} /></View>
      {filtered.length ? filtered.map(renderProjectCard) : <EmptyState icon={projectType === 'idea' ? 'bulb-outline' : 'layers-outline'} title={search ? 'Wax natiijo ah lama helin' : projectType === 'idea' ? 'Fikrado weli ma jiraan' : 'Mashaariic weli ma jiraan'} body={search ? 'Isku day eray kale oo raadis ah.' : projectType === 'idea' ? 'Qor fikrad cusub si aanay kuu lumin.' : 'Ku bilow mashruuc cusub oo aad rabto inaad hirgeliso.'} button={search ? 'Nadiifi raadinta' : projectType === 'idea' ? 'Kaydi fikrad' : 'Ku dar mashruuc'} onPress={() => search ? setSearch('') : openForm(projectType)} />}
      <View style={{ height: 20 }} />
    </ScrollView>;
  };

  const monthCells = useMemo(() => {
    const year = shownMonth.getFullYear(), month = shownMonth.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let day = 1; day <= daysCount; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [shownMonth]);

  const renderCalendar = () => {
    const visibleTasks = data.tasks.filter(t => t.date === selectedDate && (showCompletedTasks || !t.done)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const taskDateSet = new Set(data.tasks.filter(t => !t.done).map(t => t.date));
    return <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeaderRow}><View><Text style={styles.pageTitle}>Jadwalkaaga</Text><Text style={styles.pageSubtitle}>Maamul waqtiga iyo hawlahaaga.</Text></View><Pressable onPress={() => openForm('task')} style={styles.roundAdd}><Icon name="add" size={23} color={C.white} /></Pressable></View>
      <Card style={styles.calendarCard}>
        <View style={styles.monthHeader}><Pressable onPress={() => setShownMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1))} style={styles.monthArrow}><Icon name="chevron-back" size={18} color={C.ink} /></Pressable><Text style={styles.monthTitle}>{MONTHS[shownMonth.getMonth()]} {shownMonth.getFullYear()}</Text><Pressable onPress={() => setShownMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1))} style={styles.monthArrow}><Icon name="chevron-forward" size={18} color={C.ink} /></Pressable></View>
        <View style={styles.calendarGrid}>{DAYS_SHORT.map(day => <View style={styles.dayHeaderCell} key={day}><Text style={styles.dayHeaderText}>{day}</Text></View>)}</View>
        <View style={styles.calendarGrid}>{monthCells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={styles.dateCell} />;
          const stamp = `${shownMonth.getFullYear()}-${String(shownMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = stamp === selectedDate, isToday = stamp === todayString(), hasTasks = taskDateSet.has(stamp);
          return <Pressable key={stamp} onPress={() => setSelectedDate(stamp)} style={styles.dateCell}><View style={[styles.dateBubble, isSelected && styles.dateBubbleSelected, isToday && !isSelected && styles.dateBubbleToday]}><Text style={[styles.dateText, isSelected && styles.dateTextSelected, isToday && !isSelected && { color: C.primary, fontWeight: '800' }]}>{day}</Text></View>{hasTasks ? <View style={[styles.dateDot, isSelected && { backgroundColor: C.white }]} /> : <View style={styles.dateDotPlaceholder} />}</Pressable>;
        })}</View>
        <View style={styles.calendarLegend}><View style={styles.legendDot} /><Text style={styles.legendText}>Maalin hawl loo qorsheeyay</Text><Button title="Maanta" variant="soft" small onPress={() => { setSelectedDate(todayString()); setShownMonth(new Date()); }} /></View>
      </Card>
      <View style={styles.dateTasksHeader}><View><Text style={styles.sectionTitle}>{dateLabel(selectedDate)}</Text><Text style={styles.pageSubtitle}>{visibleTasks.length} hawlood</Text></View><Pressable onPress={() => openForm('task')} style={styles.addText}><Icon name="add" size={16} color={C.primary} /><Text style={styles.addTextLabel}>Hawl cusub</Text></Pressable></View>
      <View style={styles.completedToggle}><Text style={styles.completedLabel}>Tus hawlaha la dhammeeyay</Text><Switch value={showCompletedTasks} onValueChange={setShowCompletedTasks} trackColor={{ false: '#D8DCE8', true: '#C9C2FF' }} thumbColor={showCompletedTasks ? C.primary : '#FFFFFF'} /></View>
      <Card style={{ paddingHorizontal: 14 }}>
        {visibleTasks.length ? visibleTasks.map(t => renderTaskRow(t)) : <EmptyState icon="calendar-outline" title="Hawl laguma darin maalintan" body="Ku dar hawl, wakhti iyo faahfaahin si jadwalkaagu kuu hago." button="Ku dar hawl" onPress={() => { setDraft({ title: '', description: '', date: selectedDate, time: '09:00', projectName: '', priority: 'Caadi', done: false }); setModal('task'); }} />}
      </Card>
      <View style={{ height: 20 }} />
    </ScrollView>;
  };

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.pageTitle}>Profile</Text><Text style={[styles.pageSubtitle, { marginBottom: 20 }]}>Maamul xogtaada iyo kaydinta app-ka.</Text>
      <Card style={styles.profileCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{initials(data.profile.name)}</Text><View style={styles.onlineDot} /></View>
        <Text style={styles.profileName}>{data.profile.name || 'Magacaaga'}</Text><Text style={styles.profileRole}>{data.profile.role || 'Developer / Founder'}</Text>{data.profile.email ? <Text style={styles.profileEmail}>{data.profile.email}</Text> : <Text style={styles.profileEmail}>Ku dar email-kaaga</Text>}
        <Button title="Wax ka beddel profile" icon="create-outline" variant="outline" onPress={() => openForm('profile')} style={{ alignSelf: 'center', marginTop: 15 }} />
      </Card>
      <SectionTitle title="Kaydkaaga" />
      <Card style={{ padding: 0 }}>
        <ProfileLine icon="layers-outline" tint={C.lilac} title="Mashaariic" value={String(data.projects.filter(p => p.type === 'project').length)} />
        <ProfileLine icon="bulb-outline" tint={C.amber} title="Fikrado" value={String(ideasCount)} />
        <ProfileLine icon="calendar-outline" tint={C.mint} title="Hawlo guud ahaan" value={String(data.tasks.length)} last />
      </Card>
      <SectionTitle title="Dejinta & xogta" />
      <Card style={{ padding: 0 }}>
        <Pressable style={styles.settingRow} onPress={backup}><View style={[styles.settingIcon, { backgroundColor: C.blue }]}><Icon name="share-outline" size={20} color="#3B69AD" /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Dhoofso kaydka xogta</Text><Text style={styles.settingBody}>La wadaag ama meel kale ku kaydi xogtaada.</Text></View><Icon name="chevron-forward" size={18} color={C.muted} /></Pressable>
        <Pressable style={styles.settingRow} onPress={() => Alert.alert('Ku saabsan HalMeel', 'HalMeel — meel lagu kaydiyo mashaariicda, fikradaha iyo jadwalkaaga. Xogtu hadda waxay ku kaydsan tahay telefoonkan.') }><View style={[styles.settingIcon, { backgroundColor: C.lilac }]}><Icon name="information-circle-outline" size={20} color={C.primary} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Ku saabsan HalMeel</Text><Text style={styles.settingBody}>Nooca koowaad · Offline-first</Text></View><Icon name="chevron-forward" size={18} color={C.muted} /></Pressable>
        <Pressable style={styles.settingRow} onPress={clearData}><View style={[styles.settingIcon, { backgroundColor: C.rose }]}><Icon name="trash-outline" size={20} color={C.red} /></View><View style={{ flex: 1 }}><Text style={[styles.settingTitle, { color: C.red }]}>Tirtir xogta gudaha</Text><Text style={styles.settingBody}>Ka saar xogta telefoonkan.</Text></View><Icon name="chevron-forward" size={18} color={C.muted} /></Pressable>
      </Card>
      <View style={styles.localNote}><Icon name="shield-checkmark-outline" size={18} color={C.green} /><Text style={styles.localNoteText}>Xogtaadu hadda telefoonkan ayay ku jirtaa. Dhoofso kayd joogto ah; cloud sync iyo account login wali kuma jiraan.</Text></View>
      <Text style={styles.footerText}>HALMEEL · FIKRAD → QORSHE → HIRGELIN</Text>
    </ScrollView>
  );

  if (!ready) return <SafeAreaView style={styles.loading}><StatusBar barStyle="dark-content" backgroundColor={C.bg} /><View style={styles.loadingMark}><Icon name="sparkles" size={30} color={C.primary} /></View><Text style={styles.loadingTitle}>HalMeel</Text><Text style={styles.pageSubtitle}>Xogtaada ayaa la diyaarinayaa...</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
    <View style={styles.appTopBar}><View style={styles.brandMark}><Icon name="grid" size={19} color={C.white} /></View><View style={{ flex: 1 }}><Text style={styles.brandName}>HalMeel</Text><Text style={styles.brandCaption}>FIKRAD • QORSHE • HIRGELIN</Text></View><Pressable onPress={() => openForm('task')} style={styles.headerAction}><Icon name="notifications-outline" size={20} color={C.ink} /><View style={styles.headerActionDot} /></Pressable></View>
    <View style={styles.mainArea}>{tab === 'home' ? renderHome() : tab === 'projects' ? renderProjects() : tab === 'calendar' ? renderCalendar() : renderProfile()}</View>
    <View style={styles.tabBar}>
      <TabButton active={tab === 'home'} icon="home-outline" activeIcon="home" label="Hoy" onPress={() => setTab('home')} />
      <TabButton active={tab === 'projects'} icon="layers-outline" activeIcon="layers" label="Mashaariic" onPress={() => setTab('projects')} />
      <TabButton active={tab === 'calendar'} icon="calendar-outline" activeIcon="calendar" label="Jadwal" onPress={() => setTab('calendar')} />
      <TabButton active={tab === 'profile'} icon="person-circle-outline" activeIcon="person-circle" label="Profile" onPress={() => setTab('profile')} />
    </View>
    <Modal visible={!!modal} animationType="slide" transparent onRequestClose={closeModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {modal === 'detail' && selectedItem ? <>
            <View style={styles.modalHeaderRow}><View style={[styles.projectIcon, selectedItem.type === 'idea' ? { backgroundColor: C.amber } : { backgroundColor: C.lilac }]}><Icon name={selectedItem.type === 'idea' ? 'bulb-outline' : 'layers-outline'} size={22} color={C.primary} /></View><View style={{ flex: 1 }}><Text style={styles.modalTitle}>{selectedItem.title}</Text><Text style={styles.modalSubtitle}>{selectedItem.type === 'idea' ? 'Fikrad kaydsan' : 'Faahfaahinta mashruuca'}</Text></View><Pressable onPress={closeModal} hitSlop={10}><Icon name="close" size={22} color={C.muted} /></Pressable></View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 15 }}>
              <View style={styles.detailTagRow}><View style={styles.statusTag}><Text style={styles.statusTagText}>{selectedItem.category || 'Guud'}</Text></View>{selectedItem.type === 'project' ? <View style={styles.statusTag}><Text style={styles.statusTagText}>{selectedItem.status || 'Bilow'}</Text></View> : null}</View>
              <Text style={styles.formLabel}>FAAHFAAHIN</Text><Text style={styles.detailDescription}>{selectedItem.description || 'Faahfaahin laguma darin weli.'}</Text>
              {selectedItem.dueDate ? <View style={styles.detailInfoLine}><Icon name="calendar-outline" size={17} color={C.primary} /><Text style={styles.detailInfoText}>Wakhtiga la beegsanayo: {dateLabel(selectedItem.dueDate)}</Text></View> : null}
              {selectedItem.type === 'project' ? <Button title={`Xaaladda: ${selectedItem.status || 'Bilow'} · Beddel`} icon="sync-outline" variant="soft" onPress={() => { changeStatus(selectedItem); setSelectedItem(prev => ({ ...prev, status: STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(prev.status || 'Bilow') + 1) % STATUS_OPTIONS.length] })); }} style={{ marginTop: 15 }} /> : null}
              <View style={styles.modalActions}><Button title="Wax ka beddel" icon="create-outline" variant="outline" onPress={() => openForm(selectedItem.type === 'idea' ? 'idea' : 'project', selectedItem)} style={{ flex: 1 }} /><Button title="Tirtir" icon="trash-outline" variant="danger" onPress={() => deleteEntity('project', selectedItem.id)} style={{ flex: 1 }} /></View>
            </ScrollView>
          </> : modal === 'profile' ? <>
            <ModalHeading title="Profile-kaaga" subtitle="Geli magaca iyo xogta lagugu aqoonsado." onClose={closeModal} />
            <ScrollView keyboardShouldPersistTaps="handled"><FormField label="MAGACA" value={draft.name || ''} onChangeText={v => updateDraft('name', v)} placeholder="Magacaaga oo buuxa" /><FormField label="EMAIL" value={draft.email || ''} onChangeText={v => updateDraft('email', v)} placeholder="magac@email.com" keyboardType="email-address" /><FormField label="SHAQADA / DOORKA" value={draft.role || ''} onChangeText={v => updateDraft('role', v)} placeholder="Developer, Founder..." /><Button title="Kaydi profile-ka" icon="checkmark" onPress={saveForm} style={{ marginTop: 5 }} /></ScrollView>
          </> : <>
            <ModalHeading title={modal === 'project' ? (draft.editing ? 'Wax ka beddel mashruuc' : 'Mashruuc cusub') : modal === 'idea' ? (draft.editing ? 'Wax ka beddel fikrad' : 'Kaydi fikrad cusub') : (draft.editing ? 'Wax ka beddel hawl' : 'Hawl cusub')} subtitle={modal === 'task' ? 'Ku dar hawl, taariikh iyo wakhti.' : 'Faahfaahintaada ku qor halkan si ammaan ah loogu kaydiyo.'} onClose={closeModal} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 15 }}>
              <FormField label="CINWAAN *" value={draft.title || ''} onChangeText={v => updateDraft('title', v)} placeholder={modal === 'idea' ? 'Tusaale: fikrad app cusub...' : modal === 'task' ? 'Tusaale: dhammee design-ka' : 'Magaca mashruuca'} />
              <FormField label="FAAHFAAHIN / XUSUUS" value={draft.description || ''} onChangeText={v => updateDraft('description', v)} placeholder="Qor faahfaahin, yool, links ama waxyaabo muhiim ah..." multiline />
              {modal !== 'task' ? <>
                <FormField label="QAYBTA" value={draft.category || ''} onChangeText={v => updateDraft('category', v)} placeholder="Software, Business, Design..." />
                {modal === 'project' ? <><Text style={styles.formLabel}>XAAALADDA</Text><View style={styles.optionWrap}>{STATUS_OPTIONS.map(v => <Pill key={v} label={v} active={(draft.status || 'Bilow') === v} onPress={() => updateDraft('status', v)} />)}</View></> : null}
                <Text style={styles.formLabel}>MUHIIMADDA</Text><View style={styles.optionWrap}>{PRIORITY_OPTIONS.map(v => <Pill key={v} label={v} active={(draft.priority || 'Caadi') === v} onPress={() => updateDraft('priority', v)} />)}</View>
                <FormField label="TAARIIKHDA UGU DAMBAYSA (IKHTIYAARI)" value={draft.dueDate || ''} onChangeText={v => updateDraft('dueDate', v)} placeholder="YYYY-MM-DD" />
              </> : <>
                <FormField label="TAARIIKHDA * (YYYY-MM-DD)" value={draft.date || ''} onChangeText={v => updateDraft('date', v)} placeholder="2026-10-23" />
                <FormField label="WAKHTIGA (24-SAAC)" value={draft.time || ''} onChangeText={v => updateDraft('time', v)} placeholder="09:00" />
                <FormField label="MASHRUUCA (IKHTIYAARI)" value={draft.projectName || ''} onChangeText={v => updateDraft('projectName', v)} placeholder="Haddii hawshu mashruuc gaar ah la xiriirto" />
                <Text style={styles.formLabel}>MUHIIMADDA</Text><View style={styles.optionWrap}>{PRIORITY_OPTIONS.map(v => <Pill key={v} label={v} active={(draft.priority || 'Caadi') === v} onPress={() => updateDraft('priority', v)} />)}</View>
              </>}
              <Button title="Kaydi" icon="checkmark-circle-outline" onPress={saveForm} style={{ marginTop: 20 }} />
            </ScrollView>
          </>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}

function StatCard({ icon, value, label, tone }) {
  const bg = tone === 'purple' ? C.lilac : tone === 'amber' ? C.amber : C.mint;
  const color = tone === 'purple' ? C.primary : tone === 'amber' ? C.orange : C.green;
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: bg }]}><Icon name={icon} size={18} color={color} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function QuickAction({ icon, color, bg, title, body, onPress }) {
  return <Pressable onPress={onPress} style={styles.quickAction}><View style={[styles.quickIcon, { backgroundColor: bg }]}><Icon name={icon} size={22} color={color} /></View><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickBody}>{body}</Text><View style={styles.quickArrow}><Icon name="arrow-up-forward" size={13} color={C.muted} /></View></Pressable>;
}
function ProfileLine({ icon, tint, title, value, last }) {
  return <View style={[styles.profileLine, !last && styles.separator]}><View style={[styles.settingIcon, { backgroundColor: tint }]}><Icon name={icon} size={19} color={C.primary} /></View><Text style={styles.profileLineTitle}>{title}</Text><Text style={styles.profileLineValue}>{value}</Text></View>;
}
function TabButton({ active, icon, activeIcon, label, onPress }) {
  return <Pressable onPress={onPress} style={styles.tabItem}><View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}><Icon name={active ? activeIcon : icon} size={21} color={active ? C.primary : C.muted} /></View><Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text></Pressable>;
}
function ModalHeading({ title, subtitle, onClose }) {
  return <View style={styles.modalHeaderRow}><View style={{ flex: 1 }}><Text style={styles.modalTitle}>{title}</Text><Text style={styles.modalSubtitle}>{subtitle}</Text></View><Pressable onPress={onClose} style={styles.closeButton}><Icon name="close" size={19} color={C.ink} /></Pressable></View>;
}
function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return <View style={styles.formField}><Text style={styles.formLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA1B2" multiline={multiline} keyboardType={keyboardType || 'default'} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} style={[styles.formInput, multiline && styles.formInputMulti]} textAlignVertical={multiline ? 'top' : 'center'} /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, loading: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, loadingMark: { width: 68, height: 68, borderRadius: 22, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, loadingTitle: { fontSize: 25, fontWeight: '900', color: C.ink, marginBottom: 5 },
  appTopBar: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 13, backgroundColor: C.bg }, brandMark: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary }, brandName: { fontSize: 19, fontWeight: '900', letterSpacing: -0.5, color: C.ink }, brandCaption: { fontSize: 8.5, letterSpacing: 1.2, color: C.muted, fontWeight: '800', marginTop: 1 }, headerAction: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }, headerActionDot: { position: 'absolute', top: 9, right: 10, width: 6, height: 6, backgroundColor: C.primary, borderRadius: 4 },
  mainArea: { flex: 1 }, screenContent: { paddingHorizontal: 18, paddingBottom: 24 }, greetingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9, marginBottom: 18 }, eyebrow: { fontSize: 9.5, color: C.primary, fontWeight: '900', letterSpacing: 1.3, marginBottom: 6 }, greeting: { color: C.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.8 }, greetingSub: { color: C.muted, fontSize: 12.5, marginTop: 5 }, avatar: { width: 45, height: 45, borderRadius: 16, backgroundColor: '#DCD8FF', borderWidth: 1, borderColor: '#C8C1FF', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }, avatarText: { color: C.primaryDark, fontWeight: '900', fontSize: 14 },
  heroCard: { backgroundColor: C.navy, borderRadius: 25, padding: 20, overflow: 'hidden', minHeight: 228, marginBottom: 16, position: 'relative' }, heroPatternOne: { position: 'absolute', width: 190, height: 190, right: -72, top: -84, borderRadius: 100, borderWidth: 1, borderColor: '#343B61' }, heroPatternTwo: { position: 'absolute', width: 132, height: 132, right: -42, top: -54, borderRadius: 100, borderWidth: 1, borderColor: '#454C7A' }, heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#30375A', marginBottom: 14 }, heroBadgeText: { color: '#E8E5FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 }, heroTitle: { color: C.white, fontSize: 25, fontWeight: '900', lineHeight: 30, letterSpacing: -0.6 }, heroBody: { color: '#C4C9DE', fontSize: 11.5, marginTop: 8 }, heroDecor: { position: 'absolute', right: 22, bottom: 32, width: 67, height: 67, borderRadius: 23, backgroundColor: '#34365E', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] },
  button: { minHeight: 45, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonPrimary: { backgroundColor: C.primary }, buttonOutline: { backgroundColor: C.white, borderWidth: 1, borderColor: '#DCD8FF' }, buttonSoft: { backgroundColor: C.lilac }, buttonGhost: { backgroundColor: 'transparent' }, buttonSmall: { minHeight: 32, paddingHorizontal: 11, borderRadius: 11 }, buttonText: { fontSize: 13, color: C.white, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 9, marginBottom: 22 }, statCard: { flex: 1, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, paddingVertical: 13 }, statIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 11 }, statValue: { color: C.ink, fontWeight: '900', fontSize: 22 }, statLabel: { color: C.muted, fontSize: 10, lineHeight: 14, marginTop: 3, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11, marginTop: 2 }, sectionTitle: { fontSize: 15, color: C.ink, fontWeight: '900', letterSpacing: -0.2 }, sectionAction: { color: C.primary, fontSize: 11, fontWeight: '800' }, quickGrid: { flexDirection: 'row', gap: 9, marginBottom: 22 }, quickAction: { flex: 1, minHeight: 118, backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 18, padding: 12, position: 'relative' }, quickIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 11 }, quickTitle: { color: C.ink, fontSize: 12, fontWeight: '900' }, quickBody: { color: C.muted, fontSize: 9.5, marginTop: 4 }, quickArrow: { position: 'absolute', right: 10, top: 10 },
  card: { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 15, marginBottom: 15 }, inlineEmpty: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 6 }, inlineEmptyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center' }, inlineEmptyTitle: { color: C.ink, fontSize: 12, fontWeight: '800' }, inlineEmptyBody: { color: C.muted, fontSize: 10.5, marginTop: 4, lineHeight: 15 }, taskRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F1F6' }, taskRowCompact: { paddingVertical: 12 }, checkCircle: { width: 23, height: 23, borderRadius: 8, borderWidth: 1.4, borderColor: '#CDD1E0', alignItems: 'center', justifyContent: 'center' }, checkCircleDone: { backgroundColor: C.green, borderColor: C.green }, taskTitle: { fontSize: 12.5, color: C.ink, fontWeight: '800' }, taskDoneText: { color: C.muted, textDecorationLine: 'line-through' }, taskMeta: { color: C.muted, fontSize: 10, marginTop: 4 }, priorityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  pageHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, marginBottom: 17 }, pageTitle: { fontSize: 24, fontWeight: '900', color: C.ink, letterSpacing: -0.8 }, pageSubtitle: { color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 17 }, roundAdd: { width: 43, height: 43, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOpacity: 0.18, shadowRadius: 10, elevation: 3 }, searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, paddingHorizontal: 13, minHeight: 46, gap: 9, marginBottom: 13 }, searchInput: { flex: 1, color: C.ink, fontSize: 12 }, segmented: { backgroundColor: '#EBEDF5', borderRadius: 15, flexDirection: 'row', padding: 4, marginBottom: 16, gap: 3 }, pill: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, backgroundColor: 'transparent' }, pillActive: { backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }, pillText: { fontSize: 11.5, color: C.muted, fontWeight: '700' }, pillTextActive: { color: C.primary, fontWeight: '900' },
  projectCard: { backgroundColor: C.white, borderRadius: 19, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 11 }, projectTopLine: { flexDirection: 'row', alignItems: 'center', gap: 11 }, projectIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, projectName: { fontSize: 13.5, fontWeight: '900', color: C.ink }, projectCategory: { fontSize: 10.5, color: C.muted, marginTop: 4 }, projectDescription: { fontSize: 11, color: '#656D80', lineHeight: 16, marginTop: 11 }, projectBottomLine: { marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#F0F1F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, statusTag: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F0F1F7' }, statusTagText: { fontSize: 9.5, fontWeight: '800', color: '#6F778B' }, dueText: { color: C.muted, fontSize: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 }, emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }, emptyTitle: { fontSize: 14, fontWeight: '900', color: C.ink, textAlign: 'center' }, emptyBody: { fontSize: 11.5, color: C.muted, textAlign: 'center', lineHeight: 18, marginTop: 6, maxWidth: 270 },
  calendarCard: { padding: 15, marginTop: 1 }, monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 }, monthArrow: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F4F5FA', alignItems: 'center', justifyContent: 'center' }, monthTitle: { fontSize: 15, fontWeight: '900', color: C.ink }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayHeaderCell: { width: '14.2857%', alignItems: 'center', marginBottom: 10 }, dayHeaderText: { fontSize: 9.5, color: C.muted, fontWeight: '800' }, dateCell: { width: '14.2857%', minHeight: 42, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 }, dateBubble: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, dateBubbleSelected: { backgroundColor: C.primary }, dateBubbleToday: { backgroundColor: C.lilac }, dateText: { color: C.ink, fontSize: 11.5, fontWeight: '600' }, dateTextSelected: { color: C.white, fontWeight: '900' }, dateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary, marginTop: 2 }, dateDotPlaceholder: { height: 6 }, calendarLegend: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 13, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 7 }, legendDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary }, legendText: { flex: 1, fontSize: 9.5, color: C.muted }, dateTasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 13 }, addText: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 8 }, addTextLabel: { color: C.primary, fontWeight: '800', fontSize: 11 }, completedToggle: { backgroundColor: '#EEF0F7', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 13, paddingRight: 6, minHeight: 41, marginBottom: 12 }, completedLabel: { color: C.muted, fontSize: 10.5, fontWeight: '700' },
  profileCard: { alignItems: 'center', paddingVertical: 23, marginBottom: 23 }, profileAvatar: { width: 78, height: 78, borderRadius: 27, backgroundColor: C.lilac, borderWidth: 2, borderColor: '#DCD7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, profileAvatarText: { color: C.primaryDark, fontSize: 23, fontWeight: '900' }, onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 13, height: 13, borderRadius: 7, backgroundColor: C.green, borderWidth: 2, borderColor: C.white }, profileName: { color: C.ink, fontWeight: '900', fontSize: 18 }, profileRole: { color: C.primary, fontWeight: '800', fontSize: 11, marginTop: 5 }, profileEmail: { color: C.muted, fontSize: 11, marginTop: 6 }, profileLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 11 }, separator: { borderBottomWidth: 1, borderBottomColor: '#F0F1F6' }, profileLineTitle: { flex: 1, color: C.ink, fontWeight: '700', fontSize: 12 }, profileLineValue: { color: C.muted, fontSize: 12, fontWeight: '900' }, settingRow: { minHeight: 72, paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#F0F1F6' }, settingIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, settingTitle: { color: C.ink, fontWeight: '800', fontSize: 12 }, settingBody: { color: C.muted, fontSize: 10, marginTop: 4, lineHeight: 14 }, localNote: { backgroundColor: C.mint, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 3 }, localNoteText: { flex: 1, color: '#3F7665', fontSize: 10.5, lineHeight: 16 }, footerText: { textAlign: 'center', color: '#A7ADBC', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.7, marginTop: 25, marginBottom: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 5 : 8, paddingHorizontal: 8 }, tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, tabIconWrap: { width: 43, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, tabIconWrapActive: { backgroundColor: C.lilac }, tabLabel: { color: C.muted, fontSize: 9.5, fontWeight: '700' }, tabLabelActive: { color: C.primary, fontWeight: '900' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,25,48,0.40)' }, modalSheet: { maxHeight: '91%', backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 15 }, modalHandle: { width: 42, height: 4, borderRadius: 5, backgroundColor: '#DADDE8', alignSelf: 'center', marginBottom: 18 }, modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 17 }, modalTitle: { color: C.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 }, modalSubtitle: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, closeButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#F2F3F8', alignItems: 'center', justifyContent: 'center' }, formField: { marginBottom: 14 }, formLabel: { color: '#858DA1', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 7 }, formInput: { minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: '#FAFBFE', paddingHorizontal: 13, color: C.ink, fontSize: 12 }, formInputMulti: { minHeight: 88, paddingTop: 12, paddingBottom: 12 }, optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 22 }, detailTagRow: { flexDirection: 'row', gap: 7, marginBottom: 16 }, detailDescription: { color: '#656D80', fontSize: 12, lineHeight: 20 }, detailInfoLine: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 14 }, detailInfoText: { fontSize: 11, color: C.ink, fontWeight: '700' },
});
