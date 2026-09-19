import React, { useState } from 'react';
import { 
  BookOpen, HelpCircle, CheckCircle, XCircle, AlertTriangle, 
  ShieldCheck, Lock, Globe, Mail, ArrowRight, RefreshCw, KeyRound 
} from 'lucide-react';
import { QuizQuestion } from '../types';

export const AwarenessView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'quiz'>('guides');
  const [selectedGuide, setSelectedGuide] = useState<number>(0);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const guides = [
    {
      title: 'How Phishing Works',
      icon: ShieldCheck,
      content: `Phishing is a social-engineering cyberattack where attackers masquerade as trustworthy entities—such as your bank, workplace supervisor, or cloud provider—to deceive you into disclosing passwords, credit card numbers, or OTP security tokens. Attacks typically arrive through high-pressure emails, spoofed SMS messages, or fraudulent web portals.`,
      keyTakeaways: [
        'Attackers exploit emotional urgency (e.g. account suspension warnings).',
        'Visual branding is easy to replicate; domain addresses are not.',
        'Never trust sender display names without inspecting the exact underlying email address.'
      ]
    },
    {
      title: 'How to Recognize Suspicious URLs',
      icon: Globe,
      content: `Attackers frequently register lookalike domains using typosquatting, subdomains that mimic genuine brands, or disposable free top-level domains (.tk, .ml, .xyz). For example, "paypal.com.verify-billing.xyz" is registered on verify-billing.xyz, NOT PayPal. Always read domains from right to left up to the first single slash.`,
      keyTakeaways: [
        'Check for HTTPS encryption, but remember that scammers can also obtain free SSL certificates.',
        'Beware of numerical IP addresses in web addresses (e.g., http://192.168.1.50/login).',
        'Look for abnormal character combinations such as hyphens, misspelled brand names, or excessive subdomains.'
      ]
    },
    {
      title: 'Spotting Fake Login Pages & Credential Theft',
      icon: KeyRound,
      content: `Credential-harvesting websites are visually identical replicas of login portals like Microsoft 365, Google Workspace, or banking services. Once you enter your email and password, attackers immediately capture and use them, often prompting for your 2FA OTP code on the next screen.`,
      keyTakeaways: [
        'Use a reliable password manager—it will only auto-fill credentials on verified root domains.',
        'Always bookmark genuine login portals rather than following links inside emails.',
        'Enable hardware security keys (FIDO2/WebAuthn) or authenticator apps over SMS.'
      ]
    },
    {
      title: 'Urgent & Threatening Communication Tactics',
      icon: AlertTriangle,
      content: `A hallmark of phishing messages is artificial panic. Phrases like "Immediate action required within 24 hours," "Your account will be permanently deactivated," or "Legal proceedings have commenced" are designed to bypass your critical thinking and prompt knee-jerk compliance.`,
      keyTakeaways: [
        'Legitimate companies will rarely suspend critical services without multiple prior notices.',
        'Do not reply directly to threatening messages or phone numbers provided in the text.',
        'Contact the service independently using a verified phone number or official application.'
      ]
    },
    {
      title: 'Online Safety Practices & Hygiene',
      icon: Lock,
      content: `Building consistent security habits significantly decreases exposure to cyberattacks. Practice zero-trust browsing, verify unexpected email attachments, and never share one-time passcodes with anyone claiming to represent support or fraud departments.`,
      keyTakeaways: [
        'Never reuse the same password across multiple online accounts.',
        'Verify unusual requests from colleagues or executives via a secondary channel (e.g. direct phone call).',
        'Submit questionable links and messages to PhishGuard before interacting with them.'
      ]
    }
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      scenario: 'You receive an urgent SMS text message from an unknown number:',
      sampleText: 'CHASE BANK ALERT: Your debit card is locked due to suspicious activity. Unlock immediately at http://chase-online-unlock.xyz/verify or your card will be canceled.',
      options: [
        {
          text: 'Legitimate Notice: It mentions my bank and requires immediate security confirmation.',
          isPhishing: false,
          explanation: 'Incorrect. Legitimate financial institutions do not host account portals on third-party .xyz domains, nor do they send raw HTTP links.'
        },
        {
          text: 'Phishing Attack: The domain "chase-online-unlock.xyz" is a spoofed address and uses artificial urgency.',
          isPhishing: true,
          explanation: 'Correct! This is smishing (SMS phishing) designed to harvest your debit card credentials on an untrusted .xyz domain.'
        }
      ]
    },
    {
      id: 2,
      scenario: 'An email arrives from your company CEO with the subject "Quick request":',
      sampleText: 'Hi, I am in a board meeting right now and cannot take calls. I need you to purchase 5 Apple gift cards ($100 each) for an emergency client giveaway and email me the redemption codes immediately.',
      options: [
        {
          text: 'Legitimate Task: The sender name matches the company chief executive.',
          isPhishing: false,
          explanation: 'Incorrect. This is a classic Business Email Compromise (BEC) gift card scam. Sender names are trivially spoofed.'
        },
        {
          text: 'Phishing / Impersonation Scam: Legitimate executives do not request untraceable gift cards via email with urgency.',
          isPhishing: true,
          explanation: 'Correct! Gift cards are non-refundable and untraceable. Any request for gift card redemption codes is an active scam.'
        }
      ]
    },
    {
      id: 3,
      scenario: 'You receive an automated shipping notification from a postal service:',
      sampleText: 'USPS: Package delivery failure. A small address discrepancy occurred. Verify your residential address and pay $1.50 redelivery fee: http://185.220.101.4/usps-redelivery',
      options: [
        {
          text: 'Phishing Attack: Contains a raw numerical IP address and requests payment for package redelivery.',
          isPhishing: true,
          explanation: 'Correct! Official postal services never route customer payments to numerical IP hosts like 185.220.101.4.'
        },
        {
          text: 'Legitimate Notice: $1.50 is a negligible fee and address verification is normal.',
          isPhishing: false,
          explanation: 'Incorrect. Attackers use nominal fees ($1–$3) as a pretext to steal full credit card numbers, CVVs, and billing details.'
        }
      ]
    },
    {
      id: 4,
      scenario: 'A browser notification prompts you to update your software:',
      sampleText: 'CRITICAL SECURITY WARNING: Your computer is infected with 5 viruses! Call Microsoft Support immediately at 1-800-XXX-XXXX or download antivirus-cleaner.exe now.',
      options: [
        {
          text: 'Phishing / Tech Support Scam: Legitimate operating systems do not trigger popups asking users to call phone numbers.',
          isPhishing: true,
          explanation: 'Correct! Tech support scams induce panic to convince victims into granting remote desktop access.'
        },
        {
          text: 'Legitimate OS Alert: The screen is red and warns about multiple viruses.',
          isPhishing: false,
          explanation: 'Incorrect. Web pages cannot scan your local operating system for viruses. This is scareware.'
        }
      ]
    },
    {
      id: 5,
      scenario: 'An email from your cloud collaboration tool with standard headers:',
      sampleText: 'Google Workspace: Your weekly activity summary is ready. View your storage usage report at https://drive.google.com/drive/activity',
      options: [
        {
          text: 'Phishing: Any email with a link to Google Drive must be an attack.',
          isPhishing: false,
          explanation: 'Incorrect. The destination link resides squarely on the genuine root domain drive.google.com over HTTPS.'
        },
        {
          text: 'Legitimate Communication: The link points directly to the authentic domain (google.com) with valid HTTPS.',
          isPhishing: true,
          explanation: 'Correct! The link points to authentic Google infrastructure with standard informative weekly cadence.'
        }
      ]
    }
  ];

  const handleAnswerSelect = (optionIndex: number) => {
    const isCorrect = quizQuestions[currentQuestionIndex].options[optionIndex].isPhishing === 
      (optionIndex === 1 ? true : false); // Second option is always the phishing detector answer in our scenarios

    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex === 1 }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowExplanation(false);
    setQuizFinished(false);
  };

  const currentQ = quizQuestions[currentQuestionIndex];
  const totalCorrect = Object.entries(userAnswers).filter(([idx, ans]) => ans === true).length;

  return (
    <div id="awareness-page" className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Security Education & Training</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Cybersecurity Awareness Center</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Learn how attackers construct phishing campaigns, recognize social engineering signals, and practice on interactive real-world scenarios.
        </p>

        {/* Tab Controls */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            id="tab-btn-guides"
            onClick={() => setActiveTab('guides')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'guides'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Security Knowledge Guides
          </button>
          <button
            id="tab-btn-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'quiz'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Interactive Phishing Quiz (5 Scenarios)
          </button>
        </div>
      </div>

      {/* Mode 1: Guides */}
      {activeTab === 'guides' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Guide Selector List */}
          <div className="md:col-span-4 space-y-2">
            {guides.map((g, idx) => {
              const Icon = g.icon;
              const isSelected = selectedGuide === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedGuide(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/40 text-emerald-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-950 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-snug">{g.title}</div>
                    <div className="text-[10px] text-slate-400">Guide #{idx + 1}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Guide Content Display */}
          <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-1">
                Topic #{selectedGuide + 1}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {guides[selectedGuide].title}
              </h2>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {guides[selectedGuide].content}
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Defensive Key Takeaways</span>
              </div>
              <div className="space-y-2">
                {guides[selectedGuide].keyTakeaways.map((point, pIdx) => (
                  <div key={pIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Interactive Quiz */}
      {activeTab === 'quiz' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
          {!quizFinished ? (
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
                  Scenario {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-xs text-slate-400">
                  Phishing Identification Test
                </span>
              </div>

              {/* Scenario Context */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">
                  {currentQ.scenario}
                </h3>
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed">
                  "{currentQ.sampleText}"
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <span className="text-xs uppercase font-semibold text-slate-400 block">
                  Select your defensive assessment:
                </span>
                {currentQ.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    id={`quiz-option-${optIdx}`}
                    onClick={() => handleAnswerSelect(optIdx)}
                    disabled={showExplanation}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-colors ${
                      showExplanation
                        ? optIdx === 1
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                        : 'bg-slate-950 border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {/* Explanation & Next */}
              {showExplanation && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Security Analysis Feedback</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentQ.options[1].explanation}
                  </p>
                  <button
                    id="btn-quiz-next"
                    onClick={handleNextQuestion}
                    className="mt-2 w-full py-2 px-4 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>{currentQuestionIndex < quizQuestions.length - 1 ? 'Next Scenario' : 'View Quiz Results'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Results Summary */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You assessed {quizQuestions.length} real-world social engineering and phishing scenarios.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 inline-block min-w-[200px]">
                <div className="text-xs uppercase text-slate-400 font-semibold">Defensive Score</div>
                <div className="text-4xl font-black text-emerald-400 mt-1">{totalCorrect} / {quizQuestions.length}</div>
                <div className="text-xs text-slate-300 mt-1">
                  {totalCorrect >= 4 ? 'Excellent awareness instincts!' : 'Review the security guides to improve.'}
                </div>
              </div>

              <div>
                <button
                  id="btn-retake-quiz"
                  onClick={resetQuiz}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center space-x-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retake Phishing Quiz</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
