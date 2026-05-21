"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import BrandHeader from "@/components/quiz-funnel/BrandHeader";
import ProgressBar from "@/components/quiz-funnel/ProgressBar";
import { submitAnswers } from "@/lib/quizFunnelApi";
import { QUIZ_QUESTIONS, type QuizQuestionRow } from "@/lib/quizQuestions";
import { getAffiliateAttribution } from "@/lib/affiliateAttribution";
import { trackLead } from "@/lib/affiliateApi";

type LeadStep = "name" | "email" | "phone";

const COUNTRY_CODES = [
  { label: "Afghanistan (+93)", value: "+93" },
  { label: "Albania (+355)", value: "+355" },
  { label: "Algeria (+213)", value: "+213" },
  { label: "American Samoa (+1-684)", value: "+1-684" },
  { label: "Andorra (+376)", value: "+376" },
  { label: "Angola (+244)", value: "+244" },
  { label: "Anguilla (+1-264)", value: "+1-264" },
  { label: "Antigua and Barbuda (+1-268)", value: "+1-268" },
  { label: "Argentina (+54)", value: "+54" },
  { label: "Armenia (+374)", value: "+374" },
  { label: "Aruba (+297)", value: "+297" },
  { label: "Australia (+61)", value: "+61" },
  { label: "Austria (+43)", value: "+43" },
  { label: "Azerbaijan (+994)", value: "+994" },
  { label: "Bahamas (+1-242)", value: "+1-242" },
  { label: "Bahrain (+973)", value: "+973" },
  { label: "Bangladesh (+880)", value: "+880" },
  { label: "Barbados (+1-246)", value: "+1-246" },
  { label: "Belarus (+375)", value: "+375" },
  { label: "Belgium (+32)", value: "+32" },
  { label: "Belize (+501)", value: "+501" },
  { label: "Benin (+229)", value: "+229" },
  { label: "Bermuda (+1-441)", value: "+1-441" },
  { label: "Bhutan (+975)", value: "+975" },
  { label: "Bolivia (+591)", value: "+591" },
  { label: "Bosnia and Herzegovina (+387)", value: "+387" },
  { label: "Botswana (+267)", value: "+267" },
  { label: "Brazil (+55)", value: "+55" },
  { label: "British Virgin Islands (+1-284)", value: "+1-284" },
  { label: "Brunei (+673)", value: "+673" },
  { label: "Bulgaria (+359)", value: "+359" },
  { label: "Burkina Faso (+226)", value: "+226" },
  { label: "Burundi (+257)", value: "+257" },
  { label: "Cambodia (+855)", value: "+855" },
  { label: "Cameroon (+237)", value: "+237" },
  { label: "Canada (+1)", value: "+1" },
  { label: "Cape Verde (+238)", value: "+238" },
  { label: "Cayman Islands (+1-345)", value: "+1-345" },
  { label: "Central African Republic (+236)", value: "+236" },
  { label: "Chad (+235)", value: "+235" },
  { label: "Chile (+56)", value: "+56" },
  { label: "China (+86)", value: "+86" },
  { label: "Colombia (+57)", value: "+57" },
  { label: "Comoros (+269)", value: "+269" },
  { label: "Congo (+242)", value: "+242" },
  { label: "Congo, Democratic Republic (+243)", value: "+243" },
  { label: "Cook Islands (+682)", value: "+682" },
  { label: "Costa Rica (+506)", value: "+506" },
  { label: "Croatia (+385)", value: "+385" },
  { label: "Cuba (+53)", value: "+53" },
  { label: "Curacao (+599)", value: "+599" },
  { label: "Cyprus (+357)", value: "+357" },
  { label: "Czech Republic (+420)", value: "+420" },
  { label: "Denmark (+45)", value: "+45" },
  { label: "Djibouti (+253)", value: "+253" },
  { label: "Dominica (+1-767)", value: "+1-767" },
  { label: "Dominican Republic (+1-809)", value: "+1-809" },
  { label: "Dominican Republic (+1-829)", value: "+1-829" },
  { label: "Dominican Republic (+1-849)", value: "+1-849" },
  { label: "Ecuador (+593)", value: "+593" },
  { label: "Egypt (+20)", value: "+20" },
  { label: "El Salvador (+503)", value: "+503" },
  { label: "Equatorial Guinea (+240)", value: "+240" },
  { label: "Eritrea (+291)", value: "+291" },
  { label: "Estonia (+372)", value: "+372" },
  { label: "Eswatini (+268)", value: "+268" },
  { label: "Ethiopia (+251)", value: "+251" },
  { label: "Falkland Islands (+500)", value: "+500" },
  { label: "Faroe Islands (+298)", value: "+298" },
  { label: "Fiji (+679)", value: "+679" },
  { label: "Finland (+358)", value: "+358" },
  { label: "France (+33)", value: "+33" },
  { label: "French Guiana (+594)", value: "+594" },
  { label: "French Polynesia (+689)", value: "+689" },
  { label: "Gabon (+241)", value: "+241" },
  { label: "Gambia (+220)", value: "+220" },
  { label: "Georgia (+995)", value: "+995" },
  { label: "Germany (+49)", value: "+49" },
  { label: "Ghana (+233)", value: "+233" },
  { label: "Gibraltar (+350)", value: "+350" },
  { label: "Greece (+30)", value: "+30" },
  { label: "Greenland (+299)", value: "+299" },
  { label: "Grenada (+1-473)", value: "+1-473" },
  { label: "Guadeloupe (+590)", value: "+590" },
  { label: "Guam (+1-671)", value: "+1-671" },
  { label: "Guatemala (+502)", value: "+502" },
  { label: "Guinea (+224)", value: "+224" },
  { label: "Guinea-Bissau (+245)", value: "+245" },
  { label: "Guyana (+592)", value: "+592" },
  { label: "Haiti (+509)", value: "+509" },
  { label: "Honduras (+504)", value: "+504" },
  { label: "Hong Kong (+852)", value: "+852" },
  { label: "Hungary (+36)", value: "+36" },
  { label: "Iceland (+354)", value: "+354" },
  { label: "India (+91)", value: "+91" },
  { label: "Indonesia (+62)", value: "+62" },
  { label: "Iran (+98)", value: "+98" },
  { label: "Iraq (+964)", value: "+964" },
  { label: "Ireland (+353)", value: "+353" },
  { label: "Israel (+972)", value: "+972" },
  { label: "Italy (+39)", value: "+39" },
  { label: "Ivory Coast (+225)", value: "+225" },
  { label: "Jamaica (+1-876)", value: "+1-876" },
  { label: "Japan (+81)", value: "+81" },
  { label: "Jordan (+962)", value: "+962" },
  { label: "Kazakhstan (+7)", value: "+7" },
  { label: "Kenya (+254)", value: "+254" },
  { label: "Kiribati (+686)", value: "+686" },
  { label: "Kosovo (+383)", value: "+383" },
  { label: "Kuwait (+965)", value: "+965" },
  { label: "Kyrgyzstan (+996)", value: "+996" },
  { label: "Laos (+856)", value: "+856" },
  { label: "Latvia (+371)", value: "+371" },
  { label: "Lebanon (+961)", value: "+961" },
  { label: "Lesotho (+266)", value: "+266" },
  { label: "Liberia (+231)", value: "+231" },
  { label: "Libya (+218)", value: "+218" },
  { label: "Liechtenstein (+423)", value: "+423" },
  { label: "Lithuania (+370)", value: "+370" },
  { label: "Luxembourg (+352)", value: "+352" },
  { label: "Macau (+853)", value: "+853" },
  { label: "Madagascar (+261)", value: "+261" },
  { label: "Malawi (+265)", value: "+265" },
  { label: "Malaysia (+60)", value: "+60" },
  { label: "Maldives (+960)", value: "+960" },
  { label: "Mali (+223)", value: "+223" },
  { label: "Malta (+356)", value: "+356" },
  { label: "Marshall Islands (+692)", value: "+692" },
  { label: "Martinique (+596)", value: "+596" },
  { label: "Mauritania (+222)", value: "+222" },
  { label: "Mauritius (+230)", value: "+230" },
  { label: "Mayotte (+262)", value: "+262" },
  { label: "Mexico (+52)", value: "+52" },
  { label: "Micronesia (+691)", value: "+691" },
  { label: "Moldova (+373)", value: "+373" },
  { label: "Monaco (+377)", value: "+377" },
  { label: "Mongolia (+976)", value: "+976" },
  { label: "Montenegro (+382)", value: "+382" },
  { label: "Montserrat (+1-664)", value: "+1-664" },
  { label: "Morocco (+212)", value: "+212" },
  { label: "Mozambique (+258)", value: "+258" },
  { label: "Myanmar (+95)", value: "+95" },
  { label: "Namibia (+264)", value: "+264" },
  { label: "Nauru (+674)", value: "+674" },
  { label: "Nepal (+977)", value: "+977" },
  { label: "Netherlands (+31)", value: "+31" },
  { label: "New Caledonia (+687)", value: "+687" },
  { label: "New Zealand (+64)", value: "+64" },
  { label: "Nicaragua (+505)", value: "+505" },
  { label: "Niger (+227)", value: "+227" },
  { label: "Nigeria (+234)", value: "+234" },
  { label: "Niue (+683)", value: "+683" },
  { label: "North Korea (+850)", value: "+850" },
  { label: "North Macedonia (+389)", value: "+389" },
  { label: "Northern Mariana Islands (+1-670)", value: "+1-670" },
  { label: "Norway (+47)", value: "+47" },
  { label: "Oman (+968)", value: "+968" },
  { label: "Pakistan (+92)", value: "+92" },
  { label: "Palau (+680)", value: "+680" },
  { label: "Palestine (+970)", value: "+970" },
  { label: "Panama (+507)", value: "+507" },
  { label: "Papua New Guinea (+675)", value: "+675" },
  { label: "Paraguay (+595)", value: "+595" },
  { label: "Peru (+51)", value: "+51" },
  { label: "Philippines (+63)", value: "+63" },
  { label: "Poland (+48)", value: "+48" },
  { label: "Portugal (+351)", value: "+351" },
  { label: "Puerto Rico (+1-787)", value: "+1-787" },
  { label: "Puerto Rico (+1-939)", value: "+1-939" },
  { label: "Qatar (+974)", value: "+974" },
  { label: "Reunion (+262)", value: "+262" },
  { label: "Romania (+40)", value: "+40" },
  { label: "Russia (+7)", value: "+7" },
  { label: "Rwanda (+250)", value: "+250" },
  { label: "Saint Kitts and Nevis (+1-869)", value: "+1-869" },
  { label: "Saint Lucia (+1-758)", value: "+1-758" },
  { label: "Saint Martin (+590)", value: "+590" },
  { label: "Saint Pierre and Miquelon (+508)", value: "+508" },
  { label: "Saint Vincent and the Grenadines (+1-784)", value: "+1-784" },
  { label: "Samoa (+685)", value: "+685" },
  { label: "San Marino (+378)", value: "+378" },
  { label: "Sao Tome and Principe (+239)", value: "+239" },
  { label: "Saudi Arabia (+966)", value: "+966" },
  { label: "Senegal (+221)", value: "+221" },
  { label: "Serbia (+381)", value: "+381" },
  { label: "Seychelles (+248)", value: "+248" },
  { label: "Sierra Leone (+232)", value: "+232" },
  { label: "Singapore (+65)", value: "+65" },
  { label: "Sint Maarten (+1-721)", value: "+1-721" },
  { label: "Slovakia (+421)", value: "+421" },
  { label: "Slovenia (+386)", value: "+386" },
  { label: "Solomon Islands (+677)", value: "+677" },
  { label: "Somalia (+252)", value: "+252" },
  { label: "South Africa (+27)", value: "+27" },
  { label: "South Korea (+82)", value: "+82" },
  { label: "South Sudan (+211)", value: "+211" },
  { label: "Spain (+34)", value: "+34" },
  { label: "Sri Lanka (+94)", value: "+94" },
  { label: "Sudan (+249)", value: "+249" },
  { label: "Suriname (+597)", value: "+597" },
  { label: "Sweden (+46)", value: "+46" },
  { label: "Switzerland (+41)", value: "+41" },
  { label: "Syria (+963)", value: "+963" },
  { label: "Taiwan (+886)", value: "+886" },
  { label: "Tajikistan (+992)", value: "+992" },
  { label: "Tanzania (+255)", value: "+255" },
  { label: "Thailand (+66)", value: "+66" },
  { label: "Timor-Leste (+670)", value: "+670" },
  { label: "Togo (+228)", value: "+228" },
  { label: "Tokelau (+690)", value: "+690" },
  { label: "Tonga (+676)", value: "+676" },
  { label: "Trinidad and Tobago (+1-868)", value: "+1-868" },
  { label: "Tunisia (+216)", value: "+216" },
  { label: "Turkey (+90)", value: "+90" },
  { label: "Turkmenistan (+993)", value: "+993" },
  { label: "Turks and Caicos Islands (+1-649)", value: "+1-649" },
  { label: "Tuvalu (+688)", value: "+688" },
  { label: "Uganda (+256)", value: "+256" },
  { label: "Ukraine (+380)", value: "+380" },
  { label: "United Arab Emirates (+971)", value: "+971" },
  { label: "UK (+44)", value: "+44" },
  { label: "United States (+1)", value: "+1" },
  { label: "Uruguay (+598)", value: "+598" },
  { label: "US Virgin Islands (+1-340)", value: "+1-340" },
  { label: "Uzbekistan (+998)", value: "+998" },
  { label: "Vanuatu (+678)", value: "+678" },
  { label: "Vatican City (+379)", value: "+379" },
  { label: "Venezuela (+58)", value: "+58" },
  { label: "Vietnam (+84)", value: "+84" },
  { label: "Wallis and Futuna (+681)", value: "+681" },
  { label: "Yemen (+967)", value: "+967" },
  { label: "Zambia (+260)", value: "+260" },
  { label: "Zimbabwe (+263)", value: "+263" },
];

export default function QuizPage() {
  const loadingWords = ["Money", "Power", "Freedom", "Honour"];
  const QUIZ_DURATION_SECONDS = 20 * 60;
  const router = useRouter();
  const [questions] = useState<QuizQuestionRow[]>(QUIZ_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadStep, setLeadStep] = useState<LeadStep | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    countryCode: "+44",
    phone: "",
  });
  const [leadError, setLeadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!submitting) return undefined;
    const timer = setInterval(() => {
      setLoadingWordIndex((prev) => (prev + 1) % loadingWords.length);
    }, 700);
    return () => clearInterval(timer);
  }, [submitting, loadingWords.length]);

  useEffect(() => {
    if (loading || submitting) return undefined;
    if (timeLeft <= 0) return undefined;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [loading, submitting, timeLeft]);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const total = questions.length || 17;
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : null;
  const cleanQuestionText = currentQuestion
    ? currentQuestion.question.replace(/^\[[^\]]+\]\s*/g, "")
    : "";

  function pickOption(optionText: string) {
    if (!currentQuestion) return;
    const optionLetter = optionText.charAt(0);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionLetter }));
  }

  function previousQuestion() {
    if (currentIndex <= 0) return;
    setShowLeadGate(false);
    setLeadStep(null);
    setLeadError("");
    setCurrentIndex((prev) => prev - 1);
  }

  function nextQuestion() {
    if (!selectedOption) return;
    const checkpointStep = getCheckpointStep(currentIndex);
    if (checkpointStep) {
      const validationMessage = validateLeadStep(checkpointStep);
      if (validationMessage) {
        setLeadStep(checkpointStep);
        setShowLeadGate(true);
        setLeadError(validationMessage);
        return;
      }
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function getCheckpointStep(index: number): LeadStep | null {
    if (index === 3) return "name";
    if (index === 9) return "email";
    if (index === 14) return "phone";
    return null;
  }

  function validateLeadStep(step: LeadStep | null) {
    const name = leadForm.name.trim();
    const email = leadForm.email.trim();
    const phone = leadForm.phone.trim();
    const countryCode = leadForm.countryCode.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{6,15}$/;

    if (step === "name" && name.length < 2) return "Please enter your name to continue.";
    if (step === "email" && !emailRegex.test(email)) return "Please enter a valid email address.";
    if (step === "phone" && !countryCode) return "Please select a country code.";
    if (step === "phone" && !phoneRegex.test(phone)) return "Please enter a valid phone number.";
    return "";
  }

  function buildFullPhone() {
    const code = leadForm.countryCode.trim();
    const number = leadForm.phone.trim();
    return `${code} ${number}`.trim();
  }

  function validateLeadForm() {
    const nameError = validateLeadStep("name");
    if (nameError) return nameError;
    const emailError = validateLeadStep("email");
    if (emailError) return emailError;
    const phoneError = validateLeadStep("phone");
    if (phoneError) return phoneError;
    return "";
  }

  function continueAfterLead() {
    const validationMessage = validateLeadStep(leadStep);
    if (validationMessage) {
      setLeadError(validationMessage);
      return;
    }
    // When the email gate (Question 11) is satisfied, fire the "Syn Diagnosis lead"
    // for the referring affiliate so they get credit before the user even finishes
    // the quiz. Subsequent signup / login on the dashboard will fire the auth lead.
    if (leadStep === "email") {
      const email = leadForm.email.trim();
      const attribution = getAffiliateAttribution();
      if (attribution && email) {
        void trackLead(attribution.affiliateId, attribution.visitorId, email, {
          kind: "diagnosis",
          label: "Syn Diagnosis lead",
        }).catch(() => {});
      }
    }
    setLeadError("");
    setShowLeadGate(false);
    setLeadStep(null);
    setCurrentIndex((prev) => Math.min(prev + 1, total - 1));
  }

  async function handleSubmit() {
    const validationMessage = validateLeadForm();
    if (validationMessage) {
      const missingStep: LeadStep = validateLeadStep("name")
        ? "name"
        : validateLeadStep("email")
          ? "email"
          : "phone";
      setLeadStep(missingStep);
      setShowLeadGate(true);
      setLeadError(validationMessage || "Please complete your details to continue.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const answerList = questions.map((q) => ({
        question_id: q.id,
        selected_option: answers[q.id],
      }));

      const payload = {
        user: {
          name: leadForm.name.trim(),
          email: leadForm.email.trim(),
          phone: buildFullPhone(),
        },
        answers: answerList,
      };

      const result = await submitAnswers(payload);
      localStorage.setItem("quiz_result", JSON.stringify(result));
      localStorage.setItem("quiz_user_email", leadForm.email.trim().toLowerCase());
      router.push("/quiz/result");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit quiz answers");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (loading || submitting || timeLeft > 0 || questions.length === 0) return;
    void handleSubmit();
  }, [timeLeft, loading, submitting, questions.length]);

  const isLast = currentIndex === total - 1;
  const canSubmit = Object.keys(answers).length === total;
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <main className="page-wrap">
      <section className="card card-quiz">
        <BrandHeader
          subtitle="MONEY • POWER • FREEDOM • HONOUR"
          subtitleClassName="brand-subtitle-gold"
        />
        <ProgressBar current={currentIndex + 1} total={total} />
        <div className="quiz-timer-badge">
          Time Left: {minutes}:{seconds}
        </div>
        {showLeadGate && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(4,8,18,0.72)",
                backdropFilter: "blur(3px)",
                zIndex: 40,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(92vw, 560px)",
                border: "1px solid rgba(190,153,46,0.65)",
                borderRadius: 14,
                padding: 16,
                background: "rgba(10,18,35,0.98)",
                boxShadow: "0 0 30px rgba(77,163,255,0.35), 0 0 56px rgba(190,153,46,0.16)",
                zIndex: 50,
              }}
            >
              <h3 style={{ margin: "0 0 8px", color: "#be992e" }}>Continue Diagnosis</h3>
              <p style={{ margin: "0 0 8px", color: "#d7e5ff" }}>
                {leadStep === "name" && `Enter your name to continue from Question ${currentIndex + 2}.`}
                {leadStep === "email" && `Enter your email to continue from Question ${currentIndex + 2}.`}
                {leadStep === "phone" && `Enter your phone number to continue from Question ${currentIndex + 2}.`}
              </p>
              <p style={{ margin: "0 0 10px", color: "#be992e", fontWeight: 700 }}>
                This is compulsory for your report.
              </p>
              {leadStep === "name" ? (
                <input
                  placeholder="Name"
                  value={leadForm.name}
                  onChange={(e) => {
                    setLeadForm((prev) => ({ ...prev, name: e.target.value }));
                    setLeadError("");
                  }}
                  className="quiz-input"
                />
              ) : null}
              {leadStep === "email" ? (
                <>
                  <input
                    placeholder="Email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => {
                      setLeadForm((prev) => ({ ...prev, email: e.target.value }));
                      setLeadError("");
                    }}
                    className="quiz-input"
                  />
                  <p style={{ margin: "0 0 10px", color: "#be992e", fontWeight: 700 }}>
                    Enter the correct email. Free ticket will be linked to this email only. Wrong email means you cannot claim your free ticket.
                  </p>
                </>
              ) : null}
              {leadStep === "phone" ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={leadForm.countryCode}
                    onChange={(e) => {
                      setLeadForm((prev) => ({ ...prev, countryCode: e.target.value }));
                      setLeadError("");
                    }}
                    className="quiz-input"
                    style={{ maxWidth: 190, marginBottom: 0, fontSize: 13, paddingRight: 28 }}
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={`${item.value}-${item.label}`} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Phone Number"
                    value={leadForm.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      setLeadForm((prev) => ({ ...prev, phone: digitsOnly }));
                      setLeadError("");
                    }}
                    className="quiz-input"
                    style={{ marginBottom: 0 }}
                  />
                </div>
              ) : null}
              {leadError ? (
                <p style={{ margin: "0 0 10px", color: "#ff7f9b", fontWeight: 700 }}>{leadError}</p>
              ) : null}
              <button className="btn btn-primary" onClick={continueAfterLead}>
                Continue Diagnosis
              </button>
            </div>
          </>
        )}
        <h2 className="question-title" style={{ marginBottom: 16 }}>
          {cleanQuestionText}
        </h2>

        {currentQuestion.options.map((option) => (
          <button
            key={option}
            className={`btn option-btn ${selectedOption === option.charAt(0) ? "active" : ""}`}
            onClick={() => pickOption(option)}
          >
            {option}
          </button>
        ))}

        <div className="quiz-nav-actions">
          {currentIndex > 0 ? (
            <button type="button" className="btn btn-quiz-nav quiz-nav-btn quiz-nav-btn--prev" onClick={previousQuestion}>
              Previous
            </button>
          ) : null}
          {!isLast ? (
            <button
              type="button"
              className="btn btn-quiz-nav quiz-nav-btn quiz-nav-btn--next"
              onClick={nextQuestion}
              disabled={!selectedOption}
            >
              Next
            </button>
          ) : null}
        </div>

        {isLast && !submitting && (
          <>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit} style={{ marginTop: 8 }}>
              Submit Answers
            </button>
            {submitError ? (
              <p style={{ marginTop: 10, color: "#ff7f9b", fontWeight: 700 }}>
                {submitError}
              </p>
            ) : null}
          </>
        )}
        {isLast && submitting && (
          <div className="submit-loading-wrap">
            <button className="btn btn-primary" disabled>
              Generating Report...
            </button>
            <p className="loading-chant">{loadingWords[loadingWordIndex]}...</p>
            <span className="loading-spinner" aria-hidden="true" />
          </div>
        )}
      </section>
    </main>
  );
}
