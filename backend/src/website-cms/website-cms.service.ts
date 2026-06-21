import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeMissionSection } from './entities/home-mission-section.entity';
import { HomeMissionCard } from './entities/home-mission-card.entity';
import { HomeProgramsSection } from './entities/home-programs-section.entity';
import { HomeProgram } from './entities/home-program.entity';
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
          displayOrder: 3,
          isActive: true,
        },
      ];
      await this.programRepo.save(programs.map((p) => this.programRepo.create(p)));
      this.logger.log('Seeded default home programs');
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
}
