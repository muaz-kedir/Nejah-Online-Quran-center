type TDict = {
  nav: Record<
    "home" | "about" | "courses" | "teachers" | "testimonials" | "contact" | "login" | "register",
    string
  >;
  hero: Record<
    | "badge"
    | "title1Prefix"
    | "title1Courses"
    | "title2"
    | "title3"
    | "desc"
    | "getStarted"
    | "bookTrial"
    | "students"
    | "studentsLabel"
    | "teachersLabel"
    | "liveLabel",
    string
  >;
  about: Record<
    | "eyebrow"
    | "title"
    | "desc"
    | "f1Title"
    | "f1Desc"
    | "f2Title"
    | "f2Desc"
    | "f3Title"
    | "f3Desc",
    string
  >;
  courses: Record<
    | "eyebrow"
    | "title"
    | "desc"
    | "viewAll"
    | "learnMore"
    | "beginner"
    | "intermediate"
    | "advanced"
    | "allLevels"
    | "c1Title"
    | "c1Desc"
    | "c2Title"
    | "c2Desc"
    | "c3Title"
    | "c3Desc"
    | "c4Title"
    | "c4Desc",
    string
  >;
  how: Record<"title" | "s1Title" | "s1Desc" | "s2Title" | "s2Desc" | "s3Title" | "s3Desc", string>;
  features: Record<
    | "eyebrow"
    | "title1"
    | "title2"
    | "f1Title"
    | "f1Desc"
    | "f2Title"
    | "f2Desc"
    | "f3Title"
    | "f3Desc"
    | "f4Title"
    | "f4Desc"
    | "f5Title"
    | "f5Desc"
    | "f6Title"
    | "f6Desc",
    string
  >;
  teachers: Record<
    "title" | "bookTrial",
    string
  >;
  testimonials: Record<
    | "r1Name"
    | "r1Role"
    | "r1Text"
    | "r2Name"
    | "r2Role"
    | "r2Text"
    | "r3Name"
    | "r3Role"
    | "r3Text",
    string
  >;
  cta: Record<
    | "title"
    | "desc"
    | "register"
    | "contact"
    | "eyebrow"
    | "footnote"
    | "stat1"
    | "stat2"
    | "stat3",
    string
  >;
  footer: Record<
    | "tagline"
    | "quickLinks"
    | "aboutUs"
    | "ourTeachers"
    | "coursesLink"
    | "pricing"
    | "support"
    | "privacy"
    | "terms"
    | "sitemap"
    | "help"
    | "contactInfo"
    | "rights"
    | "privacyShort"
    | "termsShort",
    string
  >;
  announcement: Record<"badge" | "text" | "cta", string>;
};

export type Lang = "en" | "ar" | "am";
export type Dict = TDict;

export const translations: Record<Lang, TDict> = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      courses: "Courses",
      teachers: "Teachers",
      testimonials: "Testimonials",
      contact: "Contact",
      login: "Login",
      register: "Register",
    },
    hero: {
      badge: "The Modern Bridge of Learning",
      title1Prefix: "Learn ",
      title1Courses: "Quran|Tajweed|Hifz|Tilawa",
      title2: "Online with",
      title3: "Expert Teachers",
      desc: "Personalized Quran and Islamic education for kids and adults, designed to bring the tranquility of ancient wisdom to your home.",
      getStarted: "Get Started",
      bookTrial: "Book Free Trial",
      students: "Active students worldwide",
      studentsLabel: "Students",
      teachersLabel: "Expert Teachers",
      liveLabel: "Live classes",
    },
    about: {
      eyebrow: "Our Mission",
      title: "About Nejah Online Quran Center",
      desc: "We bridge the gap between traditional Islamic scholarship and modern digital accessibility, ensuring every student receives an authentic and engaging learning experience.",
      f1Title: "Qualified Teachers",
      f1Desc:
        "Certified scholars and instructors from leading Islamic institutions, with years of teaching expertise.",
      f2Title: "One-on-One Classes",
      f2Desc:
        "Individual attention tailored to your pace, ensuring mastery of Tajweed and Hifz effectively.",
      f3Title: "Flexible Schedule",
      f3Desc:
        "Book classes at times that suit your timezone and lifestyle. We are available 24/7 globally.",
    },
    courses: {
      eyebrow: "Programs",
      title: "Comprehensive Curriculum",
      desc: "Choose from our specialized tracks designed for different age groups and learning goals.",
      viewAll: "View all courses",
      learnMore: "Learn more",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      allLevels: "All Levels",
      c1Title: "Quran Reading",
      c1Desc: "Master the Arabic alphabet and basic pronunciation with the Noorani Qaida.",
      c2Title: "Tajweed Course",
      c2Desc: "Perfect your pronunciation and articulation for melodious recitation.",
      c3Title: "Hifz Program",
      c3Desc: "Structured path to memorize the Holy Quran with expert guidance and review.",
      c4Title: "Islamic Studies",
      c4Desc: "Learning Fiqh, Hadith, Seerah and history to live an authentic Islamic life.",
    },
    how: {
      title: "Start Your Journey in 3 Steps",
      s1Title: "Register",
      s1Desc: "Sign up and tell us about your goals and current level.",
      s2Title: "Choose Schedule",
      s2Desc: "Select the times that work best for you and your teacher.",
      s3Title: "Start Learning",
      s3Desc: "Join your online classroom and begin your spiritual path.",
    },
    features: {
      eyebrow: "Why Choose Us",
      title1: "Modern Features for",
      title2: "Meaningful Progress",
      f1Title: "Live 1-on-1 Classes",
      f1Desc: "Direct interaction with your teacher for real-time correction.",
      f2Title: "Male & Female Teachers",
      f2Desc: "We provide segregated teaching for comfort and modesty.",
      f3Title: "Progress Tracking",
      f3Desc: "Visual dashboards to monitor your memorization journey.",
      f4Title: "Parent Monitoring",
      f4Desc: "Keep track of your child's attendance and performance.",
      f5Title: "Recorded Sessions",
      f5Desc: "Rewatch every class for review and practice.",
      f6Title: "Monthly Reports",
      f6Desc: "Detailed feedback and assessments every single month.",
    },
    teachers: {
      title: "Meet Our Expert Scholars",
      bookTrial: "Detail",
    },
    testimonials: {
      r1Name: "Sarah Williams",
      r1Role: "Parent from London, UK",
      r1Text:
        "Nejah has completely changed my son's attitude towards learning the Quran. His teacher is patient, professional, and makes every lesson something he looks forward to.",
      r2Name: "Yusuf Abdullah",
      r2Role: "Student from Toronto, CA",
      r2Text:
        "After years of struggling with Tajweed, the one-on-one approach finally clicked. The teachers are scholarly yet approachable. Highly recommended.",
      r3Name: "Fatima Hussein",
      r3Role: "Adult learner from Sydney, AU",
      r3Text:
        "I started as a complete beginner at 35. Six months in, I'm reading fluently. The flexible schedule is perfect for my busy life.",
    },
    cta: {
      title: "Start Learning Quran Today",
      desc: "Join hundreds of students in a journey of spiritual growth and excellence. Your first lesson is on us.",
      register: "Register Now",
      contact: "Contact Us",
      eyebrow: "Begin Your Journey",
      footnote: "No commitment · First lesson complimentary",
      stat1: "Active Students",
      stat2: "Live Lessons",
      stat3: "Flexible Schedule",
    },
    footer: {
      tagline:
        "Empowering the next generation through authentic Quran and Islamic education in a modern digital learning sanctuary.",
      quickLinks: "Quick Links",
      aboutUs: "About Us",
      ourTeachers: "Our Teachers",
      coursesLink: "Courses",
      pricing: "Pricing",
      support: "Support",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      sitemap: "Sitemap",
      help: "Help Center",
      contactInfo: "Contact Info",
      rights: "© 2026 Nejah Islamic Center. All rights reserved.",
      privacyShort: "Privacy",
      termsShort: "Terms",
    },
    announcement: {
      badge: "Now Hiring",
      text: "We're looking for qualified Quran & Islamic teachers",
      cta: "Apply Now",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      about: "من نحن",
      courses: "الدورات",
      teachers: "المعلمون",
      testimonials: "آراء الطلاب",
      contact: "تواصل معنا",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
    },
    hero: {
      badge: "الجسر الحديث للتعلم",
      title1Prefix: "تعلّم ",
      title1Courses: "القرآن|التجويد|التحفيظ|تلاوة",
      title2: "عبر الإنترنت مع",
      title3: "أفضل المعلمين",
      desc: "تعليم قرآني وإسلامي مخصص للأطفال والكبار، مصمم ليجلب سكينة الحكمة العريقة إلى منزلك.",
      getStarted: "ابدأ الآن",
      bookTrial: "احجز درسًا تجريبيًا",
      students: "طالب نشط حول العالم",
      studentsLabel: "الطلاب",
      teachersLabel: "معلمون خبراء",
      liveLabel: "حصص مباشرة",
    },
    about: {
      eyebrow: "رسالتنا",
      title: "عن مركز نجاح لتعليم القرآن",
      desc: "نحن نسد الفجوة بين العلوم الإسلامية التقليدية والوصول الرقمي الحديث، لنضمن لكل طالب تجربة تعليمية أصيلة وممتعة.",
      f1Title: "معلمون مؤهلون",
      f1Desc: "علماء ومدرسون معتمدون من كبرى المؤسسات الإسلامية بخبرة سنوات في التعليم.",
      f2Title: "حصص فردية",
      f2Desc: "اهتمام شخصي يناسب وتيرتك لضمان إتقان التجويد والحفظ بفعالية.",
      f3Title: "جدول مرن",
      f3Desc: "احجز الحصص في الأوقات التي تناسبك. نحن متاحون على مدار الساعة عالميًا.",
    },
    courses: {
      eyebrow: "البرامج",
      title: "منهج شامل ومتكامل",
      desc: "اختر من بين مساراتنا المتخصصة المصممة لمختلف الأعمار والأهداف التعليمية.",
      viewAll: "عرض جميع الدورات",
      learnMore: "اعرف المزيد",
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم",
      allLevels: "كل المستويات",
      c1Title: "قراءة القرآن",
      c1Desc: "إتقان الحروف العربية والنطق الصحيح من خلال القاعدة النورانية.",
      c2Title: "دورة التجويد",
      c2Desc: "إتقان النطق والمخارج للتلاوة العذبة.",
      c3Title: "برنامج الحفظ",
      c3Desc: "مسار منظم لحفظ القرآن الكريم بإشراف ومراجعة من خبراء.",
      c4Title: "العلوم الإسلامية",
      c4Desc: "تعلم الفقه والحديث والسيرة والتاريخ لحياة إسلامية أصيلة.",
    },
    how: {
      title: "ابدأ رحلتك في 3 خطوات",
      s1Title: "سجّل",
      s1Desc: "أنشئ حسابك وأخبرنا عن أهدافك ومستواك الحالي.",
      s2Title: "اختر الجدول",
      s2Desc: "اختر الأوقات الأنسب لك ولمعلمك.",
      s3Title: "ابدأ التعلم",
      s3Desc: "انضم إلى صفك الإلكتروني وابدأ مسيرتك الروحانية.",
    },
    features: {
      eyebrow: "لماذا تختارنا",
      title1: "مزايا حديثة لتقدّم",
      title2: "ذي معنى",
      f1Title: "حصص فردية مباشرة",
      f1Desc: "تفاعل مباشر مع معلمك لتصحيح فوري.",
      f2Title: "معلمون ومعلمات",
      f2Desc: "نوفر تعليمًا منفصلاً للراحة والاحتشام.",
      f3Title: "تتبع التقدم",
      f3Desc: "لوحات بصرية لمتابعة رحلة الحفظ.",
      f4Title: "متابعة الأهل",
      f4Desc: "تابع حضور وأداء طفلك بسهولة.",
      f5Title: "حصص مسجلة",
      f5Desc: "أعد مشاهدة كل حصة للمراجعة والتدريب.",
      f6Title: "تقارير شهرية",
      f6Desc: "تقييمات وملاحظات تفصيلية شهريًا.",
    },
    teachers: {
      title: "تعرّف على علمائنا الخبراء",
      bookTrial: "احجز تجريبيًا",
    },
    testimonials: {
      r1Name: "سارة ويليامز",
      r1Role: "والدة من لندن، المملكة المتحدة",
      r1Text:
        "غيّر مركز نجاح موقف ابني تجاه تعلم القرآن تمامًا. معلمه صبور ومهني ويجعل كل درس متعة ينتظرها.",
      r2Name: "يوسف عبدالله",
      r2Role: "طالب من تورنتو، كندا",
      r2Text:
        "بعد سنوات من معاناتي مع التجويد، نجح أخيرًا أسلوب التدريس الفردي. المعلمون علماء ومتواضعون. أنصح بهم بشدة.",
      r3Name: "فاطمة حسين",
      r3Role: "متعلمة بالغة من سيدني، أستراليا",
      r3Text:
        "بدأت كمبتدئة تمامًا في سن 35. بعد ستة أشهر، أقرأ بطلاقة. الجدول المرن مثالي لحياتي المزدحمة.",
    },
    cta: {
      title: "ابدأ تعلم القرآن اليوم",
      desc: "انضم إلى مئات الطلاب في رحلة نمو روحاني وتميز. درسك الأول مجاني.",
      register: "سجل الآن",
      contact: "اتصل بنا",
      eyebrow: "ابدأ رحلتك",
      footnote: "بدون التزام · الدرس الأول مجاني",
      stat1: "طلاب نشطون",
      stat2: "دروس مباشرة",
      stat3: "جدول مرن",
    },
    footer: {
      tagline: "تمكين الجيل القادم من خلال تعليم قرآني وإسلامي أصيل في صرح تعليمي رقمي حديث.",
      quickLinks: "روابط سريعة",
      aboutUs: "من نحن",
      ourTeachers: "معلمونا",
      coursesLink: "الدورات",
      pricing: "الأسعار",
      support: "الدعم",
      privacy: "سياسة الخصوصية",
      terms: "شروط الاستخدام",
      sitemap: "خريطة الموقع",
      help: "مركز المساعدة",
      contactInfo: "معلومات التواصل",
      rights: "© 2026 مركز نجاح الإسلامي. جميع الحقوق محفوظة.",
      privacyShort: "الخصوصية",
      termsShort: "الشروط",
    },
    announcement: {
      badge: "توظيف",
      text: "نبحث عن معلمي قرآن كريم مؤهلين",
      cta: "قدم الآن",
    },
  },
  am: {
    nav: {
      home: "ዋና",
      about: "ስለ እኛ",
      courses: "ኮርሶች",
      teachers: "መምህራን",
      testimonials: "ምስክርነቶች",
      contact: "አግኙን",
      login: "ግባ",
      register: "ይመዝገቡ",
    },
    hero: {
      badge: "የዘመናዊ ትምህርት ድልድይ",
      title1Prefix: "",
      title1Courses: "ቁርዓንን ይማሩ|ታጅዊድን ይማሩ|ሂፍዘን ይማሩ|ቲላዋን ይማሩ",
      title2: "በመስመር ላይ ከ",
      title3: "ባለሙያ መምህራን ጋር",
      desc: "ለልጆችና ለአዋቂዎች የተበጀ የቁርዓንና እስላማዊ ትምህርት፣ የጥንታዊ ጥበብ ሰላም ወደ ቤትዎ ለማምጣት የተነደፈ።",
      getStarted: "ጀምር",
      bookTrial: "ነጻ ሙከራ ይዙ",
      students: "በዓለም ዙሪያ ንቁ ተማሪዎች",
      studentsLabel: "ተማሪዎች",
      teachersLabel: "ባለሙያ መምህራን",
      liveLabel: "የቀጥታ ክፍሎች",
    },
    about: {
      eyebrow: "ተልዕኮአችን",
      title: "ስለ ነጃህ የቁርዓን ማዕከል",
      desc: "ባህላዊ እስላማዊ ትምህርትንና ዘመናዊ ዲጂታል ተደራሽነትን እንገናኛለን፣ ለእያንዳንዱ ተማሪ እውነተኛና አስደሳች ተሞክሮ እናረጋግጣለን።",
      f1Title: "ብቁ መምህራን",
      f1Desc: "ከታላላቅ እስላማዊ ተቋማት የተረጋገጡ ምሁራንና አስተማሪዎች።",
      f2Title: "የአንድ ለአንድ ክፍሎች",
      f2Desc: "በራስዎ ፍጥነት የተበጀ ግለሰባዊ ትኩረት ለታጅዊድና ሂፍዝ ብቃት።",
      f3Title: "ተለዋዋጭ መርሐግብር",
      f3Desc: "ለርስዎ ጊዜ ምቹ የሆኑ ክፍሎችን ይዙ። 24/7 በዓለም ዙሪያ ተደራሽ ነን።",
    },
    courses: {
      eyebrow: "ፕሮግራሞች",
      title: "አጠቃላይ ሥርዓተ ትምህርት",
      desc: "ለተለያዩ ዕድሜዎችና የመማሪያ ግቦች ከተዘጋጁ ልዩ መንገዶች ይምረጡ።",
      viewAll: "ሁሉንም ኮርሶች ይመልከቱ",
      learnMore: "ተጨማሪ ይወቁ",
      beginner: "ጀማሪ",
      intermediate: "መካከለኛ",
      advanced: "ከፍተኛ",
      allLevels: "ሁሉም ደረጃዎች",
      c1Title: "የቁርዓን ንባብ",
      c1Desc: "የአረብኛ ፊደላትንና መሰረታዊ አነባበብ በኑራኒ ቃዒዳ ይቆጣጠሩ።",
      c2Title: "የታጅዊድ ኮርስ",
      c2Desc: "ለምስጉን ንባብ አነባበብዎን ያሟሉ።",
      c3Title: "የሂፍዝ ፕሮግራም",
      c3Desc: "ቅዱስ ቁርዓንን ለማስታወስ የተደራጀ መንገድ።",
      c4Title: "እስላማዊ ጥናቶች",
      c4Desc: "ፊቅህ፣ ሐዲስ፣ ሲራና ታሪክን ለትክክለኛ ኑሮ ይማሩ።",
    },
    how: {
      title: "ጉዞዎን በ3 ደረጃ ይጀምሩ",
      s1Title: "ይመዝገቡ",
      s1Desc: "ይመዝገቡና ግቦችዎንና ደረጃዎን ይንገሩን።",
      s2Title: "መርሐግብር ይምረጡ",
      s2Desc: "ለእርስዎና ለመምህርዎ የተሻለ ጊዜ ይምረጡ።",
      s3Title: "መማር ይጀምሩ",
      s3Desc: "ወደ የመስመር ላይ ክፍልዎ ይቀላቀሉ።",
    },
    features: {
      eyebrow: "ለምን እኛን ይምረጡ",
      title1: "ዘመናዊ ባህሪዎች ለ",
      title2: "ትርጉም ያለው እድገት",
      f1Title: "የቀጥታ 1-ለ-1 ክፍሎች",
      f1Desc: "ከመምህርዎ ጋር ቀጥተኛ ግንኙነት ለፈጣን እርማት።",
      f2Title: "ወንዶችና ሴቶች መምህራን",
      f2Desc: "ለምቾትና ሐያ የተለዩ ክፍሎች።",
      f3Title: "የእድገት ክትትል",
      f3Desc: "የማስታወስ ጉዞዎን ለመከታተል ምስላዊ ዳሽቦርዶች።",
      f4Title: "የወላጅ ክትትል",
      f4Desc: "የልጅዎን ተሳትፎና አፈጻጸም ይከታተሉ።",
      f5Title: "የተቀዱ ክፍለ-ጊዜዎች",
      f5Desc: "እያንዳንዱን ክፍል እንደገና ይመልከቱ።",
      f6Title: "ወርሃዊ ሪፖርቶች",
      f6Desc: "በወር በወር ዝርዝር ግምገማዎች።",
    },
    teachers: {
      title: "ባለሙያ ምሁራኖቻችንን ይተዋወቁ",
      bookTrial: "ሙከራ ይዙ",
    },
    testimonials: {
      r1Name: "ሳራ ዊሊያምስ",
      r1Role: "ወላጅ ከለንደን፣ ዩኬ",
      r1Text: "ነጃህ የልጄን የቁርዓን ትምህርት አመለካከት ሙሉ በሙሉ ቀይሯል። መምህሩ ታጋሽና ሙያዊ ነው።",
      r2Name: "ዩሱፍ አብዱላህ",
      r2Role: "ተማሪ ከቶሮንቶ፣ ካናዳ",
      r2Text: "በታጅዊድ ከታገልኩ ዓመታት በኋላ፣ የአንድ ለአንድ አካሄዱ በመጨረሻ ሰራ። እጅግ እመክራለሁ።",
      r3Name: "ፋጢማ ሁሴን",
      r3Role: "አዋቂ ተማሪ ከሲድኒ፣ አውስትራሊያ",
      r3Text: "በ35 ዓመቴ እንደ ጀማሪ ጀመርኩ። ከስድስት ወር በኋላ በቀላሉ አነባለሁ። ተለዋዋጩ መርሐግብር ፍጹም ነው።",
    },
    cta: {
      title: "ዛሬ ቁርዓንን መማር ይጀምሩ",
      desc: "በመንፈሳዊ እድገት ጉዞ ላይ ከመቶዎች ተማሪዎች ጋር ይቀላቀሉ። የመጀመሪያ ትምህርትዎ በእኛ ይከፈላል።",
      register: "አሁን ይመዝገቡ",
      contact: "ያግኙን",
      eyebrow: "ጉዞዎን ይጀምሩ",
      footnote: "ምንም ቁርጠኝነት የለም · የመጀመሪያ ትምህርት ነፃ",
      stat1: "ንቁ ተማሪዎች",
      stat2: "ቀጥታ ትምህርቶች",
      stat3: "ተለዋዋጭ መርሐግብር",
    },
    footer: {
      tagline: "በዘመናዊ ዲጂታል ትምህርት መቅደስ ውስጥ በእውነተኛ ቁርዓንና እስላማዊ ትምህርት የሚቀጥለውን ትውልድ ማብቃት።",
      quickLinks: "ፈጣን አገናኞች",
      aboutUs: "ስለ እኛ",
      ourTeachers: "መምህራኖቻችን",
      coursesLink: "ኮርሶች",
      pricing: "ዋጋ",
      support: "ድጋፍ",
      privacy: "የግላዊነት ፖሊሲ",
      terms: "የአገልግሎት ውሎች",
      sitemap: "ሳይትማፕ",
      help: "የእገዛ ማዕከል",
      contactInfo: "የግንኙነት መረጃ",
      rights: "© 2026 ነጃህ እስላማዊ ማዕከል። መብቱ የተጠበቀ።",
      privacyShort: "ግላዊነት",
      termsShort: "ውሎች",
    },
    announcement: {
      badge: "ቅጥር",
      text: "ብቃት ያላቸው የቁርአን እና እስላማዊ መምህራን እንፈልጋለን",
      cta: "አሁን ያመልክቱ",
    },
  },
};
