import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PopupModal } from '@/components/PopupModal';

const EDUCATION_LEVELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate Student', 'Other'];
const LIVING_SITUATIONS = ['Dorm', 'Off-campus housing', 'With family', 'Other'];
const CULTURAL_BACKGROUNDS = ['Buddhism', 'Islam', 'Hindu', 'Christian', 'Other'];
const HOBBIES_OPTIONS = ['Reading', 'Sports', 'Music', 'Art', 'Gaming', 'Cooking', 'Travel', 'Yoga', 'Meditation', 'Nature', 'Other'];

interface AboutMeData {
  is_completed?: boolean;
  university_id?: string;
  education_level?: string;
  major_field_of_study?: string;
  age?: string | number;
  living_situation?: string;
  family_background?: string;
  cultural_background?: string;
  hobbies?: string | string[];
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
  const [major, setMajor] = useState('');
  const [age, setAge] = useState('');
  const [livingSituation, setLivingSituation] = useState('');
  const [livingOther, setLivingOther] = useState('');
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
        if (d.major_field_of_study) setMajor(d.major_field_of_study);
        if (d.age) setAge(String(d.age));
        if (d.living_situation) setLivingSituation(d.living_situation);
        if (d.family_background) setFamilyBackground(d.family_background);
        if (d.cultural_background) setCulturalBackground(d.cultural_background);
        if (d.hobbies) {
          const h = Array.isArray(d.hobbies) ? d.hobbies : (d.hobbies as string).split(',').map(s => s.trim());
          setSelectedHobbies(h.filter(hb => HOBBIES_OPTIONS.includes(hb)));
          const otherHobby = h.find(hb => !HOBBIES_OPTIONS.includes(hb));
          if (otherHobby) { setSelectedHobbies(prev => [...prev, 'Other']); setHobbiesOther(otherHobby); }
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
    if (!universityId.trim()) { setPopup({ visible: true, type: 'warning', title: 'Required', message: 'Please enter your university ID.' }); return; }
    if (!educationLevel) { setPopup({ visible: true, type: 'warning', title: 'Required', message: 'Please select your education level.' }); return; }
    if (!declaration) { setPopup({ visible: true, type: 'warning', title: 'Declaration Required', message: 'Please accept the declaration to proceed.' }); return; }

    const hobbiesArr = selectedHobbies.map(h => h === 'Other' ? hobbiesOther.trim() || 'Other' : h).filter(Boolean);

    setSubmitting(true);
    try {
      await api.submitAboutMe({
        university_id: universityId.trim(),
        education_level: educationLevel,
        major_field_of_study: major.trim(),
        age: age ? parseInt(age) : undefined,
        living_situation: livingSituation === 'Other' ? livingOther.trim() : livingSituation,
        family_background: familyBackground.trim(),
        cultural_background: culturalBackground === 'Other' ? culturalOther.trim() : culturalBackground,
        hobbies: hobbiesArr.join(', '),
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
      <div style={{ minHeight: '100vh', background: '#F6F8F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E3F2FD', borderTopColor: '#749F82', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
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

          {/* Major */}
          <div>
            <label style={labelStyle}>Major / Field of Study</label>
            <input value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g., Computer Science" style={inputStyle} disabled={isCompleted} />
          </div>

          {/* Age */}
          <div>
            <label style={labelStyle}>Age</label>
            <input value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="Your age" style={{ ...inputStyle, width: 120 }} disabled={isCompleted} />
          </div>

          {/* Living Situation */}
          <div>
            <label style={labelStyle}>Living Situation</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LIVING_SITUATIONS.map(l => (
                <button key={l} onClick={() => !isCompleted && setLivingSituation(l)} style={{ ...pillStyle(livingSituation === l), cursor: isCompleted ? 'default' : 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
            {livingSituation === 'Other' && !isCompleted && (
              <input value={livingOther} onChange={e => setLivingOther(e.target.value)} placeholder="Please specify..." style={{ ...inputStyle, marginTop: 8 }} />
            )}
          </div>

          {/* Family Background */}
          <div>
            <label style={labelStyle}>Family Background</label>
            <textarea value={familyBackground} onChange={e => setFamilyBackground(e.target.value)} placeholder="Describe your family background..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} disabled={isCompleted} />
          </div>

          {/* Cultural Background */}
          <div>
            <label style={labelStyle}>Cultural / Religious Background</label>
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
            <label style={labelStyle}>Hobbies & Interests</label>
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
            <label style={labelStyle}>Why MindFlow?</label>
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
  );
}
