import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { HomeMissionSection } from './entities/home-mission-section.entity';
import { HomeMissionCard } from './entities/home-mission-card.entity';
import { HomeProgramsSection } from './entities/home-programs-section.entity';
import { HomeProgram } from './entities/home-program.entity';
import { Testimonial } from './entities/testimonial.entity';
import { HomeTeacher } from './entities/home-teacher.entity';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { UpdateHomeMissionSectionDto } from './dto/update-home-mission-section.dto';
import {
  CreateHomeMissionCardDto,
  UpdateHomeMissionCardDto,
} from './dto/home-mission-card.dto';
import { UpdateHomeProgramsSectionDto } from './dto/update-home-programs-section.dto';
import {
  CreateHomeProgramDto,
  UpdateHomeProgramDto,
} from './dto/home-program.dto';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { CreateHomeTeacherDto, UpdateHomeTeacherDto } from './dto/home-teacher.dto';
import { LocalizedText } from './types/localized-text';

const MISSION_SECTION_ID = 'default';
const PROGRAMS_SECTION_ID = 'default';

@Injectable()
export class WebsiteCmsService implements OnModuleInit {
  private readonly logger = new Logger(WebsiteCmsService.name);

  constructor(
    @InjectRepository(HomeMissionSection)
    private readonly missionSectionRepo: Repository<HomeMissionSection>,
    @InjectRepository(HomeMissionCard)
    private readonly missionCardRepo: Repository<HomeMissionCard>,
    @InjectRepository(HomeProgramsSection)
    private readonly programsSectionRepo: Repository<HomeProgramsSection>,
    @InjectRepository(HomeProgram)
    private readonly programRepo: Repository<HomeProgram>,
    @InjectRepository(Testimonial)
    private readonly testimonialRepo: Repository<Testimonial>,
    @InjectRepository(HomeTeacher)
    private readonly homeTeacherRepo: Repository<HomeTeacher>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
  }

  private async seedDefaults(): Promise<void> {
    const missionExists = await this.missionSectionRepo.findOne({
      where: { id: MISSION_SECTION_ID },
    });
    if (!missionExists) {
      await this.missionSectionRepo.save(
        this.missionSectionRepo.create({
          id: MISSION_SECTION_ID,
          aboutHeader: {
            en: 'About Nejah Online Quran Center',
            ar: 'عن مركز نجاح لتعليم القرآن',
            am: 'ስለ ነጃህ የቁርዓን ማዕከል',
          },
          aboutDescription: {
            en: 'We bridge the gap between traditional Islamic scholarship and modern digital accessibility, ensuring every student receives an authentic and engaging learning experience.',
            ar: 'نحن نسد الفجوة بين العلوم الإسلامية التقليدية والوصول الرقمي الحديث، لنضمن لكل طالب تجربة تعليمية أصيلة وممتعة.',
            am: 'ባህላዊ እስላማዊ ትምህርትንና ዘመናዊ ዲጂታል ተደራሽነትን እንገናኛለን፣ ለእያንዳንዱ ተማሪ እውነተኛና አስደሳች ተሞክሮ እናረጋግጣለን።',
          },
          missionTitle: {
            en: 'Our Mission',
            ar: 'رسالتنا',
            am: 'ተልዕኮአችን',
          },
          missionHeading: {
            en: 'Connecting Students with Expert Quran Teachers Worldwide',
            ar: 'ربط الطلاب مع معلمي القرآن الخبراء في جميع أنحاء العالم',
            am: 'ተማሪዎችን ከባለሙያ የቁርዓን መምህራን በዓለም ዙሪያ ማገናኘት',
          },
          missionDescription: {
            en: 'At Nejah Online Quran Center, we provide personalized one-on-one Quran education through live interactive sessions. Our certified teachers guide students of all ages in Quran recitation, memorization (Hifz), Tajweed, and Islamic studies — all from the comfort of home. With flexible scheduling, progress tracking, and a supportive learning environment, we have helped thousands of students worldwide connect with the Quran.',
            ar: 'في مركز نجاح لتعليم القرآن عبر الإنترنت، نقدم تعليم قرآني فردي مخصص من خلال حصص تفاعلية مباشرة. يوجه معلمونا المعتمدون الطلاب من جميع الأعمار في تلاوة القرآن والحفظ والتجويد والدراسات الإسلامية — من راحة المنزل. مع جدول مرن وتتبع للتقدم وبيئة تعليمية داعمة، ساعدنا آلاف الطلاب في العالم على التواصل مع القرآن.',
            am: 'በነጃህ የመስመር ላይ ቁርዓን ማዕከል፣ በቀጥታ መስተጋብራዊ ክፍሎች የግል አንድ ለአንድ ቁርዓን ትምህርት እናቀርብ። የተረጋገጡ መምህራኖቻችን ለሁሉም ዕድሜ ተማሪዎች በቁርዓን ንባብ፣ ሂፍዝ፣ ታጅዊድ እና እስላማዊ ጥናቶች ይመራሉ — ከቤት ምቾት። በተለዋዋጭ መርሐግብር፣ የእድገት ክትትል እና ደጋፊ ትምህርት አካባቢ፣ በዓለም ዙሪያ በሺዎች ተማሪዎች ከቁርዓን መገናኘት አገዙ።',
          },
          missionImageUrl: '/Nejah-2.png',
        }),
      );
      this.logger.log('Seeded default home mission section');
    }

    const cardCount = await this.missionCardRepo.count();
    if (cardCount === 0) {
      const cards: Partial<HomeMissionCard>[] = [
        {
          title: {
            en: 'Qualified Teachers',
            ar: 'معلمون مؤهلون',
            am: 'ብቁ መምህራን',
          },
          description: {
            en: 'Certified scholars and instructors from leading Islamic institutions, with years of teaching expertise.',
            ar: 'علماء ومدرسون معتمدون من كبرى المؤسسات الإسلامية بخبرة سنوات في التعليم.',
            am: 'ከታላላቅ እስላማዊ ተቋማት የተረጋገጡ ምሁራንና አስተማሪዎች።',
          },
          displayOrder: 0,
          isActive: true,
        },
        {
          title: {
            en: 'One-on-One Classes',
            ar: 'حصص فردية',
            am: 'የአንድ ለአንድ ክፍሎች',
          },
          description: {
            en: 'Individual attention tailored to your pace, ensuring mastery of Tajweed and Hifz effectively.',
            ar: 'اهتمام شخصي يناسب وتيرتك لضمان إتقان التجويد والحفظ بفعالية.',
            am: 'በራስዎ ፍጥነት የተበጀ ግለሰባዊ ትኩረት ለታጅዊድና ሂፍዝ ብቃት።',
          },
          displayOrder: 1,
          isActive: true,
        },
        {
          title: {
            en: 'Flexible Schedule',
            ar: 'جدول مرن',
            am: 'ተለዋዋጭ መርሐግብር',
          },
          description: {
            en: 'Book classes at times that suit your timezone and lifestyle. We are available 24/7 globally.',
            ar: 'احجز الحصص في الأوقات التي تناسبك. نحن متاحون على مدار الساعة عالميًا.',
            am: 'ለርስዎ ጊዜ ምቹ የሆኑ ክፍሎችን ይዙ። 24/7 በዓለም ዙሪያ ተደራሽ ነን።',
          },
          displayOrder: 2,
          isActive: true,
        },
      ];
      await this.missionCardRepo.save(cards.map((c) => this.missionCardRepo.create(c)));
      this.logger.log('Seeded default home mission cards');
    }

    const programsSectionExists = await this.programsSectionRepo.findOne({
      where: { id: PROGRAMS_SECTION_ID },
    });
    if (!programsSectionExists) {
      await this.programsSectionRepo.save(
        this.programsSectionRepo.create({
          id: PROGRAMS_SECTION_ID,
          sectionHeader: {
            en: 'Programs',
            ar: 'البرامج',
            am: 'ፕሮግራሞች',
          },
          mainTitle: {
            en: 'Comprehensive Curriculum',
            ar: 'منهج شامل ومتكامل',
            am: 'አጠቃላይ ሥርዓተ ትምህርት',
          },
          description: {
            en: 'Choose from our specialized tracks designed for different age groups and learning goals.',
            ar: 'اختر من بين مساراتنا المتخصصة المصممة لمختلف الأعمار والأهداف التعليمية.',
            am: 'ለተለያዩ ዕድሜዎችና የመማሪያ ግቦች ከተዘጋጁ ልዩ መንገዶች ይምረጡ።',
          },
        }),
      );
      this.logger.log('Seeded default home programs section');
    }

    const programCount = await this.programRepo.count();
    if (programCount === 0) {
      const programs: Partial<HomeProgram>[] = [
        {
          level: { en: 'Beginner', ar: 'مبتدئ', am: 'ጀማሪ' },
          title: {
            en: 'Quran Reading',
            ar: 'قراءة القرآن',
            am: 'የቁርዓን ንባብ',
          },
          description: {
            en: 'Master the Arabic alphabet and basic pronunciation with the Noorani Qaida.',
            ar: 'إتقان الحروف العربية والنطق الصحيح من خلال القاعدة النورانية.',
            am: 'የአረብኛ ፊደላትንና መሰረታዊ አነባበብ በኑራኒ ቃዒዳ ይቆጣጠሩ።',
          },
          detailedContent: {
            en: '<h2>What You Will Learn</h2><ul><li>Arabic alphabet recognition and pronunciation</li><li>Connecting letters to form words</li><li>Basic Tajweed rules for beginners</li><li>Reading short verses from the Quran</li></ul><h2>Course Structure</h2><p>This course uses the Noorani Qaida method, a time-tested approach that has helped millions of students worldwide learn to read the Quran. Each lesson builds on the previous one, ensuring a solid foundation.</p><h2>Who Is This For?</h2><ul><li>Complete beginners with no prior Arabic knowledge</li><li>Students who want to refresh their Quran reading skills</li><li>Children and adults starting their Quran journey</li></ul>',
            ar: '<h2>ماذا ستتعلم</h2><ul><li>التعرف على الحروف العربية ونطقها</li><li>ربط الحروف لتكوين الكلمات</li><li>قواعد التجويد الأساسية للمبتدئين</li><li>قراءة آيات قصيرة من القرآن</li></ul><h2>هيكل الدورة</h2><p>تستخدم هذه الدورة طريقة القاعدة النورانية، وهي منهجية مثبتة ساعدت ملايين الطلاب حول العالم على تعلم قراءة القرآن. كل درس يبني على الذي قبله، مما يضمن أساساً متيناً.</p><h2>لمن هذه الدورة؟</h2><ul><li>المبتدئون تماماً دون معرفة سابقة بالعربية</li><li>الطلاب الذين يرغبون في تحديث مهارات قراءة القرآن</li><li>الأطفال والبالغون الذين يبدأون رحلتهم القرآنية</li></ul>',
            am: '<h2>ምን ይማራሉ</h2><ul><li>የአረብኛ ፊደላትን መለየት እና አነባበብ</li><li>ፊደላትን በማገናኘት ቃላትን መፍጠር</li><li>መሰረታዊ የታጅዊድ ህጎች ለጀማሪዎች</li><li>አጫጭር የቁርዓን ጥቅሶችን ማንበብ</li></ul><h2>የኮርሱ መዋቅር</h2><p>ይህ ኮርስ በሚሊዮን የሚቆጠሩ ተማሪዎች ቁርዓን ማንበብ እንዲችሉ የረዳውን የኑራኒ ቃዒዳ ዘዴ ይጠቀማል። እያንዳንዱ ትምህርት በቀዳሚው ላይ ይገነባል።</p><h2>ለማን ነው?</h2><ul><li>ያለምንም የቅድመ የአረብኛ እውቀት ጀማሪዎች</li><li>የቁርዓን ንባብ ክህሎታቸውን ማደስ የሚፈልጉ ተማሪዎች</li><li>ልጆች እና ጎልማሶች የቁርዓን ጉዟቸውን የሚጀምሩ</li></ul>',
          },
          displayOrder: 0,
          isActive: true,
        },
        {
          level: { en: 'Intermediate', ar: 'متوسط', am: 'መካከለኛ' },
          title: {
            en: 'Tajweed Course',
            ar: 'دورة التجويد',
            am: 'የታጅዊድ ኮርስ',
          },
          description: {
            en: 'Perfect your pronunciation and articulation for melodious recitation.',
            ar: 'إتقان النطق والمخارج للتلاوة العذبة.',
            am: 'ለምስጉን ንባብ አነባበብዎን ያሟሉ።',
          },
          detailedContent: {
            en: '<h2>What You Will Learn</h2><ul><li>Articulation points (Makharij) of each letter</li><li>Characteristics (Sifaat) of letters</li><li>Rules of Noon Saakin and Tanween</li><li>Rules of Meem Saakin</li><li>Qalqalah, Madd, and Ghunnah</li></ul><h2>Course Structure</h2><p>Our Tajweed program is designed for students who already know how to read the Quran. You will work one-on-one with a certified Tajweed instructor who will guide you through each rule with practical application.</p><h2>Who Is This For?</h2><ul><li>Students who can read Quran but want to improve their recitation</li><li>Those preparing for Ijazah certification</li><li>Anyone who wants to recite the Quran as it was revealed</li></ul>',
            ar: '<h2>ماذا ستتعلم</h2><ul><li>مخارج الحروف</li><li>صفات الحروف</li><li>أحكام النون الساكنة والتنوين</li><li>أحكام الميم الساكنة</li><li>القلقلة والمد والغنة</li></ul><h2>هيكل الدورة</h2><p>برنامج التجويد لدينا مصمم للطلاب الذين يعرفون بالفعل قراءة القرآن. ستعمل بشكل فردي مع معلم تجويد معتمد سيرشدك خلال كل قاعدة مع التطبيق العملي.</p><h2>لمن هذه الدورة؟</h2><ul><li>الطلاب الذين يمكنهم قراءة القرآن ولكن يرغبون في تحسين تلاوتهم</li><li>المستعدون للحصول على شهادة الإجازة</li><li>كل من يريد تلاوة القرآن كما أنزل</li></ul>',
            am: '<h2>ምን ይማራሉ</h2><ul><li>የእያንዳንዱ ፊደል አነባበብ ነጥቦች (ማኻሪጅ)</li><li>የፊደላት ባህሪያት (ሲፋት)</li><li>የኑን ሳኪን እና ታንዊን ህጎች</li><li>የሚም ሳኪን ህጎች</li><li>ቃልቃላህ፣ ማድድ እና ጉናህ</li></ul><h2>የኮርሱ መዋቅር</h2><p>የእኛ የታጅዊድ ፕሮግራም ቁርዓን ማንበብ ለሚችሉ ተማሪዎች የተዘጋጀ ነው። ከተረጋገጠ የታጅዊድ አስተማሪ ጋር አብረው ይሰራሉ።</p><h2>ለማን ነው?</h2><ul><li>ቁርዓን ማንበብ የሚችሉ ነገር ግን ንባባቸውን ማሻሻል የሚፈልጉ</li><li>ለኢጃዛህ የምስክር ወረቀት የሚዘጋጁ</li><li>ቁርዓንን እንደተወረደ ማንበብ የሚፈልግ ማንኛውም ሰው</li></ul>',
          },
          displayOrder: 1,
          isActive: true,
        },
        {
          level: { en: 'Advanced', ar: 'متقدم', am: 'ከፍተኛ' },
          title: {
            en: 'Hifz Program',
            ar: 'برنامج الحفظ',
            am: 'የሂፍዝ ፕሮግራም',
          },
          description: {
            en: 'Structured path to memorize the Holy Quran with expert guidance and review.',
            ar: 'مسار منظم لحفظ القرآن الكريم بإشراف ومراجعة من خبراء.',
            am: 'ቅዱስ ቁርዓንን ለማስታወስ የተደራጁ መንገድ።',
          },
          detailedContent: {
            en: '<h2>What You Will Learn</h2><ul><li>Systematic memorization techniques</li><li>Daily revision and Sabq (new lesson)</li><li>Weekly Manzil (review of memorized portions)</li><li>Tajweed application during memorization</li><li>Tafseer understanding of memorized verses</li></ul><h2>Course Structure</h2><p>Our Hifz program follows a proven methodology with daily Sabq (new memorization), Manzil (weekly review), and Tasmee (recitation to the teacher). Students receive personalized attention and progress tracking.</p><h2>Who Is This For?</h2><ul><li>Students committed to memorizing the entire Quran</li><li>Those who have basic Quran reading skills</li><li>Students of all ages with a strong desire to become Huffaz</li></ul>',
            ar: '<h2>ماذا ستتعلم</h2><ul><li>تقنيات الحفظ المنهجية</li><li>المراجعة اليومية والسبق (الدرس الجديد)</li><li>المنزلة الأسبوعية (مراجعة المحفوظات)</li><li>تطبيق التجويد أثناء الحفظ</li><li>فهم تفسير الآيات المحفوظة</li></ul><h2>هيكل الدورة</h2><p>يتبع برنامج الحفظ لدينا منهجية مثبتة مع سبق يومي (حفظ جديد)، ومنزلة (مراجعة أسبوعية)، وتسميع (قراءة على المعلم). يحصل الطلاب على اهتمام شخصي ومتابعة التقدم.</p><h2>لمن هذه الدورة؟</h2><ul><li>الطلاب الملتزمون بحفظ القرآن كاملاً</li><li>من لديهم مهارات أساسية في قراءة القرآن</li><li>طلاب من جميع الأعمار لديهم رغبة قوية في أن يصبحوا حفظة</li></ul>',
            am: '<h2>ምን ይማራሉ</h2><ul><li>ስልታዊ የማስታወስ ዘዴዎች</li><li>ዕለታዊ ክለሳ እና ሳብቅ (አዲስ ትምህርት)</li><li>ሳምንታዊ መንዚል (የተማረውን መከለስ)</li><li>በማስታወስ ወቅት የታጅዊድ አተገባበር</li><li>የተማሩትን ጥቅሶች ተፍሲር መረዳት</li></ul><h2>የኮርሱ መዋቅር</h2><p>የእኛ የሂፍዝ ፕሮግራም የተረጋገጠ ዘዴ ይከተላል። ተማሪዎች የግል ትኩረት እና የእድገት ክትትል ያገኛሉ።</p><h2>ለማን ነው?</h2><ul><li>ሙሉ ቁርዓንን ለማስታወስ የቆረጡ ተማሪዎች</li><li>መሰረታዊ የቁርዓን ንባብ ክህሎት ያላቸው</li><li>ሁፋዝ ለመሆን ጠንካራ ፍላጎት ያላቸው ሁሉ</li></ul>',
          },
          displayOrder: 2,
          isActive: true,
        },
        {
          level: { en: 'All Levels', ar: 'كل المستويات', am: 'ሁሉም ደረጃዎች' },
          title: {
            en: 'Islamic Studies',
            ar: 'العلوم الإسلامية',
            am: 'እስላማዊ ጥናቶች',
          },
          description: {
            en: 'Learning Fiqh, Hadith, Seerah and history to live an authentic Islamic life.',
            ar: 'تعلم الفقه والحديث والسيرة والتاريخ لحياة إسلامية أصيلة.',
            am: 'ፊቅህ፣ ሐዲስ፣ ሲራና ታሪክን ለትክክለኛ ኑሮ ይማሩ።',
          },
          detailedContent: {
            en: '<h2>What You Will Learn</h2><ul><li>Fiqh of Worship (Purification, Prayer, Fasting, Zakat, Hajj)</li><li>Hadith studies and the science of narration</li><li>Seerah (Life of Prophet Muhammad ﷺ)</li><li>Islamic history and civilization</li><li>Contemporary Islamic issues</li></ul><h2>Course Structure</h2><p>Our Islamic Studies program covers the essential sciences every Muslim should know. The curriculum is designed to be comprehensive yet accessible, with live sessions and interactive discussions.</p><h2>Who Is This For?</h2><ul><li>Muslims seeking a deeper understanding of their faith</li><li>Students who want to learn about Islamic jurisprudence</li><li>Anyone interested in Islamic history and civilization</li><li>New Muslims looking to build a strong foundation</li></ul>',
            ar: '<h2>ماذا ستتعلم</h2><ul><li>فقه العبادات (الطهارة، الصلاة، الصوم، الزكاة، الحج)</li><li>علوم الحديث ومصطلحه</li><li>السيرة النبوية</li><li>التاريخ والحضارة الإسلامية</li><li>القضايا الإسلامية المعاصرة</li></ul><h2>هيكل الدورة</h2><p>يغطي برنامج الدراسات الإسلامية لدينا العلوم الأساسية التي يجب أن يعرفها كل مسلم. تم تصميم المنهج ليكون شاملاً وسهل المنال، مع جلسات مباشرة ومناقشات تفاعلية.</p><h2>لمن هذه الدورة؟</h2><ul><li>المسلمون الذين يسعون لفهم أعمق لدينهم</li><li>الطلاب الذين يرغبون في تعلم الفقه الإسلامي</li><li>المهتمون بالتاريخ والحضارة الإسلامية</li><li>المسلمون الجدد الذين يبحثون عن أساس قوي</li></ul>',
            am: '<h2>ምን ይማራሉ</h2><ul><li>የአምልኮ ፊቅህ (ንጽሕና፣ ሶላት፣ ጾም፣ ዘካ፣ ሐጅ)</li><li>የሐዲስ ጥናቶች እና የትረካ ሳይንስ</li><li>ሲራ (የነቢዩ ሙሐመድ ሕይወት ﷺ)</li><li>እስላማዊ ታሪክ እና ሥልጣኔ</li><li>ወቅታዊ እስላማዊ ጉዳዮች</li></ul><h2>የኮርሱ መዋቅር</h2><p>የእኛ የእስላማዊ ጥናቶች ፕሮግራም እያንዳንዱ ሙስሊም ማወቅ ያለበትን አስፈላጊ ሳይንሶች ይሸፍናል።</p><h2>ለማን ነው?</h2><ul><li>ሃይማኖታቸውን ጠለቅ ብለው ለመረዳት የሚፈልጉ ሙስሊሞች</li><li>ስለ እስላማዊ ፊቅህ መማር የሚፈልጉ ተማሪዎች</li><li>በእስላማዊ ታሪክ እና ሥልጣኔ የሚፈልግ ማንኛውም ሰው</li><li>ጠንካራ መሠረት መጣል የሚፈልጉ አዳዲስ ሙስሊሞች</li></ul>',
          },
          displayOrder: 3,
          isActive: true,
        },
      ];
      await this.programRepo.save(programs.map((p) => this.programRepo.create(p)));
      this.logger.log('Seeded default home programs');
    }

    const testimonialCount = await this.testimonialRepo.count();
    if (testimonialCount === 0) {
      const defaultTestimonials: Partial<Testimonial>[] = [
        {
          studentName: 'Abdurahman',
          displayName: 'Abdurahman',
          studentType: 'adult',
          country: 'United Kingdom',
          city: 'London',
          rating: 5,
          program: 'Quran Reading',
          learningDuration: '6 Months',
          isFeatured: true,
          isPublished: true,
          displayOrder: 0,
          testimonialText: {
            en: 'The flexibility of scheduling and the quality of teachers at Nejah Online Quran Center has allowed me to balance my Quran studies with a busy career. I highly recommend it.',
            ar: 'مرونة الجدولة وجودة المعلمين في مركز نجاح لتعليم القرآن سمحت لي بموازنة دراستي للقرآن مع عملي المزدحم. أنصح به بشدة.',
            am: 'የመማሪያ ጊዜዎች ተለዋዋጭነት እና በነጃህ የመስመር ላይ ቁርዓን ማዕከል ያሉ መምህራን ጥራት የቁርዓን ጥናቴን ከተጠመደ የሥራ ሕይወቴ ጋር ለማመጣጠን አስችሎኛል። በጣም እመክረዋለሁ።',
          },
        },
        {
          studentName: 'Fatima Hussein',
          displayName: 'Fatima',
          studentType: 'parent',
          country: 'United States',
          city: 'Minneapolis',
          rating: 5,
          program: 'Tajweed',
          learningDuration: '1 Year',
          isFeatured: true,
          isPublished: true,
          displayOrder: 1,
          testimonialText: {
            en: 'I am amazed by the progress my children have made in just a few months. The teachers are incredibly patient, encouraging, and the interactive platform keeps them engaged.',
            ar: 'أنا مندهشة من التقدم الذي أحرزه أطفالي في بضعة أشهر فقط. المعلمون صبورون للغاية ومشجعون، والمنصة التفاعلية تبقيهم متفاعلين.',
            am: 'ልጆቼ በጥቂት ወራት ውስጥ ባሳዩት እድገት በጣም ተገርሜያለሁ። መምህራኑ በሚያስደንቅ ሁኔታ ታጋሽ እና አበረታች ናቸው، እና በይነተገናኝ መድረክ ላይ እንዲሳተፉ ያደርጋቸዋል።',
          },
        },
        {
          studentName: 'Khalid Al-Mansoor',
          displayName: 'Khalid',
          studentType: 'child',
          country: 'Saudi Arabia',
          city: 'Riyadh',
          rating: 5,
          program: 'Hifz Program',
          learningDuration: '2 Years',
          isFeatured: true,
          isPublished: true,
          displayOrder: 2,
          testimonialText: {
            en: 'Under the guidance of my teacher, I have memorized 5 Juz of the Quran. The focus on Tajweed and the daily progress reviews are excellent.',
            ar: 'تحت إشراف معلمي، حفظت 5 أجزاء من القرآن. التركيز على التجويد والمراجعات اليومية للتقدم ممتازة.',
            am: 'በመምህሬ መሪነት 5 ጁዝ ቁርአን መሐፈዝ ችያለሁ። በታጅዊድ ላይ ያለው ትኩረት እና ዕለታዊ የእድገት ግምገማዎች በጣም ጥሩ ናቸው።',
          },
        },
      ];
      await this.testimonialRepo.save(defaultTestimonials.map((t) => this.testimonialRepo.create(t)));
      this.logger.log('Seeded default testimonials');
    }
  }

  async getPublicMissionContent() {
    const section = await this.getOrCreateMissionSection();
    const cards = await this.missionCardRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return { section, cards };
  }

  async getAdminMissionContent() {
    const section = await this.getOrCreateMissionSection();
    const cards = await this.missionCardRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return { section, cards };
  }

  private async getOrCreateMissionSection(): Promise<HomeMissionSection> {
    let section = await this.missionSectionRepo.findOne({ where: { id: MISSION_SECTION_ID } });
    if (!section) {
      await this.seedDefaults();
      section = await this.missionSectionRepo.findOne({ where: { id: MISSION_SECTION_ID } });
    }
    return section!;
  }

  async updateMissionSection(dto: UpdateHomeMissionSectionDto): Promise<HomeMissionSection> {
    const section = await this.getOrCreateMissionSection();
    if (dto.aboutHeader !== undefined) section.aboutHeader = dto.aboutHeader;
    if (dto.aboutDescription !== undefined) section.aboutDescription = dto.aboutDescription;
    if (dto.missionTitle !== undefined) section.missionTitle = dto.missionTitle;
    if (dto.missionHeading !== undefined) section.missionHeading = dto.missionHeading;
    if (dto.missionDescription !== undefined) section.missionDescription = dto.missionDescription;
    if (dto.missionImageUrl !== undefined) section.missionImageUrl = dto.missionImageUrl;
    return this.missionSectionRepo.save(section);
  }

  async createMissionCard(dto: CreateHomeMissionCardDto): Promise<HomeMissionCard> {
    const maxOrder = await this.missionCardRepo
      .createQueryBuilder('c')
      .select('MAX(c.displayOrder)', 'max')
      .getRawOne();
    const displayOrder = dto.displayOrder ?? (Number(maxOrder?.max ?? -1) + 1);
    const card = this.missionCardRepo.create({
      ...dto,
      displayOrder,
      isActive: dto.isActive ?? true,
    });
    return this.missionCardRepo.save(card);
  }

  async updateMissionCard(id: string, dto: UpdateHomeMissionCardDto): Promise<HomeMissionCard> {
    const card = await this.missionCardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Mission card not found');
    Object.assign(card, dto);
    return this.missionCardRepo.save(card);
  }

  async deleteMissionCard(id: string): Promise<void> {
    const result = await this.missionCardRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Mission card not found');
  }

  async reorderMissionCards(ids: string[]): Promise<HomeMissionCard[]> {
    const cards = await this.missionCardRepo.find();
    const idSet = new Set(ids);
    if (idSet.size !== ids.length || ids.length !== cards.length) {
      throw new NotFoundException('Invalid card order payload');
    }
    await Promise.all(
      ids.map((id, index) => this.missionCardRepo.update(id, { displayOrder: index })),
    );
    return this.missionCardRepo.find({ order: { displayOrder: 'ASC' } });
  }

  async getPublicProgramsContent() {
    const section = await this.getOrCreateProgramsSection();
    const programs = await this.programRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return { section, programs };
  }

  async getAdminProgramsContent() {
    const section = await this.getOrCreateProgramsSection();
    const programs = await this.programRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return { section, programs };
  }

  private async getOrCreateProgramsSection(): Promise<HomeProgramsSection> {
    let section = await this.programsSectionRepo.findOne({ where: { id: PROGRAMS_SECTION_ID } });
    if (!section) {
      await this.seedDefaults();
      section = await this.programsSectionRepo.findOne({ where: { id: PROGRAMS_SECTION_ID } });
    }
    return section!;
  }

  async updateProgramsSection(dto: UpdateHomeProgramsSectionDto): Promise<HomeProgramsSection> {
    const section = await this.getOrCreateProgramsSection();
    if (dto.sectionHeader !== undefined) section.sectionHeader = dto.sectionHeader;
    if (dto.mainTitle !== undefined) section.mainTitle = dto.mainTitle;
    if (dto.description !== undefined) section.description = dto.description;
    return this.programsSectionRepo.save(section);
  }

  async createProgram(dto: CreateHomeProgramDto): Promise<HomeProgram> {
    const maxOrder = await this.programRepo
      .createQueryBuilder('p')
      .select('MAX(p.displayOrder)', 'max')
      .getRawOne();
    const displayOrder = dto.displayOrder ?? (Number(maxOrder?.max ?? -1) + 1);
    const program = this.programRepo.create({
      ...dto,
      displayOrder,
      isActive: dto.isActive ?? true,
    });
    return this.programRepo.save(program);
  }

  async updateProgram(id: string, dto: UpdateHomeProgramDto): Promise<HomeProgram> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async deleteProgram(id: string): Promise<void> {
    const result = await this.programRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Program not found');
  }

  async reorderPrograms(ids: string[]): Promise<HomeProgram[]> {
    const programs = await this.programRepo.find();
    const idSet = new Set(ids);
    if (idSet.size !== ids.length || ids.length !== programs.length) {
      throw new NotFoundException('Invalid program order payload');
    }
    await Promise.all(
      ids.map((id, index) => this.programRepo.update(id, { displayOrder: index })),
    );
    return this.programRepo.find({ order: { displayOrder: 'ASC' } });
  }

  // --- Testimonials ---

  async getPublicTestimonials(): Promise<Testimonial[]> {
    return this.testimonialRepo.find({
      where: { isPublished: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async getAdminTestimonials(): Promise<Testimonial[]> {
    return this.testimonialRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createTestimonial(dto: CreateTestimonialDto): Promise<Testimonial> {
    const maxOrder = await this.testimonialRepo
      .createQueryBuilder('t')
      .select('MAX(t.displayOrder)', 'max')
      .getRawOne();
    const displayOrder = dto.displayOrder ?? (Number(maxOrder?.max ?? -1) + 1);
    const testimonial = this.testimonialRepo.create({
      ...dto,
      displayOrder,
      isPublished: dto.isPublished ?? true,
      isFeatured: dto.isFeatured ?? false,
    });
    return this.testimonialRepo.save(testimonial);
  }

  async updateTestimonial(id: string, dto: UpdateTestimonialDto): Promise<Testimonial> {
    const testimonial = await this.testimonialRepo.findOne({ where: { id } });
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    Object.assign(testimonial, dto);
    return this.testimonialRepo.save(testimonial);
  }

  async deleteTestimonial(id: string): Promise<void> {
    const result = await this.testimonialRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Testimonial not found');
  }

  async reorderTestimonials(ids: string[]): Promise<Testimonial[]> {
    const testimonials = await this.testimonialRepo.find();
    const idSet = new Set(ids);
    if (idSet.size !== ids.length || ids.length !== testimonials.length) {
      throw new NotFoundException('Invalid testimonial order payload');
    }
    await Promise.all(
      ids.map((id, index) => this.testimonialRepo.update(id, { displayOrder: index })),
    );
    return this.testimonialRepo.find({ order: { displayOrder: 'ASC' } });
  }

  // --- Teachers ---

  async getPublicTeachers(): Promise<HomeTeacher[]> {
    return this.homeTeacherRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async getAdminTeachers(): Promise<HomeTeacher[]> {
    return this.homeTeacherRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async searchUsers(q: string): Promise<User[]> {
    if (!q || q.length < 2) return [];
    return this.userRepo.find({
      where: [
        { name: ILike(`%${q}%`) },
        { email: ILike(`%${q}%`) },
      ],
      take: 20,
      order: { name: 'ASC' },
    });
  }

  async createTeacher(dto: CreateHomeTeacherDto): Promise<HomeTeacher> {
    const maxOrder = await this.homeTeacherRepo
      .createQueryBuilder('t')
      .select('MAX(t.displayOrder)', 'max')
      .getRawOne();
    const displayOrder = dto.displayOrder ?? (Number(maxOrder?.max ?? -1) + 1);
    const teacher = this.homeTeacherRepo.create({
      ...dto,
      displayOrder,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.homeTeacherRepo.save(teacher);

    if (saved.userId) {
      await this.syncTeacherRecord(saved.userId, saved.specialization, saved.experience);
    }

    return saved;
  }

  async updateTeacher(id: string, dto: UpdateHomeTeacherDto): Promise<HomeTeacher> {
    const teacher = await this.homeTeacherRepo.findOne({ where: { id } });
    if (!teacher) throw new NotFoundException('Home teacher not found');
    Object.assign(teacher, dto);
    const saved = await this.homeTeacherRepo.save(teacher);

    if (saved.userId) {
      await this.syncTeacherRecord(saved.userId, saved.specialization, saved.experience);
    }

    return saved;
  }

  async deleteTeacher(id: string): Promise<void> {
    const result = await this.homeTeacherRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Home teacher not found');
  }

  async reorderTeachers(ids: string[]): Promise<HomeTeacher[]> {
    const teachers = await this.homeTeacherRepo.find();
    const idSet = new Set(ids);
    if (idSet.size !== ids.length || ids.length !== teachers.length) {
      throw new NotFoundException('Invalid teacher order payload');
    }
    await Promise.all(
      ids.map((id, index) => this.homeTeacherRepo.update(id, { displayOrder: index })),
    );
    return this.homeTeacherRepo.find({ order: { displayOrder: 'ASC' } });
  }

  private async syncTeacherRecord(
    userId: string,
    specialization: string,
    experience: string | null,
  ): Promise<void> {
    const existingTeacher = await this.teacherRepo.findOne({ where: { userId } });
    if (existingTeacher) {
      existingTeacher.specialization = specialization;
      if (experience !== null) {
        const parsed = parseInt(experience, 10);
        if (!isNaN(parsed)) {
          existingTeacher.experience = parsed;
        }
      }
      await this.teacherRepo.save(existingTeacher);
    }
  }
}
