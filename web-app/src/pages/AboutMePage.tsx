import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Star, CheckCircle2, Info, School, ArrowLeft, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';
import { PageShell } from '@/components/PageShell';

// Mirrors mobile/src/screens/AboutMeScreen.tsx exactly — these option lists and the
// faculty->major dependency are part of the research data schema, not just UI copy.
const EDUCATION_LEVELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate Student', 'Other'];
const LIVING_SITUATIONS = [
  'Living at Home (Commuting)',
  'University Hostel / Dormitory',
  'Private Boarding / Room Rentals',
  'Private Apartment / Studio Living',
  'Living with Relatives (Guardian Setup)',
];
const CULTURAL_BACKGROUNDS = ['Buddhism', 'Islam', 'Hindu', 'Christian', 'Other'];
const HOBBIES_OPTIONS = [
  'Reading', 'Sports & Fitness', 'Music', 'Travel', 'Cooking & Baking',
  'Video Gaming', 'Art & Crafts', 'Hiking & Outdoors', 'Watching Movies/TV', 'Photography', 'Other',
];
const FACULTIES = [
  'Faculty of Computing',
  'Faculty of Engineering',
  'SLIIT Business School',
  'Faculty of Humanities & Sciences',
  'School of Architecture',
];
const FACULTY_MAJORS: Record<string, string[]> = {
  'Faculty of Computing': [
    'Artificial Intelligence', 'Software Engineering', 'Information Technology', 'Data Science',
    'Cyber Security', 'Information Systems Engineering', 'Interactive Media', 'Computer Systems Engineering',
    'Computer Systems and Network Engineering', 'Computer Science',
  ],
  'Faculty of Engineering': [
    'Civil Engineering', 'Mechanical Engineering', 'Mechanical Engineering (Mechatronics Specialisation)',
    'Mechatronic Engineering', 'Materials Engineering', 'Electrical Engineering', 'Electrical & Electronic Engineering',
    'Quantity Surveying',
  ],
  'SLIIT Business School': [
    'Business Analytics', 'Business Administration', 'Business Management', 'Commerce', 'Economics',
    'Fashion Business & Management', 'Marketing Management', 'Human Capital Management',
    'Logistics and Supply Chain Management', 'Management Information Systems', 'Accounting & Finance',
    'Quality Management',
  ],
  'Faculty of Humanities & Sciences': [
    'Psychology', 'Nursing (Higher National Diploma / NVQ Level 6)', 'Physical Sciences (BEd Hons)',
    'Biological Sciences (BEd Hons)', 'Social Sciences (BEd Hons)', 'English (BEd Hons)',
    'English Studies (BA Hons)', 'Law (LLB / Bachelor of Laws)', 'Biomedical Science', 'Biotechnology',
    'Financial Mathematics and Applied Statistics',
  ],
  'School of Architecture': ['Architecture', 'Interior Design', 'Heritage and Cultural Tourism'],
};

const COLOR = '#0F9B71';

interface AboutMeData {
  is_completed?: boolean;
  university_id?: string;
  education_level?: string;
  faculty?: string;
  major_field_of_study?: string;
  age?: string | number;
  living_situation?: string;
  family_background?: string;
  cultural_background?: string;
  hobbies_interests?: string | string[];
  personal_goals?: string;
  why_mindflow?: string;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, color: '#2D3436', fontWeight: 600, lineHeight: 1.4 }}>{value || 'Not Specified'}</p>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, marginBottom: 16, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ background: '#E7F9F1', padding: 8, borderRadius: 10, display: 'flex', color: '#0F9B71' }}>{icon}</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export default function AboutMePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingData, setExistingData] = useState<AboutMeData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
  const [universityId, setUniversityId] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [age, setAge] = useState('');
  const [livingSituation, setLivingSituation] = useState('');
  const [familyBackground, setFamilyBackground] = useState('');
  const [culturalBackground, setCulturalBackground] = useState('');
  const [culturalOther, setCulturalOther] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [hobbiesOther, setHobbiesOther] = useState('');
  const [personalGoals, setPersonalGoals] = useState('');
  const [whyMindflow, setWhyMindflow] = useState('');
  const [declaration, setDeclaration] = useState(false);

  const [popup, setPopup] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    visible: false, type: 'info', title: '', message: '',
  });

  useEffect(() => {
    api.getAboutMe()
      .then(data => {
        const d = data as AboutMeData;
        setExistingData(d);
        if (d.university_id) setUniversityId(d.university_id);
        if (d.education_level) setEducationLevel(d.education_level);
        if (d.faculty) setFaculty(d.faculty);
        if (d.major_field_of_study) setMajor(d.major_field_of_study);
        if (d.age) setAge(String(d.age));
        if (d.living_situation) setLivingSituation(d.living_situation);
        if (d.family_background) setFamilyBackground(d.family_background);
        if (d.cultural_background) {
          // A previously-saved custom value that isn't one of the known pills still
          // needs to show as "Other" with its text preserved, same as mobile does.
          if (CULTURAL_BACKGROUNDS.includes(d.cultural_background)) {
            setCulturalBackground(d.cultural_background);
          } else {
            setCulturalBackground('Other');
            setCulturalOther(d.cultural_background);
          }
        }
        if (d.hobbies_interests) {
          const raw = Array.isArray(d.hobbies_interests) ? d.hobbies_interests : (d.hobbies_interests as string).split(',').map(s => s.trim()).filter(Boolean);
          const known = raw.filter(hb => HOBBIES_OPTIONS.includes(hb));
          const other = raw.filter(hb => !HOBBIES_OPTIONS.includes(hb));
          setSelectedHobbies(other.length > 0 ? [...known, 'Other'] : known);
          if (other.length > 0) setHobbiesOther(other.join(', '));
        }
        if (d.personal_goals) setPersonalGoals(d.personal_goals);
        if (d.why_mindflow) setWhyMindflow(d.why_mindflow);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleHobby = (h: string) => {
    setSelectedHobbies(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const handleSubmit = async () => {
    // Mirrors mobile/src/screens/AboutMeScreen.tsx#save's required-field validation
    // (client-side UX; the backend enforces the same set server-side as defense in depth).
    if (!universityId.trim()) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please enter your University ID.' }); return; }
    if (!educationLevel) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please select your Education Level.' }); return; }
    if (!faculty) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please select your Faculty.' }); return; }
    if (!major) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please select your Major.' }); return; }
    const ageNum = age ? parseInt(age, 10) : NaN;
    if (!age || isNaN(ageNum) || ageNum <= 0) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please enter a valid Age.' }); return; }
    if (!livingSituation) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please select your Living Situation.' }); return; }
    if (!familyBackground.trim()) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please describe your Family Background.' }); return; }
    if (!culturalBackground) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please select your Cultural Background.' }); return; }
    if (selectedHobbies.length === 0) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please select at least one Hobby.' }); return; }
    if (!whyMindflow.trim()) { setPopup({ visible: true, type: 'warning', title: 'Required Field', message: 'Please share your Previous Experience.' }); return; }
    if (!declaration) { setPopup({ visible: true, type: 'warning', title: 'Declaration Required', message: 'Please confirm that your information is accurate before submitting.' }); return; }

    const hobbiesArr = selectedHobbies
      .filter(h => h !== 'Other')
      .concat(hobbiesOther.trim() ? [hobbiesOther.trim()] : []);

    setSubmitting(true);
    try {
      await api.submitAboutMe({
        university_id: universityId.trim(),
        education_level: educationLevel,
        faculty,
        major_field_of_study: major.trim(),
        age: age ? parseInt(age, 10) : null,
        living_situation: livingSituation,
        family_background: familyBackground.trim(),
        cultural_background: culturalBackground === 'Other' ? culturalOther.trim() : culturalBackground,
        // Backend column is `hobbies_interests` (see database/project_db.sql) — the
        // previous `hobbies` key here was silently dropped by the server's allowlist.
        hobbies_interests: hobbiesArr.join(', '),
        personal_goals: personalGoals.trim(),
        why_mindflow: whyMindflow.trim(),
        is_completed: true,
      });
      setExistingData(prev => ({ ...prev, is_completed: true }));
      setShowSuccess(true);
    } catch (err: unknown) {
      setPopup({ visible: true, type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to save profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
      <div style={{ minHeight: '100vh', background: '#F8FAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E3F2FD', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      </PageShell>
    );
  }

  const isCompleted = existingData?.is_completed === true;

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 14,
    fontSize: 15,
    color: '#2D3436',
    background: '#F8FAFC',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const pillStyle = (active: boolean) => ({
    padding: '8px 14px',
    borderRadius: 20,
    border: `1.5px solid ${active ? COLOR : '#E2E8F0'}`,
    background: active ? '#E7F9F1' : '#F1F5F9',
    color: active ? COLOR : '#334155',
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  // STEP badge + header shared by the three grouped form cards, matching mobile's
  // groupedFormCard / formCardHeader / stepBadge pattern.
  const FormCardHeader = ({ icon, title, subtitle, step }: { icon: ReactNode; title: string; subtitle: string; step: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFD', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#E7F9F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F9B71', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{subtitle}</p>
      </div>
      <div style={{ background: '#F1F5F9', borderRadius: 20, padding: '4px 10px', border: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{step}</span>
      </div>
    </div>
  );

  if (isCompleted && !showSuccess) {
    // Read-only summary — mobile shows grouped info cards, not a disabled form, once
    // the profile has already been completed.
    return (
      <PageShell>
      <div style={{ minHeight: '100vh', background: '#F8FAF8', paddingBottom: 40 }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ maxWidth: 430, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => navigate('/dashboard')} style={{ width: 40, height: 40, borderRadius: 20, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#1A1A2E', fontSize: 18 }}><ArrowLeft size={18} /></button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>About Me</p>
              <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Your research profile</p>
            </div>
            <div style={{ width: 40 }} />
          </div>
        </div>

        <div style={{ maxWidth: 430, margin: '0 auto', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#E7F9F1', padding: 16, borderRadius: 16, marginBottom: 16 }}>
            <CheckCircle2 size={24} color={COLOR} />
            <p style={{ color: COLOR, fontWeight: 700, fontSize: 15, margin: 0 }}>Profile Completed</p>
          </div>

          <InfoCard icon={<GraduationCap size={18} />} title="Academic Profile">
            <InfoField label="University ID" value={universityId} />
            <InfoField label="Education Level" value={educationLevel} />
            <InfoField label="Faculty" value={faculty} />
            <InfoField label="Major / Field of Study" value={major} />
          </InfoCard>

          <InfoCard icon={<User size={18} />} title="Personal Profile">
            <InfoField label="Age" value={age} />
            <InfoField label="Living Situation" value={livingSituation} />
            <InfoField label="Cultural Background" value={culturalBackground === 'Other' ? culturalOther : culturalBackground} />
            <InfoField label="Family Background" value={familyBackground} />
          </InfoCard>

          <InfoCard icon={<Star size={18} />} title="Interests & Experience">
            <InfoField label="Hobbies & Interests" value={selectedHobbies.filter(h => h !== 'Other').concat(hobbiesOther ? [hobbiesOther] : []).join(', ') || 'None Specified'} />
            <InfoField label="Personal Goals" value={personalGoals} />
            <InfoField label="Previous Experience" value={whyMindflow} />
          </InfoCard>
        </div>
      </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
    <div style={{ minHeight: '100vh', background: '#F8FAF8', paddingBottom: 40 }}>
      {/* Header — plain background matching mobile, not a colored banner */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: 430, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/dashboard')} style={{ width: 40, height: 40, borderRadius: 20, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#1A1A2E', fontSize: 18 }}><ArrowLeft size={18} /></button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>About Me</p>
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Your research profile</p>
          </div>
          <div style={{ width: 40 }} />
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: 16 }}>
        {/* Help banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#EFF6FF', borderRadius: 16, padding: 14, marginBottom: 16, border: '1px solid #BFDBFE' }}>
          <Info size={20} color="#0284C7" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', margin: 0, marginBottom: 3 }}>Help us know you better</p>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.4, margin: 0 }}>
              Please provide accurate and truthful information. This helps us personalise your MindFlow experience.
            </p>
          </div>
        </div>

        {/* CARD 1: ACADEMIC DETAILS */}
        <div style={{ background: '#fff', borderRadius: 20, marginBottom: 16, border: '1px solid #EEF2F7' }}>
          <FormCardHeader icon={<GraduationCap size={18} />} title="Academic Details" subtitle="Your university and area of study" step="1 / 3" />
          <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>University ID <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={universityId} onChange={e => setUniversityId(e.target.value)} placeholder="Your official student ID" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Education Level <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EDUCATION_LEVELS.map(l => (
                  <button key={l} onClick={() => setEducationLevel(l)} style={pillStyle(educationLevel === l)}>{l}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Faculty <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FACULTIES.map(f => (
                  <button key={f} onClick={() => { setFaculty(f); setMajor(''); }} style={pillStyle(faculty === f)}>{f}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Major / Field of Study <span style={{ color: '#EF4444' }}>*</span></label>
              {faculty ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(FACULTY_MAJORS[faculty] || []).map(m => (
                    <button key={m} onClick={() => setMajor(m)} style={pillStyle(major === m)}>{m}</button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 16 }}>
                  <School size={20} color="#94A3B8" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: 0 }}>Please select a Faculty above first to choose a Major.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: PERSONAL CONTEXT */}
        <div style={{ background: '#fff', borderRadius: 20, marginBottom: 16, border: '1px solid #EEF2F7' }}>
          <FormCardHeader icon={<User size={18} />} title="Personal Profile" subtitle="Background and living details" step="2 / 3" />
          <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Age <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="e.g. 21" maxLength={3} style={{ ...inputStyle, width: 100 }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Living Situation <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LIVING_SITUATIONS.map(sit => {
                  const isActive = livingSituation === sit;
                  return (
                    <button
                      key={sit}
                      onClick={() => setLivingSituation(sit)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
                        background: isActive ? '#E7F9F1' : '#F8FAFC', border: `1.5px solid ${isActive ? COLOR : '#E2E8F0'}`,
                        borderRadius: 14, padding: '12px 16px',
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: 10, border: `2px solid ${isActive ? COLOR : '#CBD5E1'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isActive && <span style={{ width: 10, height: 10, borderRadius: 5, background: COLOR, display: 'block' }} />}
                      </span>
                      <span style={{ fontSize: 14, color: isActive ? '#1A1A2E' : '#334155', fontWeight: isActive ? 700 : 500 }}>{sit}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Cultural Background <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CULTURAL_BACKGROUNDS.map(c => (
                  <button key={c} onClick={() => setCulturalBackground(c)} style={pillStyle(culturalBackground === c)}>{c}</button>
                ))}
              </div>
              {culturalBackground === 'Other' && (
                <input value={culturalOther} onChange={e => setCulturalOther(e.target.value)} placeholder="Specify cultural background..." style={{ ...inputStyle, marginTop: 12 }} />
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Family Background <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea value={familyBackground} onChange={e => setFamilyBackground(e.target.value)} placeholder="Tell us about your family..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 100, paddingTop: 12 }} />
            </div>
          </div>
        </div>

        {/* CARD 3: GOALS & MINDFLOW JOURNEY */}
        <div style={{ background: '#fff', borderRadius: 20, marginBottom: 16, border: '1px solid #EEF2F7' }}>
          <FormCardHeader icon={<Star size={18} />} title="Goals & Hobbies" subtitle="Your interests and previous experience" step="3 / 3" />
          <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Hobbies & Interests <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HOBBIES_OPTIONS.map(h => (
                  <button key={h} onClick={() => toggleHobby(h)} style={pillStyle(selectedHobbies.includes(h))}>{h}</button>
                ))}
              </div>
              {selectedHobbies.includes('Other') && (
                <input value={hobbiesOther} onChange={e => setHobbiesOther(e.target.value)} placeholder="Specify other hobbies..." style={{ ...inputStyle, marginTop: 12 }} />
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Personal Goals</label>
              <textarea value={personalGoals} onChange={e => setPersonalGoals(e.target.value)} placeholder="What are you working towards?" rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 100, paddingTop: 12 }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 8 }}>Previous Experience <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea value={whyMindflow} onChange={e => setWhyMindflow(e.target.value)} placeholder="Have you done any mindfulness practices?" rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 100, paddingTop: 12 }} />
            </div>
          </div>
        </div>

        {/* Declaration */}
        <button
          onClick={() => setDeclaration(!declaration)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
            marginTop: 20, padding: 16, background: '#fff', borderRadius: 20,
            border: `1.5px solid ${declaration ? COLOR : '#E2E8F0'}`, boxSizing: 'border-box',
          }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: 6, border: `2px solid ${declaration ? COLOR : '#CBD5E1'}`,
            background: declaration ? COLOR : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {declaration && <Check size={14} color="#fff" strokeWidth={3} />}
          </span>
          <span style={{ fontSize: 13, color: '#1A1A2E', lineHeight: 1.4, fontWeight: 500 }}>
            I hereby confirm that all information provided above is true, accurate, and complete.
          </span>
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !declaration}
          style={{
            width: '100%', marginTop: 20, padding: 16, background: COLOR, color: '#fff',
            border: 'none', borderRadius: 24, fontSize: 16, fontWeight: 700,
            cursor: submitting || !declaration ? 'not-allowed' : 'pointer', opacity: submitting || !declaration ? 0.5 : 1,
          }}
        >
          {submitting ? 'Saving...' : 'Submit My Profile'}
        </button>
      </div>

      <PopupModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(p => ({ ...p, visible: false }))}
      />

      <PopupModal
        visible={showSuccess}
        type="success"
        title="Profile Completed!"
        message="Thank you for sharing your information. Your profile is now set up."
        buttonText="Continue"
        onClose={() => { setShowSuccess(false); navigate('/dashboard'); }}
      />
    </div>
    </PageShell>
  );
}
