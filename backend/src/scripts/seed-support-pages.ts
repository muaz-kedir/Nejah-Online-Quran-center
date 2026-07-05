import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupportPagesService } from '../support-pages/support-pages.service';
import { PageStatus } from '../support-pages/entities/support-page.entity';
import { ArticleStatus } from '../support-pages/entities/help-article.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const svc = app.get(SupportPagesService);

  try {
    // ── Support Pages ──────────────────────────────────────
    console.log('Seeding support pages...');
    const privacyPage = {
      slug: 'privacy-policy',
      title: { en: 'Privacy Policy', ar: 'سياسة الخصوصية', am: 'የግላዊነት ፖሊሲ' },
      subtitle: {
        en: 'How we handle your personal information',
        ar: 'كيف نتعامل مع معلوماتك الشخصية',
        am: 'የግል መረጃዎን እንዴት እንደምናስተናግድ',
      },
      content: {
        en: '<h2>Introduction</h2><p>Nejah Online Quran Center respects your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our services.</p><h2>Information We Collect</h2><p>We collect information you provide directly, such as your name, email address, and payment details when registering for courses.</p><h2>How We Use Your Information</h2><p>We use your information to provide and improve our services, process payments, and communicate with you about your learning journey.</p><h2>Data Protection</h2><p>We implement appropriate security measures to protect your personal data from unauthorized access or disclosure.</p><h2>Contact Us</h2><p>If you have questions about this policy, please contact us at nejahqurancenter1@gmail.com.</p>',
        ar: '<h2>مقدمة</h2><p>يحترم مركز نهاج لتحفيظ القرآن الكريم خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام خدماتنا.</p><h2>المعلومات التي نجمعها</h2><p>نجمع المعلومات التي تقدمها مباشرة، مثل اسمك وبريدك الإلكتروني وتفاصيل الدفع عند التسجيل في الدورات.</p><h2>كيف نستخدم معلوماتك</h2><p>نستخدم معلوماتك لتقديم خدماتنا وتحسينها ومعالجة المدفوعات والتواصل معك بشأن رحلتك التعليمية.</p><h2>حماية البيانات</h2><p>ننفذ إجراءات أمنية مناسبة لحماية بياناتك الشخصية من الوصول غير المصرح به أو الإفصاح.</p><h2>اتصل بنا</h2><p>إذا كانت لديك أسئلة حول هذه السياسة، يرجى الاتصال بنا على nejahqurancenter1@gmail.com.</p>',
        am: '<h2>መግቢያ</h2><p>Nejah የመስመር ላይ ቁርአን ማእከል የግላዊነትዎን ያከብራል። ይህ ፖሊሲ የግል መረጃዎን እንዴት እንደምንሰበስብ፣ እንደምንጠቀም እና እንደምንጠብቅ ያብራራል።</p>',
      },
      metaTitle: { en: 'Privacy Policy | Nejah Online Quran Center', ar: 'سياسة الخصوصية | مركز نهاج لتحفيظ القرآن الكريم', am: 'የግላዊነት ፖሊሲ | Nejah የመስመር ላይ ቁርአን ማእከል' },
      metaDescription: { en: 'Learn how Nejah Online Quran Center collects, uses, and protects your personal information.', ar: 'تعرف على كيفية جمع واستخدام وحماية معلوماتك الشخصية في مركز نهاج لتحفيظ القرآن الكريم.', am: 'Nejah የመስመር ላይ ቁርአን ማእከል የግል መረጃዎን እንዴት እንደሚሰበስብ፣ እንደሚጠቀም እና እንደሚጠብቅ ይወቁ።' },
      metaKeywords: { en: 'privacy policy, data protection, Nejah', ar: 'سياسة الخصوصية, حماية البيانات, نهاج', am: 'የግላዊነት ፖሊሲ, የውሂብ ጥበቃ, Nejah' },
      status: PageStatus.PUBLISHED,
    };
    await svc.createPage(privacyPage);
    console.log('  ✅ Privacy Policy page created');

    const termsPage = {
      slug: 'terms-of-service',
      title: { en: 'Terms of Service', ar: 'شروط الخدمة', am: 'የአገልግሎት ውል' },
      subtitle: {
        en: 'Terms and conditions for using our services',
        ar: 'الشروط والأحكام لاستخدام خدماتنا',
        am: 'አገልግሎቶቻችንን ለመጠቀም ደንቦች እና ሁኔታዎች',
      },
      content: {
        en: '<h2>Acceptance of Terms</h2><p>By accessing or using Nejah Online Quran Center services, you agree to be bound by these Terms of Service.</p><h2>Registration</h2><p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.</p><h2>Course Enrollment</h2><p>Course fees are non-refundable unless otherwise stated. We reserve the right to modify or discontinue courses at any time.</p><h2>User Conduct</h2><p>You agree to use our services for lawful purposes only and to respect other students and teachers.</p><h2>Intellectual Property</h2><p>All course materials are protected by copyright and may not be distributed without permission.</p>',
        ar: '<h2>قبول الشروط</h2><p>باستخدامك لخدمات مركز نهاج لتحفيظ القرآن الكريم، فإنك توافق على الالتزام بهذه الشروط.</p><h2>التسجيل</h2><p>يجب عليك تقديم معلومات دقيقة عند إنشاء حساب. أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك.</p><h2>التسجيل في الدورات</h2><p>رسوم الدورات غير قابلة للاسترداد ما لم ينص على خلاف ذلك. نحتفظ بالحق في تعديل أو إيقاف الدورات في أي وقت.</p><h2>سلوك المستخدم</h2><p>توافق على استخدام خدماتنا للأغراض القانونية فقط واحترام الطلاب والمعلمين الآخرين.</p><h2>الملكية الفكرية</h2><p>جميع مواد الدورة محمية بحقوق الطبع ولا يجوز توزيعها دون إذن.</p>',
        am: '<h2>የውል ተቀባይነት</h2><p>የ Nejah የመስመር ላይ ቁርአን ማእከል አገልግሎቶችን በመጠቀም ወይም በመድረስ፣ በእነዚህ የአገልግሎት ውሎች እንደሚታሰሩ ይስማማሉ።</p>',
      },
      metaTitle: { en: 'Terms of Service | Nejah Online Quran Center', ar: 'شروط الخدمة | مركز نهاج لتحفيظ القرآن الكريم', am: 'የአገልግሎት ውል | Nejah የመስመር ላይ ቁርአን ማእከል' },
      metaDescription: { en: 'Review the terms and conditions for using Nejah Online Quran Center services.', ar: 'راجع الشروط والأحكام لاستخدام خدمات مركز نهاج لتحفيظ القرآن الكريم.', am: 'የ Nejah የመስመር ላይ ቁርአን ማእከል አገልግሎቶችን ለመጠቀም ደንቦቹን እና ሁኔታዎቹን ይመልከቱ።' },
      metaKeywords: { en: 'terms of service, terms and conditions, Nejah', ar: 'شروط الخدمة, الشروط والأحكام, نهاج', am: 'የአገልግሎት ውል, ደንቦች እና ሁኔታዎች, Nejah' },
      status: PageStatus.PUBLISHED,
    };
    await svc.createPage(termsPage);
    console.log('  ✅ Terms of Service page created');

    // ── Sitemap Items ──────────────────────────────────────
    console.log('Seeding sitemap items...');
    const home = await svc.createSitemapItem({ title: 'Home', url: '/', isVisible: true });
    const about = await svc.createSitemapItem({ title: 'About', url: '/about', isVisible: true });
    const courses = await svc.createSitemapItem({ title: 'Courses', url: '/courses', isVisible: true });
    const teachers = await svc.createSitemapItem({ title: 'Teachers', url: '/teachers', isVisible: true });
    const testimonials = await svc.createSitemapItem({ title: 'Testimonials', url: '/testimonials', isVisible: true });
    const contact = await svc.createSitemapItem({ title: 'Contact', url: '/contact', isVisible: true });
    const supportRoot = await svc.createSitemapItem({ title: 'Support', url: '/help-center', isVisible: true });

    await svc.createSitemapItem({ title: 'Privacy Policy', url: '/privacy-policy', parentId: supportRoot.id, isVisible: true });
    await svc.createSitemapItem({ title: 'Terms of Service', url: '/terms-of-service', parentId: supportRoot.id, isVisible: true });
    await svc.createSitemapItem({ title: 'Sitemap', url: '/sitemap', parentId: supportRoot.id, isVisible: true });
    await svc.createSitemapItem({ title: 'Help Center', url: '/help-center', parentId: supportRoot.id, isVisible: true });
    console.log('  ✅ 10 sitemap items created');

    // ── Help Categories ────────────────────────────────────
    console.log('Seeding help categories...');
    const cat1 = await svc.createCategory({
      name: { en: 'Getting Started', ar: 'بدء الاستخدام', am: 'መጀመር' },
      slug: 'getting-started',
      icon: 'Rocket',
      description: { en: 'New to Nejah? Start here to learn how our platform works.', ar: 'جديد في نهاج؟ ابدأ هنا لتعلم كيفية عمل منصتنا.', am: 'ለ Nejah አዲስ ነዎት? መድረካችን እንዴት እንደሚሰራ ለመማር እዚህ ይጀምሩ።' },
    });
    const cat2 = await svc.createCategory({
      name: { en: 'Account & Billing', ar: 'الحساب والفواتير', am: 'መለያ እና ክፍያ' },
      slug: 'account-billing',
      icon: 'CreditCard',
      description: { en: 'Manage your account settings, subscriptions, and payment methods.', ar: 'إدارة إعدادات حسابك والاشتراكات وطرق الدفع.', am: 'የመለያ ቅንብሮችዎን፣ የደንበኝነት ምዝገባዎችን እና የክፍያ ዘዴዎችን ያስተዳድሩ።' },
    });
    const cat3 = await svc.createCategory({
      name: { en: 'Courses & Learning', ar: 'الدورات والتعلم', am: 'ኮርሶች እና ትምህርት' },
      slug: 'courses-learning',
      icon: 'BookOpen',
      description: { en: 'Information about course structure, materials, and learning tools.', ar: 'معلومات حول هيكل الدورة والمواد وأدوات التعلم.', am: 'ስለ ኮርስ አወቃቀር፣ ቁሳቁሶች እና የመማሪያ መሳሪያዎች መረጃ።' },
    });
    const cat4 = await svc.createCategory({
      name: { en: 'Technical Support', ar: 'الدعم الفني', am: 'የቴክኒክ ድጋፍ' },
      slug: 'technical-support',
      icon: 'Monitor',
      description: { en: 'Troubleshoot technical issues with our platform and tools.', ar: 'استكشاف المشكلات التقنية وإصلاحها في منصتنا وأدواتنا.', am: 'በመድረካችን እና በመሳሪያዎቻችን ላይ የቴክኒክ ችግሮችን ይፈቱ።' },
    });
    const cat5 = await svc.createCategory({
      name: { en: 'Pricing & Payments', ar: 'الأسعار والمدفوعات', am: 'ዋጋ እና ክፍያ' },
      slug: 'pricing-payments',
      icon: 'DollarSign',
      description: { en: 'Details about course pricing, discounts, and payment options.', ar: 'تفاصيل حول أسعار الدورات والخصومات وخيارات الدفع.', am: 'ስለ ኮርስ ዋጋ፣ ቅናሾች እና የክፍያ አማራጮች ዝርዝሮች።' },
    });
    console.log('  ✅ 5 help categories created');

    // ── Help Articles ──────────────────────────────────────
    console.log('Seeding help articles...');
    await svc.createArticle({
      title: { en: 'How to Create Your Account', ar: 'كيفية إنشاء حسابك', am: 'መለያዎን እንዴት መፍጠር እንደሚችሉ' },
      slug: 'how-to-create-account',
      categoryId: cat1.id,
      shortDescription: {
        en: 'Follow these simple steps to create your Nejah account and start learning.',
        ar: 'اتبع هذه الخطوات البسيطة لإنشاء حسابك في نهاج وبدء التعلم.',
        am: 'መለያዎን ለመፍጠር እና መማር ለመጀመር እነዚህን ቀላል ደረጃዎች ይከተሉ።',
      },
      content: {
        en: '<h2>Creating Your Account</h2><p>To get started with Nejah Online Quran Center, you need to create an account. Follow these steps:</p><ol><li>Click the "Sign Up" button on the top right corner of the homepage.</li><li>Enter your full name, email address, and a secure password.</li><li>Choose your preferred language (English, Arabic, or Amharic).</li><li>Select your role (Student or Parent).</li><li>Verify your email address by clicking the link sent to your inbox.</li><li>Complete your profile by adding any additional information.</li></ol><p>Once your account is created, you can browse courses and start learning immediately.</p>',
        ar: '<h2>إنشاء حسابك</h2><p>للبدء مع مركز نهاج لتحفيظ القرآن الكريم، تحتاج إلى إنشاء حساب. اتبع هذه الخطوات:</p><ol><li>انقر على زر "اشتراك" في الزاوية اليمنى العليا من الصفحة الرئيسية.</li><li>أدخل اسمك الكامل وعنوان بريدك الإلكتروني وكلمة مرور آمنة.</li><li>اختر لغتك المفضلة (الإنجليزية أو العربية أو الأمهرية).</li><li>حدد دورك (طالب أو ولي أمر).</li><li>تحقق من عنوان بريدك الإلكتروني من خلال النقر على الرابط المرسل إلى صندوق الوارد الخاص بك.</li><li>أكمل ملفك الشخصي بإضافة أي معلومات إضافية.</li></ol><p>بمجرد إنشاء حسابك، يمكنك تصفح الدورات والبدء في التعلم على الفور.</p>',
        am: '<h2>መለያዎን መፍጠር</h2><p>ከ Nejah የመስመር ላይ ቁርአን ማእከል ለመጀመር መለያ መፍጠር ያስፈልግዎታል። እነዚህን ደረጃዎች ይከተሉ።</p>',
      },
      tags: ['account', 'registration', 'getting-started'],
      author: 'Nejah Support Team',
      status: ArticleStatus.PUBLISHED,
    });
    console.log('  ✅ Article 1: How to Create Your Account');

    await svc.createArticle({
      title: { en: 'Navigating the Dashboard', ar: 'التنقل في لوحة التحكم', am: 'ዳሽቦርዱን ማሰስ' },
      slug: 'navigating-the-dashboard',
      categoryId: cat1.id,
      shortDescription: {
        en: 'Learn how to use the main dashboard and find your way around.',
        ar: 'تعلم كيفية استخدام لوحة التحكم الرئيسية والتنقل فيها.',
        am: 'ዋናውን ዳሽቦርድ እንዴት መጠቀም እንደሚችሉ እና መንገድዎን እንዴት መፈለግ እንደሚችሉ ይማሩ።',
      },
      content: {
        en: '<h2>Dashboard Overview</h2><p>After logging in, you will see the main dashboard. Here is what each section does:</p><ul><li><strong>My Courses</strong> — View and access your enrolled courses.</li><li><strong>Progress</strong> — Track your learning progress and achievements.</li><li><strong>Schedule</strong> — View your upcoming classes and sessions.</li><li><strong>Messages</strong> — Communicate with your teachers.</li><li><strong>Profile</strong> — Update your personal information and settings.</li></ul>',
        ar: '<h2>نظرة عامة على لوحة التحكم</h2><p>بعد تسجيل الدخول، ستظهر لك لوحة التحكم الرئيسية. إليك ما يفعله كل قسم:</p>',
        am: '<h2>ዳሽቦርድ አጠቃላይ እይታ</h2><p>ከገቡ በኋላ ዋናውን ዳሽቦርድ ያያሉ። እያንዳንዱ ክፍል የሚያደርገው ይህ ነው።</p>',
      },
      tags: ['dashboard', 'navigation', 'getting-started'],
      author: 'Nejah Support Team',
      status: ArticleStatus.PUBLISHED,
    });
    console.log('  ✅ Article 2: Navigating the Dashboard');

    await svc.createArticle({
      title: { en: 'Resetting Your Password', ar: 'إعادة تعيين كلمة المرور', am: 'የይለፍ ቃልዎን መቀየር' },
      slug: 'resetting-your-password',
      categoryId: cat2.id,
      shortDescription: {
        en: 'Forgot your password? Learn how to reset it securely.',
        ar: 'هل نسيت كلمة المرور؟ تعلم كيفية إعادة تعيينها بشكل آمن.',
        am: 'የይለፍ ቃልዎን ረሱ? በደህና እንዴት መቀየር እንደሚችሉ ይማሩ።',
      },
      content: {
        en: '<h2>Password Reset</h2><p>If you have forgotten your password, follow these steps:</p><ol><li>Go to the login page and click "Forgot Password".</li><li>Enter your registered email address.</li><li>Check your email for a password reset link.</li><li>Click the link and enter a new password.</li><li>Confirm the new password and save changes.</li></ol>',
        ar: '<h2>إعادة تعيين كلمة المرور</h2><p>إذا نسيت كلمة المرور الخاصة بك، اتبع هذه الخطوات:</p>',
        am: '<h2>የይለፍ ቃል መቀየር</h2><p>የይለፍ ቃልዎን ከረሱ እነዚህን ደረጃዎች ይከተሉ።</p>',
      },
      tags: ['password', 'account', 'security'],
      author: 'Nejah Support Team',
      status: ArticleStatus.PUBLISHED,
    });
    console.log('  ✅ Article 3: Resetting Your Password');

    await svc.createArticle({
      title: { en: 'Understanding Course Levels', ar: 'فهم مستويات الدورات', am: 'የኮርስ ደረጃዎችን መረዳት' },
      slug: 'understanding-course-levels',
      categoryId: cat3.id,
      shortDescription: {
        en: 'Learn about the different course levels available and which one is right for you.',
        ar: 'تعرف على مستويات الدورات المختلفة المتاحة وأيها مناسب لك.',
        am: 'ስለሚገኙ የተለያዩ የኮርስ ደረጃዎች እና የትኛው ለእርስዎ ተስማሚ እንደሆነ ይማሩ።',
      },
      content: {
        en: '<h2>Course Levels</h2><p>We offer courses for all skill levels:</p><ul><li><strong>Beginner</strong> — No prior knowledge needed. Learn the Arabic alphabet and basic recitation.</li><li><strong>Intermediate</strong> — For students who can read Arabic and want to improve Tajweed.</li><li><strong>Advanced</strong> — For those ready to memorize and master advanced recitation rules.</li></ul>',
        ar: '<h2>مستويات الدورات</h2><p>نقدم دورات لجميع مستويات المهارة:</p>',
        am: '<h2>የኮርስ ደረጃዎች</h2><p>ለሁሉም የክህሎት ደረጃዎች ኮርሶችን እናቀርባለን።</p>',
      },
      tags: ['courses', 'levels', 'learning'],
      author: 'Nejah Support Team',
      status: ArticleStatus.PUBLISHED,
    });
    console.log('  ✅ Article 4: Understanding Course Levels');

    await svc.createArticle({
      title: { en: 'Troubleshooting Video and Audio Issues', ar: 'استكشاف مشكلات الفيديو والصوت وإصلاحها', am: 'የቪዲዮ እና የድምጽ ችግሮችን መፍታት' },
      slug: 'troubleshooting-video-audio',
      categoryId: cat4.id,
      shortDescription: {
        en: 'Fix common video and audio problems during live sessions.',
        ar: 'إصلاح مشاكل الفيديو والصوت الشائعة أثناء الجلسات المباشرة.',
        am: 'በቀጥታ ክፍለ ጊዜዎች ወቅት የተለመዱ የቪዲዮ እና የድምጽ ችግሮችን ያስተካክሉ።',
      },
      content: {
        en: '<h2>Video & Audio Troubleshooting</h2><p>If you experience issues during live sessions:</p><ul><li>Check your internet connection stability.</li><li>Ensure your microphone and camera are not blocked by your browser.</li><li>Close other applications that may be using your camera or microphone.</li><li>Try using a different browser (Chrome or Firefox recommended).</li><li>Restart your device if problems persist.</li></ul>',
        ar: '<h2>استكشاف مشكلات الفيديو والصوت وإصلاحها</h2><p>إذا واجهت مشكلات أثناء الجلسات المباشرة:</p>',
        am: '<h2>የቪዲዮ እና የድምጽ ችግር መፍቻ</h2><p>በቀጥታ ክፍለ ጊዜዎች ወቅት ችግሮች ካጋጠሙዎት።</p>',
      },
      tags: ['technical', 'video', 'audio', 'troubleshooting'],
      author: 'Nejah Support Team',
      status: ArticleStatus.PUBLISHED,
    });
    console.log('  ✅ Article 5: Troubleshooting Video and Audio Issues');

    await svc.createArticle({
      title: { en: 'Available Payment Methods', ar: 'طرق الدفع المتاحة', am: 'የሚገኙ የክፍያ ዘዴዎች' },
      slug: 'available-payment-methods',
      categoryId: cat5.id,
      shortDescription: {
        en: 'Learn about the payment options we accept for course enrollment.',
        ar: 'تعرف على خيارات الدفع التي نقبلها للتسجيل في الدورات.',
        am: 'ለኮርስ ምዝገባ የምንቀበላቸውን የክፍያ አማራጮች ይማሩ።',
      },
      content: {
        en: '<h2>Payment Methods</h2><p>We accept the following payment methods:</p><ul><li><strong>Credit/Debit Cards</strong> — Visa, Mastercard, and American Express.</li><li><strong>PayPal</strong> — Secure online payments.</li><li><strong>Bank Transfer</strong> — Direct bank transfers for annual plans.</li></ul><p>All payments are processed securely. We do not store your payment details.</p>',
        ar: '<h2>طرق الدفع</h2><p>نقبل طرق الدفع التالية:</p>',
        am: '<h2>የክፍያ ዘዴዎች</h2><p>የሚከተሉትን የክፍያ ዘዴዎች እንቀበላለን።</p>',
      },
      tags: ['payment', 'pricing', 'billing'],
      author: 'Nejah Support Team',
      status: ArticleStatus.PUBLISHED,
    });
    console.log('  ✅ Article 6: Available Payment Methods');

    // Reorder sitemap items
    await svc.reorderSitemap([
      home.id, about.id, courses.id, teachers.id, testimonials.id,
      supportRoot.id, contact.id,
    ]);
    console.log('  ✅ Sitemap items reordered');

    console.log('\n🎉 Support pages seeding complete!');
    console.log('Seeded: 2 pages, 10 sitemap items, 5 categories, 6 articles');
  } catch (error) {
    console.error('❌ Error seeding support pages:', error);
  }

  await app.close();
}

seed();
