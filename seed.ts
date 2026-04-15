import { db } from './src/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const tracks = [
  {
    id: 'track-a',
    title: 'Prompting Fundamentals',
    description: 'Die Kunst der präzisen Kommunikation mit KI.',
    chapters: [
      {
        id: 'ch1',
        title: 'Die Anatomie eines Prompts',
        lessons: [
          {
            id: 'l1',
            title: 'Kontext & Zielsetzung',
            content: 'Lerne, wie du der KI den richtigen Rahmen gibst.',
            exercise: {
              prompt: 'Schreibe einen Prompt für eine KI, die als Koch fungiert und ein Rezept für eine Suppe erstellt.',
              criteria: 'Der Prompt muss eine spezifische Rolle (Koch) und eine klare Zielsetzung enthalten.'
            }
          }
        ]
      }
    ]
  }
];

export async function seedDatabase() {
  for (const track of tracks) {
    const trackRef = doc(db, 'tracks', track.id);
    await setDoc(trackRef, { title: track.title, description: track.description });

    for (const chapter of track.chapters) {
      const chapterRef = doc(db, `tracks/${track.id}/chapters`, chapter.id);
      await setDoc(chapterRef, { title: chapter.title });

      for (const lesson of chapter.lessons) {
        const lessonRef = doc(db, `tracks/${track.id}/chapters/${chapter.id}/lessons`, lesson.id);
        await setDoc(lessonRef, lesson);
      }
    }
  }
  console.log("Database seeded successfully!");
}
