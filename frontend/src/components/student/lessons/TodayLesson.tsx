import { LessonField } from "./LessonField";

interface Homework {
  title?: string;
}

interface LessonData {
  level?: string;
  lessonNumber?: number;
  topicName?: string;
  lines?: string;
  page?: string;
  teacherNotes?: string;
  homework?: Homework;
  surahName?: string;
  startAyah?: number;
  endAyah?: number;
  rule?: string;
  lessonTitle?: string;
  practice?: string;
  memorizationRange?: string;
  revisionPortion?: string;
  dailyTarget?: string;
}

interface TodayLessonProps {
  lesson: LessonData | "—" | null | undefined;
}

function DefaultLessonFields({ lesson }: { lesson: LessonData }) {
  return (
    <>
      {lesson.surahName && <LessonField label="Surah">{lesson.surahName}</LessonField>}
      {lesson.teacherNotes && (
        <LessonField label="Teacher Notes" spanFull>
          {lesson.teacherNotes}
        </LessonField>
      )}
    </>
  );
}

function ButtonsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3 text-sm">{children}</div>;
}

export function TodayLesson({ lesson }: TodayLessonProps) {
  if (!lesson || lesson === "—") {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No lesson has been assigned for today. Please check back later or contact your teacher.
      </p>
    );
  }

  const level = lesson.level;

  if (level === "Qaida Nooraniya") {
    return (
      <ButtonsGrid>
        {lesson.lessonNumber != null && (
          <LessonField label="Lesson">Lesson {lesson.lessonNumber}</LessonField>
        )}
        {lesson.topicName && <LessonField label="Topic">{lesson.topicName}</LessonField>}
        {lesson.lines && <LessonField label="Lines">{lesson.lines}</LessonField>}
        {lesson.page && <LessonField label="Page">{lesson.page}</LessonField>}
        {lesson.teacherNotes && (
          <LessonField label="Teacher Notes" spanFull>
            {lesson.teacherNotes}
          </LessonField>
        )}
        {lesson.homework?.title && (
          <LessonField label="Homework" colorScheme="amber">
            {lesson.homework.title}
          </LessonField>
        )}
      </ButtonsGrid>
    );
  }

  if (level === "Quran Reading") {
    return (
      <ButtonsGrid>
        {lesson.surahName && <LessonField label="Surah">{lesson.surahName}</LessonField>}
        {lesson.startAyah != null && (
          <LessonField label={lesson.endAyah != null ? "Read From" : "Ayah"}>
            Ayah {lesson.startAyah}
          </LessonField>
        )}
        {lesson.endAyah != null && <LessonField label="Read To">Ayah {lesson.endAyah}</LessonField>}
        {lesson.teacherNotes && (
          <LessonField label="Teacher Notes" spanFull>
            {lesson.teacherNotes}
          </LessonField>
        )}
        {lesson.homework?.title && (
          <LessonField label="Homework" colorScheme="amber">
            {lesson.homework.title}
          </LessonField>
        )}
      </ButtonsGrid>
    );
  }

  if (level === "Tajweed Program") {
    return (
      <ButtonsGrid>
        {lesson.rule && <LessonField label="Rule">{lesson.rule}</LessonField>}
        {lesson.lessonTitle && <LessonField label="Lesson">{lesson.lessonTitle}</LessonField>}
        {lesson.practice && (
          <LessonField label="Practice" spanFull>
            {lesson.practice}
          </LessonField>
        )}
        {lesson.teacherNotes && (
          <LessonField label="Teacher Notes" spanFull>
            {lesson.teacherNotes}
          </LessonField>
        )}
        {lesson.homework?.title && (
          <LessonField label="Homework" colorScheme="amber">
            {lesson.homework.title}
          </LessonField>
        )}
      </ButtonsGrid>
    );
  }

  if (level === "Hifz Program" || level === "Hifz Muraja'a") {
    return (
      <ButtonsGrid>
        {lesson.surahName && <LessonField label="Surah">{lesson.surahName}</LessonField>}
        {lesson.memorizationRange && (
          <LessonField label={level === "Hifz Muraja'a" ? "Revision Range" : "New Memorization"}>
            {lesson.memorizationRange}
          </LessonField>
        )}
        {lesson.revisionPortion && (
          <LessonField label="Revision">{lesson.revisionPortion}</LessonField>
        )}
        {lesson.dailyTarget && <LessonField label="Daily Target">{lesson.dailyTarget}</LessonField>}
        {lesson.teacherNotes && (
          <LessonField label="Teacher Notes" spanFull>
            {lesson.teacherNotes}
          </LessonField>
        )}
        {lesson.homework?.title && (
          <LessonField label="Homework" colorScheme="amber">
            {lesson.homework.title}
          </LessonField>
        )}
      </ButtonsGrid>
    );
  }

  return (
    <ButtonsGrid>
      <DefaultLessonFields lesson={lesson} />
      {lesson.homework?.title && (
        <LessonField label="Homework" colorScheme="amber">
          {lesson.homework.title}
        </LessonField>
      )}
    </ButtonsGrid>
  );
}
