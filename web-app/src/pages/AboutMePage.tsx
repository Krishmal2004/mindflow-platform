import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AboutMePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingData, setExistingData] = useState<AboutMeData | null>(null);

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
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setPopup({ visible: true, type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to save profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
      <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E3F2FD', borderTopColor: '#749F82', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      </PageShell>
    );
  }

  const isCompleted = existingData?.is_completed === true;

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1.5px solid #DFE6E9',
    borderRadius: 12,
    fontSize: 15,
    color: '#2D3436',
    background: isCompleted ? '#F6F8F9' : '#fff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#636E72', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'block', marginBottom: 8 };

  const pillStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: 20,
    border: `1.5px solid ${active ? '#749F82' : '#DFE6E9'}`,
    background: active ? '#E6F4EA' : '#fff',
    color: active ? '#749F82' : '#636E72',
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: isCompleted ? 'default' : 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <PageShell>
    <div style={{ minHeight: '100vh', background: '#F6F8F9', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#749F82', paddingTop: 'env(safe-area-inset-top, 0px)', padding: '16px 20px 20px' }}>
        <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18 }}>←</button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>About Me</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Personal profile information</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px' }}>
        {isCompleted && (
          <div style={{ background: '#E6F4EA', borderRadius: 16, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <p style={{ color: '#749F82', fontWeight: 600, fontSize: 14 }}>Profile Completed</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* University ID */}
          <div>
            <label style={labelStyle}>University ID *</label>
            <input value={universityId} onChange={e => setUniversityId(e.target.value)} placeholder="e.g., 2021CS001" style={inputStyle} disabled={isCompleted} />
          </div>

          {/* Education Level */}
          <div>
            <label style={labelStyle}>Education Level *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EDUCATION_LEVELS.map(l => (
                <button key={l} onClick={() => !isCompleted && setEducationLevel(l)} style={{ ...pillStyle(educationLevel === l), cursor: isCompleted ? 'default' : 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty */}
          <div>
            <label style={labelStyle}>Faculty *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FACULTIES.map(f => (
                <button
                  key={f}
                  onClick={() => { if (isCompleted) return; setFaculty(f); setMajor(''); }}
                  style={{ ...pillStyle(faculty === f), cursor: isCompleted ? 'default' : 'pointer' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Major (depends on Faculty, same as mobile) */}
          <div>
            <label style={labelStyle}>Major / Field of Study *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(faculty ? FACULTY_MAJORS[faculty] || [] : []).map(m => (
                <button key={m} onClick={() => !isCompleted && setMajor(m)} style={{ ...pillStyle(major === m), cursor: isCompleted ? 'default' : 'pointer' }}>
                  {m}
                </button>
              ))}
              {!faculty && <p style={{ fontSize: 13, color: '#94A3B8' }}>Select a Faculty first</p>}
            </div>
          </div>

          {/* Age */}
          <div>
            <label style={labelStyle}>Age *</label>
            <input value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="Your age" style={{ ...inputStyle, width: 120 }} disabled={isCompleted} />
          </div>

          {/* Living Situation */}
          <div>
            <label style={labelStyle}>Living Situation *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LIVING_SITUATIONS.map(l => (
                <button key={l} onClick={() => !isCompleted && setLivingSituation(l)} style={{ ...pillStyle(livingSituation === l), cursor: isCompleted ? 'default' : 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Family Background */}
          <div>
            <label style={labelStyle}>Family Background *</label>
            <textarea value={familyBackground} onChange={e => setFamilyBackground(e.target.value)} placeholder="Describe your family background..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} disabled={isCompleted} />
          </div>

          {/* Cultural Background */}
          <div>
            <label style={labelStyle}>Cultural / Religious Background *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CULTURAL_BACKGROUNDS.map(c => (
                <button key={c} onClick={() => !isCompleted && setCulturalBackground(c)} style={{ ...pillStyle(culturalBackground === c), cursor: isCompleted ? 'default' : 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
            {culturalBackground === 'Other' && !isCompleted && (
              <input value={culturalOther} onChange={e => setCulturalOther(e.target.value)} placeholder="Please specify..." style={{ ...inputStyle, marginTop: 8 }} />
            )}
          </div>

          {/* Hobbies */}
          <div>
            <label style={labelStyle}>Hobbies & Interests *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HOBBIES_OPTIONS.map(h => (
                <button key={h} onClick={() => !isCompleted && toggleHobby(h)} style={{ ...pillStyle(selectedHobbies.includes(h)), cursor: isCompleted ? 'default' : 'pointer' }}>
                  {h}
                </button>
              ))}
            </div>
            {selectedHobbies.includes('Other') && !isCompleted && (
              <input value={hobbiesOther} onChange={e => setHobbiesOther(e.target.value)} placeholder="Describe other hobbies..." style={{ ...inputStyle, marginTop: 8 }} />
            )}
          </div>

          {/* Personal Goals */}
          <div>
            <label style={labelStyle}>Personal Goals</label>
            <textarea value={personalGoals} onChange={e => setPersonalGoals(e.target.value)} placeholder="What are your personal goals?" rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} disabled={isCompleted} />
          </div>

          {/* Why MindFlow */}
          <div>
            <label style={labelStyle}>Why MindFlow? *</label>
            <textarea value={whyMindflow} onChange={e => setWhyMindflow(e.target.value)} placeholder="Why did you join this research study?" rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} disabled={isCompleted} />
          </div>

          {/* Declaration */}
          {!isCompleted && (
            <div style={{ background: '#E6F4EA', borderRadius: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={declaration} onChange={e => setDeclaration(e.target.checked)} id="declaration" style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#749F82' }} />
              <label htmlFor="declaration" style={{ fontSize: 13, color: '#2D3436', lineHeight: 1.6, cursor: 'pointer' }}>
                I declare that the information provided is accurate and I consent to participating in the MindFlow research study.
              </label>
            </div>
          )}

          {!isCompleted && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: 16, background: '#749F82', color: '#fff',
                border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          )}
        </div>
      </div>

      <PopupModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(p => ({ ...p, visible: false }))}
      />
    </div>
    </PageShell>
  );
}
